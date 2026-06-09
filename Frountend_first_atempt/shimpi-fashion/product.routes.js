/**
 * SHIMPI Fashion – Clothing Types (Products) Routes
 *
 * Public  GET    /api/v1/products         list (with avg rating)
 * Public  GET    /api/v1/products/:id     detail + reviews
 * Admin   POST   /api/v1/products         create
 * Admin   PUT    /api/v1/products/:id     update
 * Admin   DELETE /api/v1/products/:id     soft-delete
 */
const router   = require('express').Router();
const { body } = require('express-validator');
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { isAdmin }      = require('../middleware/admin');
const { ok, fail, paginated, validate, pageParams } = require('../utils/helpers');

/* ── GET / ────────────────────────────────────────────────────── */
router.get('/', (req, res) => {
  const db = getDb();
  const { page, limit, offset } = pageParams(req.query);
  const { category, search } = req.query;

  let where  = ['ct.is_active = 1'];
  const vals = [];
  if (category) { where.push('ct.category = ?');   vals.push(category); }
  if (search)   { where.push('ct.name LIKE ?');    vals.push(`%${search}%`); }
  const clause = 'WHERE ' + where.join(' AND ');

  const total = db.prepare(`SELECT COUNT(*) AS c FROM clothing_types ct ${clause}`).get(...vals).c;
  const rows  = db.prepare(`
    SELECT ct.*,
           ROUND(AVG(r.rating), 1) AS avg_rating,
           COUNT(r.id)             AS review_count
    FROM   clothing_types ct
    LEFT   JOIN reviews r ON r.clothing_type_id = ct.id AND r.is_visible = 1
    ${clause}
    GROUP  BY ct.id
    ORDER  BY ct.id DESC
    LIMIT  ? OFFSET ?
  `).all(...vals, limit, offset);

  paginated(res, rows, total, page, limit);
});

/* ── GET /:id ─────────────────────────────────────────────────── */
router.get('/:id', (req, res) => {
  const db      = getDb();
  const product = db.prepare(`
    SELECT ct.*,
           ROUND(AVG(r.rating), 1) AS avg_rating,
           COUNT(r.id)             AS review_count
    FROM   clothing_types ct
    LEFT   JOIN reviews r ON r.clothing_type_id = ct.id AND r.is_visible = 1
    WHERE  ct.id = ? AND ct.is_active = 1
    GROUP  BY ct.id
  `).get(req.params.id);

  if (!product) return fail(res, 'Product not found', 404);

  const reviews = db.prepare(`
    SELECT rv.*, u.name AS reviewer_name
    FROM   reviews rv
    JOIN   users   u  ON u.id = rv.user_id
    WHERE  rv.clothing_type_id = ? AND rv.is_visible = 1
    ORDER  BY rv.created_at DESC
    LIMIT  10
  `).all(req.params.id);

  ok(res, { ...product, reviews });
});

/* ── POST / (admin) ───────────────────────────────────────────── */
router.post('/', authenticate, isAdmin, [
  body('name').trim().notEmpty(),
  body('base_price').isFloat({ gt: 0 }),
  body('estimated_days').optional().isInt({ min: 1 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const { name, description, category, base_price, estimated_days = 7, image_url } = req.body;

  const result = getDb().prepare(`
    INSERT INTO clothing_types (name, description, category, base_price, estimated_days, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, description, category, base_price, estimated_days, image_url);

  ok(res, getDb().prepare('SELECT * FROM clothing_types WHERE id = ?').get(result.lastInsertRowid),
     'Product created', 201);
});

/* ── PUT /:id (admin) ─────────────────────────────────────────── */
router.put('/:id', authenticate, isAdmin, (req, res) => {
  const db      = getDb();
  const product = db.prepare('SELECT * FROM clothing_types WHERE id = ?').get(req.params.id);
  if (!product) return fail(res, 'Product not found', 404);

  const fields = ['updated_at = CURRENT_TIMESTAMP'];
  const vals   = [];
  ['name','description','category','base_price','estimated_days','image_url','is_active'].forEach((f) => {
    if (req.body[f] !== undefined) { fields.push(`${f} = ?`); vals.push(req.body[f]); }
  });
  vals.push(product.id);
  db.prepare(`UPDATE clothing_types SET ${fields.join(', ')} WHERE id = ?`).run(...vals);

  ok(res, db.prepare('SELECT * FROM clothing_types WHERE id = ?').get(product.id), 'Product updated');
});

/* ── DELETE /:id (admin) ──────────────────────────────────────── */
router.delete('/:id', authenticate, isAdmin, (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT id FROM clothing_types WHERE id = ?').get(req.params.id);
  if (!product) return fail(res, 'Product not found', 404);
  db.prepare('UPDATE clothing_types SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(product.id);
  ok(res, null, 'Product deactivated');
});

module.exports = router;
