/**
 * SHIMPI Fashion – Fabric Catalog Routes
 *
 * Public   GET  /api/v1/fabrics            list (paginated, filtered)
 * Public   GET  /api/v1/fabrics/:id        single
 * Admin    POST /api/v1/fabrics            create
 * Admin    PUT  /api/v1/fabrics/:id        update
 * Admin    DELETE /api/v1/fabrics/:id      soft-delete
 * Admin    PATCH /api/v1/fabrics/:id/stock update stock
 */
const router   = require('express').Router();
const { body, query } = require('express-validator');
const { getDb }        = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { isAdmin }      = require('../middleware/admin');
const { ok, fail, paginated, validate, pageParams } = require('../utils/helpers');

/* ── GET / ────────────────────────────────────────────────────── */
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1 }),
  query('min_price').optional().isFloat({ min: 0 }),
  query('max_price').optional().isFloat({ min: 0 }),
], (req, res) => {
  const db = getDb();
  const { page, limit, offset } = pageParams(req.query);
  const { material, color, pattern, search, min_price, max_price, show_inactive } = req.query;

  let where  = [];
  const vals = [];

  if (!show_inactive || req.user?.role !== 'admin') { where.push('is_active = 1'); }
  if (material)  { where.push('material LIKE ?');  vals.push(`%${material}%`); }
  if (color)     { where.push('color LIKE ?');     vals.push(`%${color}%`); }
  if (pattern)   { where.push('pattern LIKE ?');   vals.push(`%${pattern}%`); }
  if (search)    { where.push('name LIKE ?');      vals.push(`%${search}%`); }
  if (min_price) { where.push('price_per_meter >= ?'); vals.push(+min_price); }
  if (max_price) { where.push('price_per_meter <= ?'); vals.push(+max_price); }

  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total  = db.prepare(`SELECT COUNT(*) AS c FROM fabrics ${clause}`).get(...vals).c;
  const rows   = db.prepare(`SELECT * FROM fabrics ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...vals, limit, offset);

  paginated(res, rows, total, page, limit);
});

/* ── GET /:id ─────────────────────────────────────────────────── */
router.get('/:id', (req, res) => {
  const fabric = getDb().prepare('SELECT * FROM fabrics WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!fabric) return fail(res, 'Fabric not found', 404);
  ok(res, fabric);
});

/* ── POST / (admin) ───────────────────────────────────────────── */
router.post('/', authenticate, isAdmin, [
  body('name').trim().notEmpty(),
  body('price_per_meter').isFloat({ gt: 0 }).withMessage('Price must be positive'),
  body('stock_meters').optional().isFloat({ min: 0 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const {
    name, description, color, pattern, material, weight,
    care_instructions, price_per_meter, stock_meters = 0, image_url,
  } = req.body;

  const result = getDb().prepare(`
    INSERT INTO fabrics (name, description, color, pattern, material, weight,
      care_instructions, price_per_meter, stock_meters, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description, color, pattern, material, weight,
         care_instructions, price_per_meter, stock_meters, image_url);

  const fabric = getDb().prepare('SELECT * FROM fabrics WHERE id = ?').get(result.lastInsertRowid);
  ok(res, fabric, 'Fabric created', 201);
});

/* ── PUT /:id (admin) ─────────────────────────────────────────── */
router.put('/:id', authenticate, isAdmin, (req, res) => {
  const db     = getDb();
  const fabric = db.prepare('SELECT * FROM fabrics WHERE id = ?').get(req.params.id);
  if (!fabric) return fail(res, 'Fabric not found', 404);

  const fields = ['updated_at = CURRENT_TIMESTAMP'];
  const vals   = [];
  const updatable = ['name','description','color','pattern','material','weight',
                     'care_instructions','price_per_meter','stock_meters','image_url','is_active'];

  updatable.forEach((f) => {
    if (req.body[f] !== undefined) { fields.push(`${f} = ?`); vals.push(req.body[f]); }
  });
  vals.push(fabric.id);
  db.prepare(`UPDATE fabrics SET ${fields.join(', ')} WHERE id = ?`).run(...vals);

  ok(res, db.prepare('SELECT * FROM fabrics WHERE id = ?').get(fabric.id), 'Fabric updated');
});

/* ── DELETE /:id (admin) ──────────────────────────────────────── */
router.delete('/:id', authenticate, isAdmin, (req, res) => {
  const db     = getDb();
  const fabric = db.prepare('SELECT id FROM fabrics WHERE id = ?').get(req.params.id);
  if (!fabric) return fail(res, 'Fabric not found', 404);
  db.prepare('UPDATE fabrics SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(fabric.id);
  ok(res, null, 'Fabric deactivated');
});

/* ── PATCH /:id/stock (admin) ─────────────────────────────────── */
router.patch('/:id/stock', authenticate, isAdmin, [
  body('stock_meters').isFloat({ min: 0 }),
], (req, res) => {
  if (!validate(req, res)) return;
  const db = getDb();
  const fabric = db.prepare('SELECT id FROM fabrics WHERE id = ?').get(req.params.id);
  if (!fabric) return fail(res, 'Fabric not found', 404);
  db.prepare('UPDATE fabrics SET stock_meters = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(req.body.stock_meters, fabric.id);
  ok(res, null, `Stock updated to ${req.body.stock_meters} meters`);
});

module.exports = router;
