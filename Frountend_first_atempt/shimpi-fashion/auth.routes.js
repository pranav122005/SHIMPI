/**
 * SHIMPI Fashion – Auth Routes
 * POST /api/v1/auth/register
 * POST /api/v1/auth/login
 * GET  /api/v1/auth/me
 * PUT  /api/v1/auth/change-password
 */
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body } = require('express-validator');
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { ok, fail, validate } = require('../utils/helpers');

/* ── Helpers ──────────────────────────────────────────────────── */
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const safeUser = (u) => ({
  id: u.id, name: u.name, email: u.email,
  phone: u.phone, role: u.role, profile_image: u.profile_image,
  created_at: u.created_at,
});

/* ── POST /register ───────────────────────────────────────────── */
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
], (req, res) => {
  if (!validate(req, res)) return;
  const { name, email, password, phone } = req.body;

  const db   = getDb();
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return fail(res, 'Email already registered', 409);

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)'
  ).run(name, email, hashed, phone || null);

  const user  = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = signToken(user);

  ok(res, { user: safeUser(user), token }, 'Registration successful', 201);
});

/* ── POST /login ──────────────────────────────────────────────── */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], (req, res) => {
  if (!validate(req, res)) return;
  const { email, password } = req.body;

  const user = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !user.is_active)
    return fail(res, 'Invalid credentials or account deactivated', 401);

  if (!bcrypt.compareSync(password, user.password))
    return fail(res, 'Invalid credentials', 401);

  ok(res, { user: safeUser(user), token: signToken(user) }, 'Login successful');
});

/* ── GET /me ──────────────────────────────────────────────────── */
router.get('/me', authenticate, (req, res) => {
  ok(res, safeUser(req.user));
});

/* ── PUT /change-password ─────────────────────────────────────── */
router.put('/change-password', authenticate, [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], (req, res) => {
  if (!validate(req, res)) return;
  const { current_password, new_password } = req.body;
  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!bcrypt.compareSync(current_password, user.password))
    return fail(res, 'Current password is incorrect', 401);

  db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(bcrypt.hashSync(new_password, 10), req.user.id);

  ok(res, null, 'Password updated successfully');
});

module.exports = router;
