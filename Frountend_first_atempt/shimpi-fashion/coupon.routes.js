/**
 * SHIMPI Fashion – Coupon Routes
 *
 * Public  POST   /api/v1/coupons/validate     check coupon validity
 * Admin   GET    /api/v1/coupons              list all
 * Admin   POST   /api/v1/coupons              create
 * Admin   PUT    /api/v1/coupons/:id          update
 * Admin   DELETE /api/v1/coupons/:id          delete
 */
const router   = require('express').Router();
const { body } = require('express-validator');
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { isAdmin }      = require('../middleware/admin');
const { ok, fail, paginated, validate, pageParams } = require('../utils/helpers');

/* ── POST /validate (auth) ────────────────────────────────────── */
router.post('/validate', authenticate, [
  body('code').trim().notEmpty(),
  body('cart_total').isFloat({ gt: 0 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const { code, cart_total } = req.body;
  const now = new Date().toISOString();

  const coupon = getDb().prepare(`
    SELECT * FROM coupons
    WHERE code = ? AND is_active = 1
      AND (expires_at IS NULL OR expires_at > ?)
      AND (usage_limit IS NULL OR used_count < usage_limit)
  `).get(code.toUpperCase(), now);

  if (!coupon) return fail(res, 'Invalid or expired coupon code', 404);

  if (+cart_total < (coupon.min_order_value || 0))
    return fail(res, `Minimum order value ₹${coupon.min_order_value} required for this coupon`);

  let discount = coupon.discount_type === 'percentage'
    ? +((+cart_total) * coupon.discount_value / 100).toFixed(2)
    : +coupon.discount_value.toFixed(2);
  if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);

  ok(res, {
    code:           coupon.code,
    description:    coupon.description,
    discount_type:  coupon.discount_type,
    discount_value: coupon.discount_value,
    discount_amount: discount,
    final_total:    +(+cart_total - discount).toFixed(2),
  }, 'Coupon is valid!');
});

/* ── GET / (admin) ────────────────────────────────────────────── */
router.get('/', authenticate, isAdmin, (req, res) => {
  const db = getDb();
  const { page, limit, offset } = pageParams(req.query);
  const total   = db.prepare('SELECT COUNT(*) AS c FROM coupons').get().c;
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, offset);
  paginated(res, coupons, total, page, limit);
});

/* ── POST / (admin) ───────────────────────────────────────────── */
router.post('/', authenticate, isAdmin, [
  body('code').trim().notEmpty().toUpperCase(),
  body('discount_type').isIn(['percentage','flat']),
  body('discount_value').isFloat({ gt: 0 }),
  body('usage_limit').optional().isInt({ gt: 0 }),
  body('min_order_value').optional().isFloat({ min: 0 }),
  body('max_discount').optional().isFloat({ gt: 0 }),
  body('expires_at').optional().isISO8601(),
], (req, res) => {
  if (!validate(req, res)) return;
  const { code, description, discount_type, discount_value, usage_limit,
          min_order_value, max_discount, expires_at } = req.body;

  try {
    const result = getDb().prepare(`
      INSERT INTO coupons (code, description, discount_type, discount_value, usage_limit,
                           min_order_value, max_discount, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code.toUpperCase(), description || null, discount_type, discount_value,
           usage_limit || null, min_order_value || 0, max_discount || null, expires_at || null);

    ok(res, getDb().prepare('SELECT * FROM coupons WHERE id = ?').get(result.lastInsertRowid),
       'Coupon created', 201);
  } catch {
    fail(res, 'Coupon code already exists', 409);
  }
});

/* ── PUT /:id (admin) ─────────────────────────────────────────── */
router.put('/:id', authenticate, isAdmin, (req, res) => {
  const db     = getDb();
  const coupon = db.prepare('SELECT id FROM coupons WHERE id = ?').get(req.params.id);
  if (!coupon) return fail(res, 'Coupon not found', 404);

  const fields = [];
  const vals   = [];
  ['description','discount_type','discount_value','usage_limit',
   'min_order_value','max_discount','expires_at','is_active'].forEach((f) => {
    if (req.body[f] !== undefined) { fields.push(`${f} = ?`); vals.push(req.body[f]); }
  });
  if (!fields.length) return fail(res, 'Nothing to update');
  vals.push(coupon.id);
  db.prepare(`UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`).run(...vals);

  ok(res, db.prepare('SELECT * FROM coupons WHERE id = ?').get(coupon.id), 'Coupon updated');
});

/* ── DELETE /:id (admin) ──────────────────────────────────────── */
router.delete('/:id', authenticate, isAdmin, (req, res) => {
  const db     = getDb();
  const coupon = db.prepare('SELECT id FROM coupons WHERE id = ?').get(req.params.id);
  if (!coupon) return fail(res, 'Coupon not found', 404);
  db.prepare('DELETE FROM coupons WHERE id = ?').run(coupon.id);
  ok(res, null, 'Coupon deleted');
});

module.exports = router;
