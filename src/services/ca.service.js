const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const fabricConfig = require('../config/fabric');
const logger = require('../utils/logger');

const FABRIC_BASE = path.resolve(
  __dirname,
  '../../../fabric-network/organizations/cryptogen'
);
const WALLET_PATH = path.resolve(__dirname, '../../wallet');

async function enrollUser(user) {
  if (fabricConfig.mock) {
    const fakeId = `mock-enrollment-${crypto.randomBytes(6).toString('hex')}`;
    logger.debug(`[ca.service:mock] enrolled ${user.email} → ${fakeId}`);
    return fakeId;
  }

  try {
    const { Wallets } = require('fabric-network');
    const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);

    const existing = await wallet.get(user.email);
    if (existing) {
      logger.debug(`[ca.service] ${user.email} already in wallet`);
      return user.email;
    }

    let certPath, keyDir, mspId;
    if (user.role === 'regulator') {
      certPath = `${FABRIC_BASE}/peerOrganizations/regulator.com/users/Admin@regulator.com/msp/signcerts/Admin@regulator.com-cert.pem`;
      keyDir   = `${FABRIC_BASE}/peerOrganizations/regulator.com/users/Admin@regulator.com/msp/keystore`;
      mspId    = 'RegulatorMSP';
    } else if (user.role === 'signer') {
      certPath = `${FABRIC_BASE}/peerOrganizations/banka.com/users/Admin@banka.com/msp/signcerts/Admin@banka.com-cert.pem`;
      keyDir   = `${FABRIC_BASE}/peerOrganizations/banka.com/users/Admin@banka.com/msp/keystore`;
      mspId    = 'BankAMSP';
    } else {
      certPath = `${FABRIC_BASE}/peerOrganizations/banka.com/users/User1@banka.com/msp/signcerts/User1@banka.com-cert.pem`;
      keyDir   = `${FABRIC_BASE}/peerOrganizations/banka.com/users/User1@banka.com/msp/keystore`;
      mspId    = 'BankAMSP';
    }

    if (!fs.existsSync(certPath)) {
      logger.warn(`[ca.service] cert not found: ${certPath}, returning mock id`);
      return `fallback-${crypto.randomBytes(6).toString('hex')}`;
    }

    const cert = fs.readFileSync(certPath).toString();
    const keyFiles = fs.readdirSync(keyDir).filter(f => f.endsWith('_sk') || f.endsWith('-key.pem'));
    if (!keyFiles.length) throw new Error(`No key in ${keyDir}`);
    const key = fs.readFileSync(path.join(keyDir, keyFiles[0])).toString();

    await wallet.put(user.email, { credentials: { certificate: cert, privateKey: key }, mspId, type: 'X.509' });
    logger.info(`[ca.service] Enrolled ${user.email} (${mspId}) into wallet`);
    return user.email;
  } catch (err) {
    logger.warn(`[ca.service] enrollUser failed: ${err.message}`);
    return `fallback-${crypto.randomBytes(6).toString('hex')}`;
  }
}

async function revokeCertificate(user) {
  if (fabricConfig.mock) {
    logger.debug(`[ca.service:mock] revoked certificate for ${user.email}`);
    return { revoked: true, revokedAt: new Date().toISOString() };
  }
  logger.warn(`[ca.service] revokeCertificate: cryptogen network — no CA revocation`);
  return { revoked: true, revokedAt: new Date().toISOString() };
}

async function reactivateCertificate(user) {
  if (fabricConfig.mock) {
    logger.debug(`[ca.service:mock] reactivated certificate for ${user.email}`);
    return { revoked: false, reactivatedAt: new Date().toISOString() };
  }
  logger.warn(`[ca.service] reactivateCertificate: cryptogen network`);
  return { reactivated: true, reactivatedAt: new Date().toISOString() };
}

module.exports = { enrollUser, revokeCertificate, reactivateCertificate };
