/**
 * SHIMPI Fashion – Order Routes
 *
 * GET    /api/v1/orders              user's orders (paginated)
 * POST   /api/v1/orders              place order (from cart or custom items)
 * GET    /api/v1/orders/:id          order detail + items
 * GET    /api/v1/orders/:id/tracking status history
 * GET    /api/v1/orders/:id/invoice  invoice summary
 * DELETE /api/v1/orders/:id/cancel   cancel (pending/confirmed only)
 */
const router   = require('express').Router();
const { body } = require('express-validator');
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { ok, fail, paginated, validate, pageParams, generateOrderNumber, notify } = require('../utils/helpers');

router.use(authenticate);

const GST = () => parseFloat(process.env.GST_RATE) || 0.18;

/* ── helper: calculate item price ───────────────────────────────── */
const calcUnitPrice = (base_price, price_per_meter) =>
  +(base_price + price_per_meter * 2.5).toFixed(2);

/* ── GET / ─────────────────────────────────────────────────────── */
router.get('/', (req, res) => {
  const db = getDb();
  const { page, limit, offset } = pageParams(req.query);
  const { status } = req.query;

  let where  = ['o.user_id = ?'];
  const vals = [req.user.id];
  if (status) { where.push('o.status = ?'); vals.push(status); }
  const clause = 'WHERE ' + where.join(' AND ');

  const total = db.prepare(`SELECT COUNT(*) AS c FROM orders o ${clause}`).get(...vals).c;
  const orders = db.prepare(`
    SELECT o.*,
           u.name AS tailor_name,
           a.city, a.state
    FROM   orders        o
    LEFT   JOIN users    u ON u.id = o.tailor_id
    LEFT   JOIN user_addresses a ON a.id = o.delivery_address_id
    ${clause}
    ORDER  BY o.created_at DESC
    LIMIT  ? OFFSET ?
  `).all(...vals, limit, offset);

  paginated(res, orders, total, page, limit);
});

