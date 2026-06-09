/**
 * SHIMPI Fashion – Role Guard Middleware
 * Always run authenticate() before these.
 */

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  next();
};

const isTailor = (req, res, next) => {
  if (!['admin', 'tailor'].includes(req.user?.role))
    return res.status(403).json({ success: false, message: 'Tailor/Admin access required.' });
  next();
};

const isAdminOrTailor = (req, res, next) => {
  if (!['admin', 'tailor'].includes(req.user?.role))
    return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
  next();
};

module.exports = { isAdmin, isTailor, isAdminOrTailor };
