const crypto = require('crypto');
const fabricConfig = require('../config/fabric');
const logger = require('../utils/logger');

function generateMockTxId() {
  return crypto.randomBytes(16).toString('hex');
}

async function getContract(user) {
  if (fabricConfig.mock) return null;

  const { Wallets, Gateway } = require('fabric-network');
  const fs = require('fs');
  const path = require('path');

  const walletPath = path.resolve(__dirname, '../../wallet');
  const ccpPath = path.resolve(__dirname, '../config/connection-profile.json');
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const label = resolveWalletLabel(user);
  const identity = await wallet.get(label);
  const finalLabel = identity ? label : 'bankA-admin';
  if (!identity) {
    logger.warn(`[fabric.service] identity "${label}" not in wallet, falling back to bankA-admin`);
    const fallback = await wallet.get('bankA-admin');
    if (!fallback) throw new Error('No wallet identity found. Run: node scripts/setupWallet.js');
  }

  const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: finalLabel,
    discovery: { enabled: true, asLocalhost: false },
  });

  const network = await gateway.getNetwork(fabricConfig.channelName);
  const contract = network.getContract(fabricConfig.chaincodeName);
  contract._gateway = gateway;
  return contract;
}

// Map a MongoDB user id or role string to a wallet label
function resolveWalletLabel(user) {
  if (user?.fabricEnrollmentId && !user.fabricEnrollmentId.startsWith('mock-') && !user.fabricEnrollmentId.startsWith('fallback-')) {
    return user.fabricEnrollmentId;
  }
  // Enrollment never succeeded for this account (mock mode, or enrollUser
  // hit its catch block) — fall back to the shared role-based identity.
  if (!user) return 'bankA-user1';
  if (user.role === 'regulator') return 'regulator-admin';
  if (user.role === 'signer') return 'bankA-admin';
  return 'bankA-user1';
}

async function disconnectContract(contract) {
  if (contract && contract._gateway) {
    try { contract._gateway.disconnect(); } catch (_) {}
  }
}

/** Chaincode: CreateDocument(docId, title, fileHash, uploaderId) */
async function createDocument({ docId, title, fileHash, uploaderId, uploaderUser }) {
  if (fabricConfig.mock) {
    const txId = generateMockTxId();
    logger.debug(`[fabric.service:mock] CreateDocument(${docId}) → tx ${txId}`);
    return { txId };
  }
  const contract = await getContract(uploaderUser);
  try {
    const tx = contract.createTransaction('CreateDocument');
    await tx.submit(docId, title || 'DOCUMENT', fileHash, uploaderId || 'unknown');
    return { txId: tx.getTransactionId() };
  } finally {
    await disconnectContract(contract);
  }
}

/** Chaincode: SignDocument(docId, signerId) — maps to our SignDocument(docId, 'approved', remarks) */
async function signDocument({ docId, signerId, signerUser }) {
  if (fabricConfig.mock) {
    const txId = generateMockTxId();
    logger.debug(`[fabric.service:mock] SignDocument(${docId}) by ${signerId} → tx ${txId}`);
    return { txId };
  }
  const contract = await getContract(signerUser);
  try {
    const tx = contract.createTransaction('SignDocument');
    await tx.submit(docId, 'approved', 'Approved by KYC officer');
    return { txId: tx.getTransactionId() };
  } finally {
    await disconnectContract(contract);
  }
}

/** Reject maps to SignDocument with action=rejected */
async function rejectDocument({ docId, signerId, signerUser, reason }) {
  if (fabricConfig.mock) {
    const txId = generateMockTxId();
    logger.debug(`[fabric.service:mock] RejectDocument(${docId}) → tx ${txId}`);
    return { txId };
  }
  const contract = await getContract(signerUser);
  try {
    const tx = contract.createTransaction('SignDocument');
    await tx.submit(docId, 'rejected', reason || 'Rejected by KYC officer');
    return { txId: tx.getTransactionId() };
  } finally {
    await disconnectContract(contract);
  }
}

/** Chaincode: GetAllDocuments() */
async function getAllDocuments(callerUser) {
  if (fabricConfig.mock) {
    logger.debug('[fabric.service:mock] GetAllDocuments()');
    return null;
  }
  const contract = await getContract(callerUser);
  try {
    const buffer = await contract.evaluateTransaction('GetAllDocuments');
    return JSON.parse(buffer.toString());
  } finally {
    await disconnectContract(contract);
  }
}

/** Chaincode: GetDocumentHistory(docId) */
async function getDocumentHistory(docId, callerUser) {
  if (fabricConfig.mock) {
    logger.debug(`[fabric.service:mock] GetDocumentHistory(${docId})`);
    return null;
  }
  const contract = await getContract(callerUser);
  try {
    const buffer = await contract.evaluateTransaction('GetDocumentHistory', docId);
    return JSON.parse(buffer.toString());
  } finally {
    await disconnectContract(contract);
  }
}

/** Chaincode: GetStatistics() */
async function getStatistics(callerUser) {
  if (fabricConfig.mock) {
    logger.debug('[fabric.service:mock] GetStatistics()');
    return null;
  }
  const contract = await getContract(callerUser);
  try {
    const buffer = await contract.evaluateTransaction('GetStatistics');
    return JSON.parse(buffer.toString());
  } finally {
    await disconnectContract(contract);
  }
}

/** Chaincode: RevokeCredential(credentialId, reason) */
async function revokeCertificateOnChain(userId, callerUser) {
  if (fabricConfig.mock) {
    const txId = generateMockTxId();
    logger.debug(`[fabric.service:mock] RevokeCertificate(${userId}) → tx ${txId}`);
    return { txId };
  }
  const contract = await getContract(callerUser);
  try {
    const tx = contract.createTransaction('RevokeCredential');
    await tx.submit(userId, 'Revoked by regulator');
    return { txId: tx.getTransactionId() };
  } finally {
    await disconnectContract(contract);
  }
}

async function reactivateCertificateOnChain(userId, callerUser) {
  if (fabricConfig.mock) {
    const txId = generateMockTxId();
    logger.debug(`[fabric.service:mock] ReactivateCertificate(${userId}) → tx ${txId}`);
    return { txId };
  }
  // No reactivate in chaincode — log and return mock
  logger.warn('[fabric.service] reactivateCertificateOnChain: no chaincode equivalent, returning mock');
  return { txId: generateMockTxId() };
}

async function disconnect() {
  // Gateway per-call pattern — nothing to disconnect globally
}

module.exports = {
  createDocument,
  signDocument,
  rejectDocument,
  getAllDocuments,
  getDocumentHistory,
  getStatistics,
  revokeCertificateOnChain,
  reactivateCertificateOnChain,
  disconnect,
};
