const crypto = require('crypto');
const fs = require('fs');

// SHA-256 hash of a file already saved to disk — this is what actually goes
// on-chain (via fabric.service.js), never the raw file bytes.
function hashFileBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function hashFileAtPath(filePath) {
  const buffer = fs.readFileSync(filePath);
  return hashFileBuffer(buffer);
}

// Used by upload.middleware / document.controller to name files unpredictably
// on disk (prevents path traversal + guessable URLs), independent of the hash.
function randomFileId() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = { hashFileBuffer, hashFileAtPath, randomFileId };
