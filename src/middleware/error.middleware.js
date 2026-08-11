const multer = require('multer');
const logger = require('../utils/logger');

// Keep this LAST in app.js's middleware chain.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File is too large. Max ${process.env.MAX_UPLOAD_MB || 10}MB.`
        : err.message;
    return res.status(400).json({ message });
  }

  if (err?.message?.includes('Unsupported file type')) {
    return res.status(400).json({ message: err.message });
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  logger.error(err.stack || err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? 'Something went wrong on the server.' : err.message,
  });
}

function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
}

module.exports = { errorHandler, notFound };
