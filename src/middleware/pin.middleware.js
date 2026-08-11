const User = require('../models/User');
const { comparePassword } = require('../utils/hash');

// Runs after requireAuth (and after multer, for multipart requests like upload,
// so that req.body.pin — sent as a plain form field alongside the file — is
// already parsed). Expects { pin } in req.body.
async function requireActionPin(req, res, next) {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ message: 'PIN is required for this action.' });
    }

    const userWithPin = await User.findById(req.user.id).select('+actionPinHash');
    if (!userWithPin?.actionPinHash) {
      return res.status(400).json({ message: 'No PIN set on this account. Contact support.' });
    }

    const ok = await comparePassword(String(pin), userWithPin.actionPinHash);
    if (!ok) {
      return res.status(401).json({ message: 'Incorrect PIN.' });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireActionPin;
