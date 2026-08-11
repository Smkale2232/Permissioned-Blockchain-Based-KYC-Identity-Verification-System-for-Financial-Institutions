const rateLimit = require('express-rate-limit');

// Shared JSON error shape so a rate-limited response looks like every other
// error response instead of express-rate-limit's default plain text.
function jsonLimitHandler(req, res) {
  res.status(429).json({ message: 'Too many requests. Please wait a moment and try again.' });
}

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000); // 15 minutes

// Login/register/forgot-password: the classic brute-force and credential-
// stuffing targets. Tight limit, keyed by IP.
const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler,
});

// Upload / sign / reject: each of these is PIN-guarded, so this is a second
// layer against PIN-guessing specifically (on top of bcrypt's inherent cost
// and the fact the attacker also needs a valid, non-expired JWT first).
const pinActionLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: Number(process.env.PIN_RATE_LIMIT_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonLimitHandler,
  keyGenerator: (req) => req.user?.id || req.ip, // per-account once authenticated, falls back to IP
});

module.exports = { authLimiter, pinActionLimiter };
