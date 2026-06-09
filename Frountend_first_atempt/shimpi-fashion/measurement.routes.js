/**
 * SHIMPI Fashion – Measurement Profiles Routes
 * All routes require authentication.
 *
 * GET    /api/v1/measurements           list user's profiles
 * GET    /api/v1/measurements/:id       single
 * POST   /api/v1/measurements           create
 * PUT    /api/v1/measurements/:id       update
 * DELETE /api/v1/measurements/:id       delete
 * PATCH  /api/v1/measurements/:id/default  set as default
 */
const router   = require('express').Router();
const { body } = require('express-validator');
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { ok, fail, validate } = require('../utils/helpers');

router.use(authenticate);

const measureFields = [
  'chest','waist','hips','shoulder','sleeve_length',
  'trouser_length','inseam','neck','wrist','back_length',
];

/* ── GET / ────────────────────────────────────────────────────── */
router.get('/', (req, res) => {
  const rows = getDb()
    .prepare('SELECT * FROM measurements WHERE user_id = ? ORDER BY is_default DESC, id DESC')
    .all(req.user.id);
  ok(res, rows);
});

/* ── GET /:id ─────────────────────────────────────────────────── */
router.get('/:id', (req, res) => {
  const m = getDb()
    .prepare('SELECT * FROM measurements WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!m) return fail(res, 'Measurement profile not found', 404);
  ok(res, m);
});

/* ── POST / ───────────────────────────────────────────────────── */
router.post('/', [
  body('profile_name').optional().trim().notEmpty(),
  body('unit').optional().isIn(['inches','cm']),
  ...measureFields.map((f) => body(f).optional().isFloat({ min: 0, max: 200 })),
], (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();

  const {
    profile_name = 'My Measurements', unit = 'inches',
    chest, waist, hips, shoulder, sleeve_length,
    trouser_length, inseam, neck, wrist, back_length, notes,
    is_default = 0,
  } = req.body;

  if (is_default)
    db.prepare('UPDATE measurements SET is_default = 0 WHERE user_id = ?').run(req.user.id);

  const result = db.prepare(`
    INSERT INTO measurements
      (user_id, profile_name, chest, waist, hips, shoulder, sleeve_length,
       trouser_length, inseam, neck, wrist, back_length, unit, notes, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, profile_name, chest, waist, hips, shoulder, sleeve_length,
         trouser_length, inseam, neck, wrist, back_length, unit, notes || null,
         is_default ? 1 : 0);

  ok(res, db.prepare('SELECT * FROM measurements WHERE id = ?').get(result.lastInsertRowid),
     'Measurements saved', 201);
});

/* ── PUT /:id ─────────────────────────────────────────────────── */
router.put('/:id', (req, res) => {
  const db = getDb();
  const m  = db.prepare('SELECT * FROM measurements WHERE id = ? AND user_id = ?')
               .get(req.params.id, req.user.id);
  if (!m) return fail(res, 'Measurement profile not found', 404);

  const fields = ['updated_at = CURRENT_TIMESTAMP'];
  const vals   = [];
  const updatable = ['profile_name','unit','notes','is_default', ...measureFields];
  updatable.forEach((f) => {
    if (req.body[f] !== undefined) { fields.push(`${f} = ?`); vals.push(req.body[f]); }
  });
  if (!fields.length) return fail(res, 'Nothing to update');

  vals.push(m.id);
  db.prepare(`UPDATE measurements SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  ok(res, db.prepare('SELECT * FROM measurements WHERE id = ?').get(m.id), 'Measurements updated');
});

/* ── DELETE /:id ──────────────────────────────────────────────── */
router.delete('/:id', (req, res) => {
  const db = getDb();
  const m  = db.prepare('SELECT * FROM measurements WHERE id = ? AND user_id = ?')
               .get(req.params.id, req.user.id);
  if (!m) return fail(res, 'Measurement profile not found', 404);
  db.prepare('DELETE FROM measurements WHERE id = ?').run(m.id);
  ok(res, null, 'Measurement profile deleted');
});

/* ── PATCH /:id/default ───────────────────────────────────────── */
router.patch('/:id/default', (req, res) => {
  const db = getDb();
  const m  = db.prepare('SELECT * FROM measurements WHERE id = ? AND user_id = ?')
               .get(req.params.id, req.user.id);
  if (!m) return fail(res, 'Measurement profile not found', 404);
  db.prepare('UPDATE measurements SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  db.prepare('UPDATE measurements SET is_default = 1 WHERE id = ?').run(m.id);
  ok(res, null, 'Default measurement profile updated');
});

module.exports = router;
