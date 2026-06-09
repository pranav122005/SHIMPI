/**
 * SHIMPI Fashion – Shared Utility Helpers
 */
const { validationResult } = require('express-validator');

/* ── Standardised JSON responses ─────────────────────────────── */
const ok = (res, data, message = 'Success', code = 200) =>
  res.status(code).json({ success: true, message, data });

const fail = (res, message = 'An error occurred', code = 400) =>
  res.status(code).json({ success: false, message });

const paginated = (res, data, total, page, limit, message = 'Success') =>
  res.json({
    success: true,
    message,
    data,
    pagination: {
      page:  +page,
      limit: +limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });

/* ── Validation shortcut ──────────────────────────────────────── */
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;          // caller should return immediately
  }
  return true;
};

/* ── Pagination params from query string ─────────────────────── */
const pageParams = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(
    parseInt(process.env.MAX_PAGE_LIMIT) || 100,
    Math.max(1, parseInt(query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT) || 10)
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/* ── Unique order number: SF + 8-digit timestamp + 3-digit rand ─ */
const generateOrderNumber = () => {
  const ts  = Date.now().toString().slice(-8);
  const rnd = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SF${ts}${rnd}`;
};

/* ── Push a notification to a user (fire-and-forget) ─────────── */
const notify = (userId, title, message, type = 'general', refId = null, refType = null) => {
  try {
    const { getDb } = require('../config/database');
    getDb().prepare(`
      INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, title, message, type, refId, refType);
  } catch (_) { /* never crash the main request over a notification */ }
};

module.exports = { ok, fail, paginated, validate, pageParams, generateOrderNumber, notify };
