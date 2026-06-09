/**
 * SHIMPI Fashion – Notification Routes
 *
 * GET    /api/v1/notifications                list (unread count included)
 * PATCH  /api/v1/notifications/:id/read       mark one as read
 * PATCH  /api/v1/notifications/mark-all-read  mark all as read
 * DELETE /api/v1/notifications/:id            delete
 * DELETE /api/v1/notifications/clear-all      delete all
 */
const router = require('express').Router();
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { ok, fail, paginated, pageParams } = require('../utils/helpers');

router.use(authenticate);

/* ── GET / ────────────────────────────────────────────────────── */
router.get('/', (req, res) => {
  const db = getDb();
  const { page, limit, offset } = pageParams(req.query);
  const total   = db.prepare('SELECT COUNT(*) AS c FROM notifications WHERE user_id = ?').get(req.user.id).c;
  const unread  = db.prepare('SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).c;
  const rows    = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(req.user.id, limit, offset);

  paginated(res, { notifications: rows, unread_count: unread }, total, page, limit);
});

/* ── PATCH /:id/read ──────────────────────────────────────────── */
router.patch('/:id/read', (req, res) => {
  const db = getDb();
  const n  = db.prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!n) return fail(res, 'Notification not found', 404);
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(n.id);
  ok(res, null, 'Marked as read');
});

/* ── PATCH /mark-all-read ─────────────────────────────────────── */
router.patch('/mark-all-read', (req, res) => {
  getDb().prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  ok(res, null, 'All notifications marked as read');
});

/* ── DELETE /:id ──────────────────────────────────────────────── */
router.delete('/:id', (req, res) => {
  const db = getDb();
  const n  = db.prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!n) return fail(res, 'Notification not found', 404);
  db.prepare('DELETE FROM notifications WHERE id = ?').run(n.id);
  ok(res, null, 'Notification deleted');
});

/* ── DELETE /clear-all ────────────────────────────────────────── */
router.delete('/clear-all', (req, res) => {
  getDb().prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);
  ok(res, null, 'All notifications cleared');
});

module.exports = router;
