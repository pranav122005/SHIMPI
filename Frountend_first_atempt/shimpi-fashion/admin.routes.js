/**
 * SHIMPI Fashion – Admin Panel Routes
 * All routes require admin role.
 *
 * GET    /api/v1/admin/dashboard          stats overview
 * GET    /api/v1/admin/users              list all users
 * PATCH  /api/v1/admin/users/:id          update role / active status
 * GET    /api/v1/admin/tailors            list tailors
 * GET    /api/v1/admin/orders             all orders (filterable)
 * PATCH  /api/v1/admin/orders/:id/status  update order status
 * PATCH  /api/v1/admin/orders/:id/assign  assign tailor
 * GET    /api/v1/admin/appointments       all appointments
 * PATCH  /api/v1/admin/appointments/:id   update appointment (confirm / complete)
 * GET    /api/v1/admin/revenue            revenue analytics
 */
const router = require('express').Router();
const { body } = require('express-validator');
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { isAdmin }      = require('../middleware/admin');
const { ok, fail, paginated, validate, pageParams, notify } = require('../utils/helpers');

router.use(authenticate, isAdmin);

const ORDER_STATUSES = ['pending','confirmed','cutting','stitching','quality_check','ready','dispatched','delivered','cancelled'];

/* ── GET /dashboard ───────────────────────────────────────────── */
router.get('/dashboard', (req, res) => {
  const db = getDb();

  const customers     = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role='customer'").get().c;
  const tailors       = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role='tailor'").get().c;
  const totalOrders   = db.prepare('SELECT COUNT(*) AS c FROM orders').get().c;
  const pendingOrders = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status IN ('pending','confirmed','cutting','stitching','quality_check','ready')").get().c;
  const totalRevenue  = db.prepare("SELECT COALESCE(SUM(final_amount),0) AS s FROM orders WHERE payment_status='paid'").get().s;
  const todayRevenue  = db.prepare("SELECT COALESCE(SUM(final_amount),0) AS s FROM orders WHERE payment_status='paid' AND DATE(created_at)=DATE('now')").get().s;
  const todayOrders   = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE DATE(created_at)=DATE('now')").get().c;
  const pendingAppts  = db.prepare("SELECT COUNT(*) AS c FROM appointments WHERE status='scheduled'").get().c;

  const recentOrders = db.prepare(`
    SELECT o.*, u.name AS customer_name
    FROM orders o JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();

  const statusBreakdown = db.prepare(`
    SELECT status, COUNT(*) AS count FROM orders GROUP BY status
  `).all();

  const topProducts = db.prepare(`
    SELECT ct.name, COUNT(oi.id) AS order_count, SUM(oi.total_price) AS revenue
    FROM order_items oi JOIN clothing_types ct ON ct.id = oi.clothing_type_id
    GROUP BY ct.id ORDER BY order_count DESC LIMIT 5
  `).all();

  ok(res, {
    summary: { customers, tailors, total_orders: totalOrders, pending_orders: pendingOrders,
               total_revenue: +totalRevenue.toFixed(2), today_revenue: +todayRevenue.toFixed(2),
               today_orders: todayOrders, pending_appointments: pendingAppts },
    recent_orders:    recentOrders,
    status_breakdown: statusBreakdown,
    top_products:     topProducts,
  });
});

/* ── GET /users ───────────────────────────────────────────────── */
router.get('/users', (req, res) => {
  const db = getDb();
  const { page, limit, offset } = pageParams(req.query);
  const { role, search, is_active } = req.query;

  let where  = [];
  const vals = [];
  if (role)      { where.push('role = ?');         vals.push(role); }
  if (search)    { where.push('(name LIKE ? OR email LIKE ?)'); vals.push(`%${search}%`, `%${search}%`); }
  if (is_active !== undefined) { where.push('is_active = ?'); vals.push(+is_active); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) AS c FROM users ${clause}`).get(...vals).c;
  const users = db.prepare(`
    SELECT id, name, email, phone, role, is_active, profile_image, created_at
    FROM users ${clause} ORDER BY id DESC LIMIT ? OFFSET ?
  `).all(...vals, limit, offset);

  paginated(res, users, total, page, limit);
});

