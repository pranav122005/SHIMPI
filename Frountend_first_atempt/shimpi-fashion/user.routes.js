/**
 * SHIMPI Fashion – User Profile & Address Routes
 * All routes require authentication.
 *
 * GET    /api/v1/users/profile
 * PUT    /api/v1/users/profile
 * GET    /api/v1/users/addresses
 * POST   /api/v1/users/addresses
 * PUT    /api/v1/users/addresses/:id
 * DELETE /api/v1/users/addresses/:id
 * PATCH  /api/v1/users/addresses/:id/default
 */
const router   = require('express').Router();
const { body } = require('express-validator');
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { ok, fail, validate } = require('../utils/helpers');

router.use(authenticate);

/* ── GET profile ──────────────────────────────────────────────── */
router.get('/profile', (req, res) => {
  const { id, name, email, phone, role, profile_image, created_at } = req.user;
  ok(res, { id, name, email, phone, role, profile_image, created_at });
});

/* ── PUT profile ──────────────────────────────────────────────── */
router.put('/profile', [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone'),
], (req, res) => {
  if (!validate(req, res)) return;
  const { name, phone, profile_image } = req.body;
  const db = getDb();
  const fields = [];
  const vals   = [];
  if (name          !== undefined) { fields.push('name = ?');          vals.push(name); }
  if (phone         !== undefined) { fields.push('phone = ?');         vals.push(phone); }
  if (profile_image !== undefined) { fields.push('profile_image = ?'); vals.push(profile_image); }
  if (!fields.length) return fail(res, 'No fields to update');

  fields.push('updated_at = CURRENT_TIMESTAMP');
  vals.push(req.user.id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...vals);

  const updated = db.prepare(
    'SELECT id, name, email, phone, role, profile_image, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  ok(res, updated, 'Profile updated');
});

/* ── GET addresses ────────────────────────────────────────────── */
router.get('/addresses', (req, res) => {
  const addresses = getDb()
    .prepare('SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC')
    .all(req.user.id);
  ok(res, addresses);
});

/* ── POST address ─────────────────────────────────────────────── */
router.post('/addresses', [
  body('address_line1').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('pincode').trim().notEmpty(),
], (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();
  const { label = 'Home', address_line1, address_line2, city, state, pincode, country = 'India', is_default = 0 } = req.body;

  if (is_default)
    db.prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);

  const result = db.prepare(`
    INSERT INTO user_addresses (user_id, label, address_line1, address_line2, city, state, pincode, country, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, label, address_line1, address_line2 || null, city, state, pincode, country, is_default ? 1 : 0);

  ok(res, db.prepare('SELECT * FROM user_addresses WHERE id = ?').get(result.lastInsertRowid), 'Address added', 201);
});

/* ── PUT address ──────────────────────────────────────────────── */
router.put('/addresses/:id', (req, res) => {
  const db   = getDb();
  const addr = db.prepare('SELECT * FROM user_addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!addr) return fail(res, 'Address not found', 404);

  const { label, address_line1, address_line2, city, state, pincode, country } = req.body;
  db.prepare(`
    UPDATE user_addresses
    SET label=COALESCE(?,label), address_line1=COALESCE(?,address_line1),
        address_line2=COALESCE(?,address_line2), city=COALESCE(?,city),
        state=COALESCE(?,state), pincode=COALESCE(?,pincode), country=COALESCE(?,country)
    WHERE id = ?
  `).run(label, address_line1, address_line2, city, state, pincode, country, addr.id);

  ok(res, db.prepare('SELECT * FROM user_addresses WHERE id = ?').get(addr.id), 'Address updated');
});

/* ── DELETE address ───────────────────────────────────────────── */
router.delete('/addresses/:id', (req, res) => {
  const db   = getDb();
  const addr = db.prepare('SELECT * FROM user_addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!addr) return fail(res, 'Address not found', 404);
  db.prepare('DELETE FROM user_addresses WHERE id = ?').run(addr.id);
  ok(res, null, 'Address deleted');
});

/* ── PATCH address default ────────────────────────────────────── */
router.patch('/addresses/:id/default', (req, res) => {
  const db   = getDb();
  const addr = db.prepare('SELECT * FROM user_addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!addr) return fail(res, 'Address not found', 404);

  db.prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  db.prepare('UPDATE user_addresses SET is_default = 1 WHERE id = ?').run(addr.id);
  ok(res, null, 'Default address updated');
});

module.exports = router;
