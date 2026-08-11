// One-off script: creates the first regulator account.
// Public /api/auth/register only allows 'user' and 'signer' — a regulator is
// deliberately not self-service. Run: npm run seed
//
// The name/employee ID below are just a starting point — the regulator can
// (and should) set their own display name and Employee ID from the Profile
// page after logging in, rather than keeping this default.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { hashPassword } = require('./hash');
const pkiService = require('../services/pki.service');
const logger = require('./logger');

const EMAIL = process.env.SEED_REGULATOR_EMAIL || 'regulator@docchain.local';
const PASSWORD = process.env.SEED_REGULATOR_PASSWORD || 'Regulator@123';
const NAME = process.env.SEED_REGULATOR_NAME || 'Regulator';
const EMPLOYEE_ID = process.env.SEED_REGULATOR_EMPLOYEE_ID || null;

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/docchain');

  const existing = await User.findOne({ email: EMAIL.toLowerCase() });
  if (existing) {
    logger.info(`Regulator already exists: ${EMAIL}`);
  } else {
    const password = await hashPassword(PASSWORD);
    const identity = pkiService.generateIdentity({ name: NAME, email: EMAIL.toLowerCase(), role: 'regulator' });
    await User.create({
      name: NAME,
      email: EMAIL.toLowerCase(),
      password,
      role: 'regulator',
      employeeId: EMPLOYEE_ID,
      publicKeyPem: identity.publicKeyPem,
      privateKeyPem: identity.privateKeyPem,
      certificatePem: identity.certificatePem,
      certificateSerialNumber: identity.serialNumber,
    });
    logger.info(`Created regulator account → ${EMAIL} / ${PASSWORD}`);
    logger.info('Change this password, and set a display name / Employee ID from Profile, after first login.');
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
