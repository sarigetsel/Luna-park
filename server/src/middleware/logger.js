const fs = require('fs');
const path = require('path');
const { nodeEnv } = require('../config/env');

function requestLogger(req, res, next) {
  if (nodeEnv !== 'production') {
    console.log(`${req.method} ${req.originalUrl}`);
  }
  next();
}

function errorLogger(err, req, res, next) {
  const entry = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — ${err.message}\n`;

  if (nodeEnv === 'production') {
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(path.join(logDir, 'errors.log'), entry);
  } else {
    console.error(entry.trim());
  }
  next(err);
}

module.exports = { requestLogger, errorLogger };
