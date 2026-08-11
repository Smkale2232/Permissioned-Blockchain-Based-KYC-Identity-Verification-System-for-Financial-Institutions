const fs = require('fs');

// Client-supplied MIME type (what multer's fileFilter checks) is just a
// header the uploader's browser sends — trivially spoofable. This reads the
// first few bytes actually on disk and checks them against known magic
// numbers for each type we claim to support, so a renamed .exe can't slip
// through as a "PDF" just because the request said so.
//
// One signature checker per entry in ALLOWED_MIME_TYPES (utils/constants.js).
const SIGNATURES = [
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] }, // .PNG
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  // .docx is a zip archive (PK\x03\x04); .doc (legacy) is OLE2 (D0 CF 11 E0).
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', bytes: [0x50, 0x4b, 0x03, 0x04] },
  { mime: 'application/msword', bytes: [0xd0, 0xcf, 0x11, 0xe0] },
];

function readHeaderBytes(filePath, length = 8) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const bytesRead = fs.readSync(fd, buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    fs.closeSync(fd);
  }
}

function matchesSignature(header, sig) {
  if (header.length < sig.bytes.length) return false;
  return sig.bytes.every((byte, i) => header[i] === byte);
}

/**
 * Returns true if the file on disk actually starts with the magic bytes for
 * the given declared MIME type. Returns false for an unrecognized MIME type
 * too — callers should already be filtering against ALLOWED_MIME_TYPES
 * before this runs, so an unrecognized type here means something is wrong.
 */
function verifyFileSignature(filePath, declaredMimeType) {
  const sig = SIGNATURES.find((s) => s.mime === declaredMimeType);
  if (!sig) return false;
  const header = readHeaderBytes(filePath, 8);
  return matchesSignature(header, sig);
}

module.exports = { verifyFileSignature };
