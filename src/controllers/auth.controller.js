const User = require('../models/User');
const { hashPassword, comparePassword, generateResetToken, hashResetToken } = require('../utils/hash');
const { signToken } = require('../services/jwt.service');
const caService = require('../services/ca.service');
const pkiService = require('../services/pki.service');
const { ROLES } = require('../utils/constants');
const logger = require('../utils/logger');

// POST /api/auth/register
// body: { name, email, password, role: 'user' | 'signer' }
// Matches the frontend's request contract exactly (see AuthContext.jsx register()).
async function register(req, res, next) {
  try {
    const { name, email, password, role, pin } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }
    if (![ROLES.USER, ROLES.SIGNER].includes(role)) {
      return res.status(400).json({ message: 'Role must be "user" or "signer".' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    // Required for everyone (not just signers) — the same PIN later confirms
    // both document upload (user) and sign/reject (signer). See pin.middleware.js.
    if (!pin || !/^\d{4,6}$/.test(String(pin))) {
      return res.status(400).json({ message: "Set a 4–6 digit PIN — you'll need it to upload or sign documents." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const passwordHash = await hashPassword(password);
    const actionPinHash = await hashPassword(String(pin));
    const user = new User({ name, email: email.toLowerCase(), password: passwordHash, actionPinHash, role });

    // Real RSA-2048 keypair + self-signed X.509 certificate — this is what
    // actually signs Verifiable Credentials when this user (as a signer)
    // signs a document. See pki.service.js for exactly what this does and
    // doesn't provide (no CA hierarchy, no client-cert auth — see PKI.md).
    const identity = pkiService.generateIdentity({ name, email: email.toLowerCase(), role });
    user.publicKeyPem = identity.publicKeyPem;
    user.privateKeyPem = identity.privateKeyPem;
    user.certificatePem = identity.certificatePem;
    user.certificateSerialNumber = identity.serialNumber;

    // Fabric CA enrollment — see ca.service.js. Runs in mock mode by default
    // (FABRIC_MOCK=true) so registration works before a live CA is connected.
    try {
      user.fabricEnrollmentId = await caService.enrollUser(user);
    } catch (fabricErr) {
      logger.warn(`Fabric enrollment failed for ${email}, continuing without it: ${fabricErr.message}`);
    }

    await user.save();

    res.status(201).json(user.toSafeJSON());
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
// body: { email, password } → { token, user: { id, name, email, role } }
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    // Generic message on both branches — avoids confirming whether the email exists.
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const matches = await comparePassword(password, user.password);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.certificateStatus === 'revoked') {
      return res.status(403).json({ message: 'Your certificate has been revoked. Contact the regulator.' });
    }

    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me — convenience endpoint for session refresh / the Profile page
async function me(req, res) {
  res.json(req.userDoc.toSafeJSON());
}

// PUT /api/auth/profile — update the caller's own display name (and, for a
// regulator, their Employee ID). This is the only way to change either —
// deliberately not editable by anyone else.
async function updateProfile(req, res, next) {
  try {
    const { name, employeeId } = req.body;
    const user = req.userDoc;

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) return res.status(400).json({ message: 'Name cannot be empty.' });
      if (trimmed.length > 100) return res.status(400).json({ message: 'Name is too long.' });
      user.name = trimmed;
    }

    if (employeeId !== undefined) {
      const trimmed = String(employeeId).trim();
      if (trimmed.length > 40) return res.status(400).json({ message: 'Employee ID is too long.' });
      user.employeeId = trimmed || null;
    }

    await user.save();
    res.json(user.toSafeJSON());
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/change-password — body: { currentPassword, newPassword }
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const matches = await comparePassword(currentPassword, user.password);
    if (!matches) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = await hashPassword(newPassword);
    await user.save();
    res.json({ message: 'Password updated.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/forgot-password — body: { email }
// NOTE: this project has no email service configured, so — for local/dev use
// only — the reset token is returned directly in the response instead of
// being emailed. In a real deployment, remove `resetToken` from the response
// and send it via email instead.
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    // Same generic response whether or not the account exists — avoids
    // confirming registered emails to an attacker.
    const genericResponse = {
      message: 'If an account exists for that email, a reset link has been generated.',
    };
    if (!user) return res.json(genericResponse);

    const token = generateResetToken();
    user.resetTokenHash = hashResetToken(token);
    user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    res.json({ ...genericResponse, resetToken: token, devNote: 'Returned only because no email service is configured.' });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password — body: { email, token, newPassword }
async function resetPassword(req, res, next) {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Email, token, and new password are required.' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() }).select(
      '+resetTokenHash +resetTokenExpires'
    );
    const invalid = () => res.status(400).json({ message: 'Invalid or expired reset token.' });

    if (!user || !user.resetTokenHash || !user.resetTokenExpires) return invalid();
    if (user.resetTokenExpires.getTime() < Date.now()) return invalid();
    if (hashResetToken(String(token)) !== user.resetTokenHash) return invalid();

    user.password = await hashPassword(newPassword);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ message: 'Password reset. You can now log in with your new password.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, updateProfile, changePassword, forgotPassword, resetPassword };
