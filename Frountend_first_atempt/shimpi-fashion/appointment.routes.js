/**
 * SHIMPI Fashion – Appointment Booking Routes
 *
 * GET    /api/v1/appointments          user's appointments
 * POST   /api/v1/appointments          book
 * GET    /api/v1/appointments/:id      detail
 * PUT    /api/v1/appointments/:id      reschedule / update
 * DELETE /api/v1/appointments/:id      cancel
 */
const router   = require('express').Router();
const { body } = require('express-validator');
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { ok, fail, paginated, validate, pageParams, notify } = require('../utils/helpers');

router.use(authenticate);

/* ── GET / ────────────────────────────────────────────────────── */
router.get('/', (req, res) => {
  const db = getDb();
  const { page, limit, offset } = pageParams(req.query);
  const { status } = req.query;

  let where  = ['a.user_id = ?'];
  const vals = [req.user.id];
  if (status) { where.push('a.status = ?'); vals.push(status); }
  const clause = 'WHERE ' + where.join(' AND ');

  const total = db.prepare(`SELECT COUNT(*) AS c FROM appointments a ${clause}`).get(...vals).c;
  const rows  = db.prepare(`
    SELECT a.*, u.name AS tailor_name
    FROM   appointments a
    LEFT   JOIN users   u ON u.id = a.tailor_id
    ${clause}
    ORDER  BY a.scheduled_at ASC
    LIMIT  ? OFFSET ?
  `).all(...vals, limit, offset);

  paginated(res, rows, total, page, limit);
});

/* ── POST / ───────────────────────────────────────────────────── */
router.post('/', [
  body('appointment_type').isIn(['measurement','fitting','delivery','consultation'])
    .withMessage('appointment_type must be measurement | fitting | delivery | consultation'),
  body('scheduled_at').isISO8601().withMessage('scheduled_at must be a valid ISO date'),
  body('duration_minutes').optional().isInt({ min: 15, max: 240 }),
  body('order_id').optional().isInt({ gt: 0 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();
  const { appointment_type, scheduled_at, duration_minutes = 30, location, notes, order_id } = req.body;

  // optional: verify order belongs to user
  if (order_id) {
    const ord = db.prepare('SELECT id FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
    if (!ord) return fail(res, 'Order not found');
  }

  const result = db.prepare(`
    INSERT INTO appointments (user_id, order_id, appointment_type, scheduled_at, duration_minutes, location, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, order_id || null, appointment_type, scheduled_at, duration_minutes,
         location || null, notes || null);

  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid);

  notify(req.user.id, 'Appointment Booked',
    `Your ${appointment_type} appointment is scheduled for ${new Date(scheduled_at).toDateString()}.`,
    'appointment', appt.id, 'appointment');

  ok(res, appt, 'Appointment booked', 201);
});

/* ── GET /:id ─────────────────────────────────────────────────── */
router.get('/:id', (req, res) => {
  const appt = getDb().prepare(`
    SELECT a.*, u.name AS tailor_name
    FROM   appointments a
    LEFT   JOIN users   u ON u.id = a.tailor_id
    WHERE  a.id = ? AND a.user_id = ?
  `).get(req.params.id, req.user.id);
  if (!appt) return fail(res, 'Appointment not found', 404);
  ok(res, appt);
});

/* ── PUT /:id ─────────────────────────────────────────────────── */
router.put('/:id', [
  body('scheduled_at').optional().isISO8601(),
  body('duration_minutes').optional().isInt({ min: 15 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const db   = getDb();
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!appt) return fail(res, 'Appointment not found', 404);
  if (['completed','cancelled'].includes(appt.status))
    return fail(res, `Cannot update a ${appt.status} appointment`);

  const fields = ['updated_at = CURRENT_TIMESTAMP'];
  const vals   = [];
  ['scheduled_at','duration_minutes','location','notes'].forEach((f) => {
    if (req.body[f] !== undefined) { fields.push(`${f} = ?`); vals.push(req.body[f]); }
  });
  vals.push(appt.id);
  db.prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`).run(...vals);

  ok(res, db.prepare('SELECT * FROM appointments WHERE id = ?').get(appt.id), 'Appointment updated');
});

/* ── DELETE /:id (cancel) ─────────────────────────────────────── */
router.delete('/:id', (req, res) => {
  const db   = getDb();
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!appt) return fail(res, 'Appointment not found', 404);
  if (['completed','cancelled'].includes(appt.status))
    return fail(res, `Appointment is already ${appt.status}`);

  db.prepare("UPDATE appointments SET status='cancelled', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(appt.id);
  ok(res, null, 'Appointment cancelled');
});

module.exports = router;
