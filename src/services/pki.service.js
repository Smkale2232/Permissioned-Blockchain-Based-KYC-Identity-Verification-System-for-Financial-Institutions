const crypto = require('crypto');
const forge = require('node-forge');

// --- What this is, and what it deliberately is not ---
//
// This generates a REAL RSA-2048 keypair and a REAL self-signed X.509
// certificate per account, and uses that keypair to actually sign the
// Verifiable Credentials issued when a document is signed (see
// credential.service.js). The certificate is genuinely parseable by any
// standard X.509 tooling (openssl, forge, etc.) — it is not a cosmetic
// "certificateStatus" string pretending to be PKI.
//
// What this is NOT: a real Certificate Authority. Every certificate here is
// self-signed by the platform acting as its own root — there is no CA
// hierarchy, no OCSP responder, and no mutual-TLS / client-certificate
// authentication flow (login is still JWT + password/PIN, as documented in
// SECURITY.md). Private keys are generated and held server-side, signing
// happens server-side when a signer confirms their PIN — there is no
// end-user key custody (no wallet, no browser-held private key). This
// mirrors how enterprise HSM-backed signing services work in practice (the
// human authorizes an action; the platform holds and uses the key on their
// behalf) and is an explicit, documented simplification appropriate for a
// class project — see SECURITY.md and PKI.md for the full disclosure.

const KEY_SIZE_BITS = 2048;
const CERT_VALIDITY_YEARS = 2;

/**
 * Generates an RSA-2048 keypair and a self-signed X.509 certificate binding
 * that keypair to the given identity. Called once at registration.
 * @param {{ name: string, email: string, role: string }} identity
 * @returns {{ publicKeyPem: string, privateKeyPem: string, certificatePem: string, serialNumber: string }}
 */
function generateIdentity(identity) {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: KEY_SIZE_BITS });

  const cert = forge.pki.createCertificate();
  cert.publicKey = keypair.publicKey;

  // Serial numbers must be unique and, per the X.509 spec, must not have a
  // leading zero bit when read as a signed integer — prefixing with '00' is
  // the standard trick to keep it unambiguously positive.
  cert.serialNumber = '00' + crypto.randomBytes(15).toString('hex');

  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + CERT_VALIDITY_YEARS);

  const attrs = [
    { name: 'commonName', value: identity.name },
    { name: 'organizationName', value: 'DocChain' },
    { shortName: 'OU', value: identity.role },
    { name: 'emailAddress', value: identity.email },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs); // self-signed: issuer === subject

  cert.setExtensions([
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
    { name: 'subjectKeyIdentifier' },
  ]);

  cert.sign(keypair.privateKey, forge.md.sha256.create());

  return {
    publicKeyPem: forge.pki.publicKeyToPem(keypair.publicKey),
    privateKeyPem: forge.pki.privateKeyToPem(keypair.privateKey),
    certificatePem: forge.pki.certificateToPem(cert),
    serialNumber: cert.serialNumber,
  };
}

/**
 * Signs arbitrary string data (in practice, a canonical JSON string — see
 * credential.service.js) with an RSA private key, RSA-SHA256. Returns a
 * base64 signature suitable for embedding in a Verifiable Credential's
 * `proof.proofValue`.
 */
function signData(data, privateKeyPem) {
  const signature = crypto.sign('sha256', Buffer.from(data, 'utf8'), privateKeyPem);
  return signature.toString('base64');
}

/**
 * Verifies a base64 RSA-SHA256 signature against the given data and public
 * key. Returns false (never throws) on any malformed input — a verification
 * endpoint should treat "couldn't verify" and "verified false" the same way.
 */
function verifySignature(data, signatureBase64, publicKeyPem) {
  try {
    const signature = Buffer.from(signatureBase64, 'base64');
    return crypto.verify('sha256', Buffer.from(data, 'utf8'), publicKeyPem, signature);
  } catch {
    return false;
  }
}

module.exports = { generateIdentity, signData, verifySignature };
