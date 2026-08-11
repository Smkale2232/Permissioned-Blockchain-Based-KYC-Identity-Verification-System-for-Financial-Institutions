const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomFileId } = require('../services/crypto.service');
const { ALLOWED_MIME_TYPES } = require('../utils/constants');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Never trust the original filename on disk (path traversal, collisions).
    // Original name + real MIME are still stored in Mongo for display.
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${randomFileId()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  // UX-level check only — this is NOT the security boundary. Real validation
  // (magic-byte sniffing) should happen before the file is hashed/persisted;
  // see document.controller.js.
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Unsupported file type. Use PDF, Word, PNG, or JPEG.'));
  }
  cb(null, true);
}

const maxMb = Number(process.env.MAX_UPLOAD_MB || 10);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxMb * 1024 * 1024 },
});

module.exports = upload;
