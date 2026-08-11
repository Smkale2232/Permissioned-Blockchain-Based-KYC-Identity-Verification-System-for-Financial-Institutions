const { verifyToken } = require('../services/jwt.service');
const User = require('../models/User');

// Verifies the Bearer JWT and attaches the current user to req.user.
// req.user shape mirrors what the frontend expects back from /auth/login:
// { id, name, email, role }
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }
    if (user.certificateStatus === 'revoked') {
      return res.status(403).json({ message: 'Your certificate has been revoked. Contact the regulator.' });
    }

    req.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
    req.userDoc = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = requireAuth;
