const logger = require('../utils/logger');

// A handful of default/placeholder values that must never reach production —
// checked against JWT_SECRET so a forgotten .env swap doesn't silently ship
// with a guessable secret.
const KNOWN_PLACEHOLDER_SECRETS = [
  'change-this-to-a-long-random-string',
  'secret',
  'changeme',
];

/**
 * Called once at server startup (see server.js). Throws — deliberately
 * crashing the process — if a required variable is missing, or logs a loud
 * warning for risky-but-not-fatal misconfiguration (e.g. a weak JWT secret
 * in development). Fail fast beats silently running with a broken/insecure
 * configuration.
 */
function validateEnv() {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.MONGO_URI) missing.push('MONGO_URI');

  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}. Check .env against .env.example.`);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const secret = process.env.JWT_SECRET || '';

  if (KNOWN_PLACEHOLDER_SECRETS.includes(secret) || secret.length < 32) {
    const message =
      'JWT_SECRET is missing, a known placeholder, or too short (< 32 chars). ' +
      'Generate a real one, e.g.: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"';
    if (isProd) {
      throw new Error(message);
    }
    logger.warn(`[startup] ${message} (allowed in development, but fix before deploying)`);
  }

  if (isProd && process.env.FABRIC_MOCK !== 'false') {
    logger.warn('[startup] NODE_ENV=production but FABRIC_MOCK is not "false" — running against the Fabric mock in production.');
  }
}

module.exports = validateEnv;
