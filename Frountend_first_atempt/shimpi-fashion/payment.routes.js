/**
 * SHIMPI Fashion – Payment Routes
 * Simulated gateway – swap in Razorpay / Stripe by replacing the
 * processPayment() stub below and adding webhook verification.
 *
 * POST   /api/v1/payments/initiate           start payment for an order
 * POST   /api/v1/payments/verify             mark payment success/failure
 * GET    /api/v1/payments/order/:orderId      payment history for an order
 */
const router   = require('express').Router();
const { body } = require('express-validator');
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { ok, fail, validate, notify } = require('../utils/helpers');

router.use(authenticate);

/* ── Stub: replace with real gateway call ────────────────────── */
const processPayment = ({ method, amount }) => ({
  success: true,
  transaction_id: `TXN${Date.now()}`,
  gateway_response: JSON.stringify({ method, amount, status: 'captured' }),
});

/* ── POST /initiate ───────────────────────────────────────────── */
router.post('/initiate', [
  body('order_id').isInt({ gt: 0 }),
  body('payment_method').isIn(['cash','card','upi','netbanking','wallet']),
], (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();
  const { order_id, payment_method } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
  if (!order) return fail(res, 'Order not found', 404);
  if (order.payment_status === 'paid') return fail(res, 'Order is already fully paid');
  if (order.status === 'cancelled') return fail(res, 'Cannot pay for a cancelled order');

  const result = db.prepare(`
    INSERT INTO payments (order_id, amount, payment_method, status)
    VALUES (?, ?, ?, 'pending')
  `).run(order_id, order.final_amount, payment_method);

  ok(res, {
    payment_id:     result.lastInsertRowid,
    order_number:   order.order_number,
    amount:         order.final_amount,
    payment_method,
    status:         'pending',
    // In real implementation return: razorpay_order_id, stripe_client_secret, etc.
    meta: { note: 'Call /payments/verify to complete the transaction' },
  }, 'Payment initiated', 201);
});

/* ── POST /verify ────────────────────────────────────────────── */
router.post('/verify', [
  body('payment_id').isInt({ gt: 0 }),
  body('order_id').isInt({ gt: 0 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();
  const { payment_id, order_id } = req.body;

  const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND order_id = ?').get(payment_id, order_id);
  if (!payment) return fail(res, 'Payment record not found', 404);
  if (payment.status !== 'pending') return fail(res, `Payment already ${payment.status}`);

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
  if (!order) return fail(res, 'Order not found', 404);

  // call gateway stub
  const gw = processPayment({ method: payment.payment_method, amount: payment.amount });

  if (gw.success) {
    db.prepare(`
      UPDATE payments
      SET status='success', transaction_id=?, gateway_response=?, paid_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(gw.transaction_id, gw.gateway_response, payment.id);

    db.prepare("UPDATE orders SET payment_status='paid', status='confirmed', updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .run(order.id);

    db.prepare('INSERT INTO order_status_history (order_id, status, note, changed_by) VALUES (?, ?, ?, ?)')
      .run(order.id, 'confirmed', 'Payment received – order confirmed', req.user.id);

    notify(req.user.id, 'Payment Successful',
      `₹${payment.amount.toFixed(2)} received for order #${order.order_number}.`,
      'payment', order.id, 'order');

    ok(res, { transaction_id: gw.transaction_id, status: 'success' }, 'Payment successful');
  } else {
    db.prepare("UPDATE payments SET status='failed' WHERE id=?").run(payment.id);
    fail(res, 'Payment failed. Please try again.', 402);
  }
});

/* ── GET /order/:orderId ─────────────────────────────────────── */
router.get('/order/:orderId', (req, res) => {
  const db    = getDb();
  const order = db.prepare('SELECT id FROM orders WHERE id = ? AND user_id = ?')
    .get(req.params.orderId, req.user.id);
  if (!order) return fail(res, 'Order not found', 404);

  const payments = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC').all(order.id);
  ok(res, payments);
});

module.exports = router;