/* ── PATCH /users/:id ─────────────────────────────────────────── */
router.patch('/users/:id', [
  body('role').optional().isIn(['customer','admin','tailor']),
  body('is_active').optional().isBoolean(),
], (req, res) => {
  if (!validate(req, res)) return;
  const db   = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return fail(res, 'User not found', 404);

  const fields = [];
  const vals   = [];
  if (req.body.role      !== undefined) { fields.push('role = ?');      vals.push(req.body.role); }
  if (req.body.is_active !== undefined) { fields.push('is_active = ?'); vals.push(req.body.is_active ? 1 : 0); }
  if (!fields.length) return fail(res, 'Nothing to update');

  fields.push('updated_at = CURRENT_TIMESTAMP');
  vals.push(user.id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  ok(res, null, 'User updated');
});

/* ── GET /tailors ─────────────────────────────────────────────── */
router.get('/tailors', (req, res) => {
  const tailors = getDb()
    .prepare("SELECT id, name, email, phone, is_active FROM users WHERE role = 'tailor' ORDER BY name")
    .all();
  ok(res, tailors);
});

/* ── GET /orders ──────────────────────────────────────────────── */
router.get('/orders', (req, res) => {
  const db = getDb();
  const { page, limit, offset } = pageParams(req.query);
  const { status, payment_status, tailor_id, search, from_date, to_date } = req.query;

  let where  = [];
  const vals = [];
  if (status)         { where.push('o.status = ?');         vals.push(status); }
  if (payment_status) { where.push('o.payment_status = ?'); vals.push(payment_status); }
  if (tailor_id)      { where.push('o.tailor_id = ?');      vals.push(+tailor_id); }
  if (search)         { where.push('(o.order_number LIKE ? OR u.name LIKE ?)'); vals.push(`%${search}%`, `%${search}%`); }
  if (from_date)      { where.push('DATE(o.created_at) >= ?'); vals.push(from_date); }
  if (to_date)        { where.push('DATE(o.created_at) <= ?'); vals.push(to_date); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) AS c FROM orders o JOIN users u ON u.id=o.user_id ${clause}`).get(...vals).c;
  const orders = db.prepare(`
    SELECT o.*, u.name AS customer_name, u.email AS customer_email,
           t.name AS tailor_name
    FROM   orders o
    JOIN   users  u ON u.id = o.user_id
    LEFT   JOIN users t ON t.id = o.tailor_id
    ${clause}
    ORDER  BY o.created_at DESC
    LIMIT  ? OFFSET ?
  `).all(...vals, limit, offset);

  paginated(res, orders, total, page, limit);
});

/* ── PATCH /orders/:id/status ─────────────────────────────────── */
router.patch('/orders/:id/status', [
  body('status').isIn(ORDER_STATUSES),
  body('note').optional().isString(),
], (req, res) => {
  if (!validate(req, res)) return;
  const db    = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return fail(res, 'Order not found', 404);

  const { status, note } = req.body;
  db.prepare("UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(status, order.id);
  db.prepare('INSERT INTO order_status_history (order_id, status, note, changed_by) VALUES (?,?,?,?)')
    .run(order.id, status, note || `Status updated to ${status}`, req.user.id);

  notify(order.user_id, 'Order Update',
    `Your order #${order.order_number} status is now: ${status.replace('_',' ')}.`,
    'order', order.id, 'order');

  ok(res, null, `Order status updated to '${status}'`);
});

/* ── PATCH /orders/:id/assign ─────────────────────────────────── */
router.patch('/orders/:id/assign', [
  body('tailor_id').isInt({ gt: 0 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const db     = getDb();
  const order  = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return fail(res, 'Order not found', 404);

  const tailor = db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'tailor'").get(req.body.tailor_id);
  if (!tailor) return fail(res, 'Tailor not found', 404);

  db.prepare('UPDATE orders SET tailor_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(tailor.id, order.id);

  notify(order.user_id, 'Tailor Assigned',
    `${tailor.name} has been assigned to your order #${order.order_number}.`,
    'order', order.id, 'order');

  ok(res, null, `Tailor ${tailor.name} assigned to order`);
});

/* ── GET /appointments ────────────────────────────────────────── */
router.get('/appointments', (req, res) => {
  const db = getDb();
  const { page, limit, offset } = pageParams(req.query);
  const { status, type } = req.query;

  let where  = [];
  const vals = [];
  if (status) { where.push('a.status = ?');             vals.push(status); }
  if (type)   { where.push('a.appointment_type = ?');   vals.push(type); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) AS c FROM appointments a ${clause}`).get(...vals).c;
  const rows  = db.prepare(`
    SELECT a.*, u.name AS customer_name, t.name AS tailor_name
    FROM   appointments a
    JOIN   users        u ON u.id = a.user_id
    LEFT   JOIN users   t ON t.id = a.tailor_id
    ${clause}
    ORDER  BY a.scheduled_at ASC
    LIMIT  ? OFFSET ?
  `).all(...vals, limit, offset);

  paginated(res, rows, total, page, limit);
});

/* ── PATCH /appointments/:id ──────────────────────────────────── */
router.patch('/appointments/:id', [
  body('status').optional().isIn(['scheduled','confirmed','completed','cancelled','no_show']),
  body('tailor_id').optional().isInt({ gt: 0 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const db   = getDb();
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) return fail(res, 'Appointment not found', 404);

  const fields = ['updated_at = CURRENT_TIMESTAMP'];
  const vals   = [];
  if (req.body.status    !== undefined) { fields.push('status = ?');    vals.push(req.body.status); }
  if (req.body.tailor_id !== undefined) { fields.push('tailor_id = ?'); vals.push(req.body.tailor_id); }
  if (req.body.notes     !== undefined) { fields.push('notes = ?');     vals.push(req.body.notes); }
  vals.push(appt.id);
  db.prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`).run(...vals);

  ok(res, null, 'Appointment updated');
});

/* ── GET /revenue ─────────────────────────────────────────────── */
router.get('/revenue', (req, res) => {
  const db = getDb();
  const { period = '30' } = req.query; // days

  const daily = db.prepare(`
    SELECT DATE(created_at) AS date, COUNT(*) AS orders, SUM(final_amount) AS revenue
    FROM orders WHERE payment_status='paid'
      AND created_at >= DATE('now', ? )
    GROUP BY DATE(created_at) ORDER BY date ASC
  `).all(`-${parseInt(period)} days`);

  const byProduct = db.prepare(`
    SELECT ct.name, SUM(oi.total_price) AS revenue, COUNT(oi.id) AS qty
    FROM order_items oi JOIN clothing_types ct ON ct.id = oi.clothing_type_id
    GROUP BY ct.id ORDER BY revenue DESC
  `).all();

  const totals = db.prepare(`
    SELECT COUNT(*) AS order_count,
           COALESCE(SUM(final_amount),0) AS gross_revenue,
           COALESCE(SUM(discount_amount),0) AS total_discounts,
           COALESCE(SUM(tax_amount),0) AS total_tax
    FROM orders WHERE payment_status='paid'
      AND created_at >= DATE('now', ?)
  `).get(`-${parseInt(period)} days`);

  ok(res, { period_days: +period, totals, daily_revenue: daily, by_product: byProduct });
});

module.exports = router;
