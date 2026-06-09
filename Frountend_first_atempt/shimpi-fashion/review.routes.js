/**
 * SHIMPI Fashion – Review Routes
 *
 * GET    /api/v1/reviews                     public list (by product / all)
 * GET    /api/v1/reviews/:id                 single
 * POST   /api/v1/reviews                     submit (auth, delivered order required)
 * PUT    /api/v1/reviews/:id                 update own
 * DELETE /api/v1/reviews/:id                 delete own or admin
 * PATCH  /api/v1/reviews/:id/visibility      admin toggle visibility
 */
const router   = require('express').Router();
const { body } = require('express-validator');
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { isAdmin }      = require('../middleware/admin');
const { ok, fail, paginated, validate, pageParams } = require('../utils/helpers');

/* ── GET / (public) ───────────────────────────────────────────── */
router.get('/', (req, res) => {
  const db = getDb();
  const { page, limit, offset } = pageParams(req.query);
  const { clothing_type_id, rating, sort = 'newest' } = req.query;

  let where  = ['r.is_visible = 1'];
  const vals = [];
  if (clothing_type_id) { where.push('r.clothing_type_id = ?'); vals.push(+clothing_type_id); }
  if (rating)           { where.push('r.rating = ?');           vals.push(+rating); }
  const clause = 'WHERE ' + where.join(' AND ');
  const order  = sort === 'rating_desc' ? 'r.rating DESC' : sort === 'rating_asc' ? 'r.rating ASC' : 'r.created_at DESC';

  const total = db.prepare(`SELECT COUNT(*) AS c FROM reviews r ${clause}`).get(...vals).c;
  const rows  = db.prepare(`
    SELECT r.*, u.name AS reviewer_name, ct.name AS product_name
    FROM   reviews r
    JOIN   users          u  ON u.id  = r.user_id
    LEFT   JOIN clothing_types ct ON ct.id = r.clothing_type_id
    ${clause}
    ORDER  BY ${order}
    LIMIT  ? OFFSET ?
  `).all(...vals, limit, offset);

  paginated(res, rows, total, page, limit);
});

/* ── GET /:id (public) ────────────────────────────────────────── */
router.get('/:id', (req, res) => {
  const review = getDb().prepare(`
    SELECT r.*, u.name AS reviewer_name
    FROM reviews r JOIN users u ON u.id = r.user_id
    WHERE r.id = ? AND r.is_visible = 1
  `).get(req.params.id);
  if (!review) return fail(res, 'Review not found', 404);
  ok(res, review);
});

/* ── POST / (auth) ────────────────────────────────────────────── */
router.post('/', authenticate, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('clothing_type_id').isInt({ gt: 0 }),
  body('order_id').isInt({ gt: 0 }),
  body('title').optional().trim().isLength({ max: 100 }),
  body('comment').optional().trim().isLength({ max: 1000 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();
  const { rating, clothing_type_id, order_id, title, comment } = req.body;

  // Must have a delivered order containing this product
  const order = db.prepare(`
    SELECT o.id FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.id = ? AND o.user_id = ? AND o.status = 'delivered' AND oi.clothing_type_id = ?
  `).get(order_id, req.user.id, clothing_type_id);

  if (!order) return fail(res, 'You can only review products from delivered orders', 403);

  // one review per product per order
  const exists = db.prepare(
    'SELECT id FROM reviews WHERE user_id = ? AND order_id = ? AND clothing_type_id = ?'
  ).get(req.user.id, order_id, clothing_type_id);
  if (exists) return fail(res, 'You have already reviewed this item', 409);

  const result = db.prepare(`
    INSERT INTO reviews (user_id, order_id, clothing_type_id, rating, title, comment, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(req.user.id, order_id, clothing_type_id, rating, title || null, comment || null);

  ok(res, db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid),
     'Review submitted', 201);
});

/* ── PUT /:id (own review) ────────────────────────────────────── */
router.put('/:id', authenticate, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const db     = getDb();
  const review = db.prepare('SELECT * FROM reviews WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!review) return fail(res, 'Review not found', 404);

  const { rating, title, comment } = req.body;
  const fields = [];
  const vals   = [];
  if (rating  !== undefined) { fields.push('rating = ?');  vals.push(rating); }
  if (title   !== undefined) { fields.push('title = ?');   vals.push(title); }
  if (comment !== undefined) { fields.push('comment = ?'); vals.push(comment); }
  if (!fields.length) return fail(res, 'Nothing to update');

  vals.push(review.id);
  db.prepare(`UPDATE reviews SET ${fields.join(', ')} WHERE id = ?`).run(...vals);
  ok(res, db.prepare('SELECT * FROM reviews WHERE id = ?').get(review.id), 'Review updated');
});

/* ── DELETE /:id (own or admin) ───────────────────────────────── */
router.delete('/:id', authenticate, (req, res) => {
  const db     = getDb();
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) return fail(res, 'Review not found', 404);
  if (review.user_id !== req.user.id && req.user.role !== 'admin')
    return fail(res, 'Unauthorized', 403);
  db.prepare('DELETE FROM reviews WHERE id = ?').run(review.id);
  ok(res, null, 'Review deleted');
});

/* ── PATCH /:id/visibility (admin) ───────────────────────────── */
router.patch('/:id/visibility', authenticate, isAdmin, (req, res) => {
  const db     = getDb();
  const review = db.prepare('SELECT id, is_visible FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) return fail(res, 'Review not found', 404);
  const newVal = review.is_visible ? 0 : 1;
  db.prepare('UPDATE reviews SET is_visible = ? WHERE id = ?').run(newVal, review.id);
  ok(res, null, `Review ${newVal ? 'visible' : 'hidden'}`);
});

module.exports = router;