/* ── POST / ─────────────────────────────────────────────────────── */
router.post('/', [
  body('delivery_address_id').isInt({ gt: 0 }),
  body('items').optional().isArray({ min: 1 }),
  body('coupon_code').optional().isString(),
  body('special_instructions').optional().isString(),
], (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();
  const { delivery_address_id, items: directItems, coupon_code, special_instructions } = req.body;

  // verify address belongs to user
  const address = db.prepare('SELECT * FROM user_addresses WHERE id = ? AND user_id = ?')
    .get(delivery_address_id, req.user.id);
  if (!address) return fail(res, 'Delivery address not found');

  // collect order items – either from cart or request body
  let orderItems = [];

  if (directItems && directItems.length) {
    // direct custom order
    for (const item of directItems) {
      const ct = db.prepare('SELECT * FROM clothing_types WHERE id = ? AND is_active = 1').get(item.clothing_type_id);
      const fb = db.prepare('SELECT * FROM fabrics WHERE id = ? AND is_active = 1').get(item.fabric_id);
      if (!ct) return fail(res, `Invalid clothing type id: ${item.clothing_type_id}`);
      if (!fb) return fail(res, `Invalid fabric id: ${item.fabric_id}`);
      const unit_price  = calcUnitPrice(ct.base_price, fb.price_per_meter);
      const total_price = +(unit_price * (item.quantity || 1)).toFixed(2);
      orderItems.push({ ...item, unit_price, total_price, quantity: item.quantity || 1 });
    }
  } else {
    // from cart
    const cartItems = db.prepare(`
      SELECT ci.*, ct.base_price, f.price_per_meter
      FROM   cart_items     ci
      JOIN   clothing_types ct ON ct.id = ci.clothing_type_id
      JOIN   fabrics         f  ON f.id  = ci.fabric_id
      WHERE  ci.user_id = ?
    `).all(req.user.id);
    if (!cartItems.length) return fail(res, 'Cart is empty');
    orderItems = cartItems.map((ci) => {
      const unit_price  = calcUnitPrice(ci.base_price, ci.price_per_meter);
      const total_price = +(unit_price * ci.quantity).toFixed(2);
      return { clothing_type_id: ci.clothing_type_id, fabric_id: ci.fabric_id,
               measurement_id: ci.measurement_id, quantity: ci.quantity,
               custom_notes: ci.custom_notes, unit_price, total_price };
    });
  }

  // apply coupon
  let discount = 0;
  if (coupon_code) {
    const now = new Date().toISOString();
    const coupon = db.prepare(`
      SELECT * FROM coupons
      WHERE code = ? AND is_active = 1
        AND (expires_at IS NULL OR expires_at > ?)
        AND (usage_limit IS NULL OR used_count < usage_limit)
    `).get(coupon_code.toUpperCase(), now);

    if (coupon) {
      const subtotalRaw = orderItems.reduce((s, i) => s + i.total_price, 0);
      if (subtotalRaw >= (coupon.min_order_value || 0)) {
        discount = coupon.discount_type === 'percentage'
          ? +(subtotalRaw * coupon.discount_value / 100).toFixed(2)
          : +coupon.discount_value.toFixed(2);
        if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
        db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(coupon.id);
      }
    }
  }

  const subtotal     = +orderItems.reduce((s, i) => s + i.total_price, 0).toFixed(2);
  const discounted   = +(subtotal - discount).toFixed(2);
  const tax          = +(discounted * GST()).toFixed(2);
  const final_amount = +(discounted + tax).toFixed(2);

  // estimate delivery
  const maxDays = Math.max(...orderItems.map((i) => {
    const ct = db.prepare('SELECT estimated_days FROM clothing_types WHERE id = ?').get(i.clothing_type_id);
    return ct?.estimated_days || 7;
  }));
  const estDate = new Date();
  estDate.setDate(estDate.getDate() + maxDays);

  // create order in a transaction
  const order_number = generateOrderNumber();
  const txn = db.transaction(() => {
    const { lastInsertRowid: orderId } = db.prepare(`
      INSERT INTO orders (order_number, user_id, subtotal, discount_amount, tax_amount, final_amount,
                          coupon_code, delivery_address_id, special_instructions, estimated_delivery)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(order_number, req.user.id, subtotal, discount, tax, final_amount,
           coupon_code?.toUpperCase() || null, delivery_address_id,
           special_instructions || null, estDate.toISOString().split('T')[0]);

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, clothing_type_id, fabric_id, measurement_id, quantity, unit_price, total_price, custom_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const i of orderItems)
      insertItem.run(orderId, i.clothing_type_id, i.fabric_id, i.measurement_id || null,
                     i.quantity, i.unit_price, i.total_price, i.custom_notes || null);

    // log status
    db.prepare('INSERT INTO order_status_history (order_id, status, note, changed_by) VALUES (?, ?, ?, ?)')
      .run(orderId, 'pending', 'Order placed', req.user.id);

    // clear cart
    if (!directItems?.length)
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

    return orderId;
  });

  const orderId = txn();

  notify(req.user.id, 'Order Placed!',
    `Your order #${order_number} has been placed. Estimated delivery: ${estDate.toDateString()}.`,
    'order', orderId, 'order');

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  ok(res, order, 'Order placed successfully', 201);
});

/* ── GET /:id ─────────────────────────────────────────────────── */
router.get('/:id', (req, res) => {
  const db    = getDb();
  const order = db.prepare(`
    SELECT o.*, u.name AS tailor_name, a.address_line1, a.address_line2,
           a.city, a.state, a.pincode
    FROM   orders         o
    LEFT   JOIN users     u ON u.id = o.tailor_id
    LEFT   JOIN user_addresses a ON a.id = o.delivery_address_id
    WHERE  o.id = ? AND o.user_id = ?
  `).get(req.params.id, req.user.id);
  if (!order) return fail(res, 'Order not found', 404);

  const items = db.prepare(`
    SELECT oi.*, ct.name AS clothing_name, f.name AS fabric_name,
           m.profile_name AS measurement_profile
    FROM   order_items     oi
    JOIN   clothing_types  ct ON ct.id = oi.clothing_type_id
    JOIN   fabrics          f  ON f.id  = oi.fabric_id
    LEFT   JOIN measurements m  ON m.id  = oi.measurement_id
    WHERE  oi.order_id = ?
  `).all(order.id);

  ok(res, { ...order, items });
});

/* ── GET /:id/tracking ─────────────────────────────────────────── */
router.get('/:id/tracking', (req, res) => {
  const db    = getDb();
  const order = db.prepare('SELECT id, order_number, status FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!order) return fail(res, 'Order not found', 404);

  const history = db.prepare(`
    SELECT h.*, u.name AS updated_by
    FROM   order_status_history h
    LEFT   JOIN users u ON u.id = h.changed_by
    WHERE  h.order_id = ?
    ORDER  BY h.changed_at ASC
  `).all(order.id);

  ok(res, { order, history });
});

/* ── GET /:id/invoice ──────────────────────────────────────────── */
router.get('/:id/invoice', (req, res) => {
  const db    = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!order) return fail(res, 'Order not found', 404);

  const items = db.prepare(`
    SELECT oi.*, ct.name AS clothing_name, f.name AS fabric_name
    FROM order_items oi
    JOIN clothing_types ct ON ct.id = oi.clothing_type_id
    JOIN fabrics f ON f.id = oi.fabric_id
    WHERE oi.order_id = ?
  `).all(order.id);

  const customer = db.prepare('SELECT name, email, phone FROM users WHERE id = ?').get(req.user.id);
  const address  = db.prepare('SELECT * FROM user_addresses WHERE id = ?').get(order.delivery_address_id);

  ok(res, {
    invoice_no: `INV-${order.order_number}`,
    date: order.created_at,
    customer, address,
    order: {
      order_number: order.order_number,
      status: order.status,
      items,
      subtotal:        order.subtotal,
      discount:        order.discount_amount,
      gst_18_percent:  order.tax_amount,
      total:           order.final_amount,
      payment_status:  order.payment_status,
    },
    brand: { name: 'SHIMPI Fashion', tagline: 'Stitched to Perfection' },
  });
});

/* ── DELETE /:id/cancel ────────────────────────────────────────── */
router.delete('/:id/cancel', (req, res) => {
  const db    = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!order) return fail(res, 'Order not found', 404);
  if (!['pending','confirmed'].includes(order.status))
    return fail(res, `Order cannot be cancelled in '${order.status}' status`);

  db.prepare("UPDATE orders SET status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(order.id);
  db.prepare('INSERT INTO order_status_history (order_id, status, note, changed_by) VALUES (?, ?, ?, ?)')
    .run(order.id, 'cancelled', req.body.reason || 'Cancelled by customer', req.user.id);

  notify(req.user.id, 'Order Cancelled', `Order #${order.order_number} has been cancelled.`, 'order', order.id, 'order');
  ok(res, null, 'Order cancelled');
});

module.exports = router;
