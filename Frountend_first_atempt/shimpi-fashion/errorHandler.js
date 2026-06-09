/**
 * SHIMPI Fashion – Global Error Handler
 * Must be the last middleware registered in server.js
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);

  // better-sqlite3 constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE')
    return res.status(409).json({ success: false, message: 'Duplicate entry – record already exists.' });

  if (err.code?.startsWith('SQLITE_'))
    return res.status(500).json({ success: false, message: 'Database error.' });

  const status  = err.statusCode || err.status || 500;
  const message = err.message    || 'Internal server error';

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
