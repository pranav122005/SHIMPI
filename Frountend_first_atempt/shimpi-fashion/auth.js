/**
 * SHIMPI Fashion – JWT Authentication Middleware
 */
const jwt    = require('jsonwebtoken');
const { getDb } = require('../config/database');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Refresh user from DB so role/active changes take immediate effect
    const user = getDb()
      .prepare('SELECT id, name, email, phone, role, is_active, profile_image FROM users WHERE id = ?')
      .get(payload.id);

    if (!user || !user.is_active)
      return res.status(401).json({ success: false, message: 'Account not found or deactivated.' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = { authenticate };
