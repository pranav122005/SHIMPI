/**
 * SHIMPI Fashion – Cart Routes
 * All routes require authentication.
 *
 * GET    /api/v1/cart          full cart with totals
 * POST   /api/v1/cart          add item
 * PUT    /api/v1/cart/:id      update qty / notes
 * DELETE /api/v1/cart/:id      remove item
 * DELETE /api/v1/cart/clear    empty cart
 */
const router   = require('express').Router();
const { body } = require('express-validator');
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { ok, fail, validate } = require('../utils/helpers');

router.use(authenticate);

/* ── helper: build cart response with line totals ──────────────── */
const buildCart = (userId) => {
  const db   = getDb();
  const items = db.prepare(`
    SELECT ci.*,
           ct.name   AS clothing_name, ct.base_price,
           f.name    AS fabric_name,   f.price_per_meter,
           m.profile_name AS measurement_profile
    FROM   cart_items    ci
    JOIN   clothing_types ct ON ct.id = ci.clothing_type_id
    JOIN   fabrics         f  ON f.id  = ci.fabric_id
    LEFT   JOIN measurements m ON m.id = ci.measurement_id
    WHERE  ci.user_id = ?
    ORDER  BY ci.id DESC
  `).all(userId);

  // unit price = base_price + (price_per_meter * ~2.5 metres avg per garment)
  const enriched = items.map((item) => {
    const unit_price  = +(item.base_price + item.price_per_meter * 2.5).toFixed(2);
    const line_total  = +(unit_price * item.quantity).toFixed(2);
    return { ...item, unit_price, line_total };
  });

  const subtotal = enriched.reduce((s, i) => s + i.line_total, 0);
  const gst_rate = parseFloat(process.env.GST_RATE) || 0.18;
  const tax      = +(subtotal * gst_rate).toFixed(2);
  const total    = +(subtotal + tax).toFixed(2);

  return { items: enriched, subtotal: +subtotal.toFixed(2), tax, total, item_count: enriched.length };
};

/* ── GET / ────────────────────────────────────────────────────── */
router.get('/', (req, res) => ok(res, buildCart(req.user.id)));

/* ── POST / ───────────────────────────────────────────────────── */
router.post('/', [
  body('clothing_type_id').isInt({ gt: 0 }),
  body('fabric_id').isInt({ gt: 0 }),
  body('quantity').optional().isInt({ min: 1, max: 10 }),
  body('measurement_id').optional().isInt({ gt: 0 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();
  const { clothing_type_id, fabric_id, measurement_id, quantity = 1, custom_notes } = req.body;

  // validate references
  if (!db.prepare('SELECT id FROM clothing_types WHERE id = ? AND is_active = 1').get(clothing_type_id))
    return fail(res, 'Invalid clothing type');
  if (!db.prepare('SELECT id FROM fabrics WHERE id = ? AND is_active = 1').get(fabric_id))
    return fail(res, 'Invalid fabric');
  if (measurement_id) {
    if (!db.prepare('SELECT id FROM measurements WHERE id = ? AND user_id = ?').get(measurement_id, req.user.id))
      return fail(res, 'Measurement profile not found');
  }

  // merge if same combination already in cart
  const existing = db.prepare(
    'SELECT id, quantity FROM cart_items WHERE user_id=? AND clothing_type_id=? AND fabric_id=?'
  ).get(req.user.id, clothing_type_id, fabric_id);

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(existing.quantity + quantity, existing.id);
  } else {
    db.prepare(`
      INSERT INTO cart_items (user_id, clothing_type_id, fabric_id, measurement_id, quantity, custom_notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, clothing_type_id, fabric_id, measurement_id || null, quantity, custom_notes || null);
  }

  ok(res, buildCart(req.user.id), 'Item added to cart', 201);
});

/* ── PUT /:id ─────────────────────────────────────────────────── */
router.put('/:id', [
  body('quantity').optional().isInt({ min: 1, max: 10 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const db   = getDb();
  const item = db.prepare('SELECT * FROM cart_items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!item) return fail(res, 'Cart item not found', 404);

  const { quantity, measurement_id, custom_notes } = req.body;
  const fields = [];
  const vals   = [];
  if (quantity       !== undefined) { fields.push('quantity = ?');       vals.push(quantity); }
  if (measurement_id !== undefined) { fields.push('measurement_id = ?'); vals.push(measurement_id); }
  if (custom_notes   !== undefined) { fields.push('custom_notes = ?');   vals.push(custom_notes); }
  if (!fields.length) return fail(res, 'Nothing to update');

  vals.push(item.id);
  db.prepare(`UPDATE cart_items SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  ok(res, buildCart(req.user.id), 'Cart updated');
});

/* ── DELETE /:id ──────────────────────────────────────────────── */
router.delete('/:id', (req, res) => {
  const db   = getDb();
  const item = db.prepare('SELECT id FROM cart_items WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!item) return fail(res, 'Cart item not found', 404);
  db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
  ok(res, buildCart(req.user.id), 'Item removed');
});

/* ── DELETE /clear ────────────────────────────────────────────── */
router.delete('/clear', (req, res) => {
  getDb().prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  ok(res, { items: [], subtotal: 0, tax: 0, total: 0, item_count: 0 }, 'Cart cleared');
});

module.exports = router;
