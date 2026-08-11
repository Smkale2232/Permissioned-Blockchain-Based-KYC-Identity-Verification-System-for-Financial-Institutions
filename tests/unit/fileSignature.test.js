const fs = require('fs');
const os = require('os');
const path = require('path');
const { verifyFileSignature } = require('../../src/utils/fileSignature');

function writeTempFile(bytes) {
  const filePath = path.join(os.tmpdir(), `fsig-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.writeFileSync(filePath, Buffer.from(bytes));
  return filePath;
}

describe('fileSignature.verifyFileSignature', () => {
  const cases = [
    { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34] }, // %PDF-1.4
    { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
    { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10] },
    {
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      bytes: [0x50, 0x4b, 0x03, 0x04],
    },
    { mime: 'application/msword', bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
  ];

  test.each(cases)('accepts a genuine $mime file', ({ mime, bytes }) => {
    const filePath = writeTempFile(bytes);
    try {
      expect(verifyFileSignature(filePath, mime)).toBe(true);
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test('rejects a file whose bytes do not match its declared MIME type', () => {
    // Plain text pretending to be a PDF
    const filePath = writeTempFile(Buffer.from('not actually a pdf', 'utf8'));
    try {
      expect(verifyFileSignature(filePath, 'application/pdf')).toBe(false);
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test('rejects an unrecognized declared MIME type', () => {
    const filePath = writeTempFile([0x25, 0x50, 0x44, 0x46]);
    try {
      expect(verifyFileSignature(filePath, 'application/x-executable')).toBe(false);
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test('rejects a file shorter than the expected signature', () => {
    const filePath = writeTempFile([0x25, 0x50]); // truncated %PDF
    try {
      expect(verifyFileSignature(filePath, 'application/pdf')).toBe(false);
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test('a renamed .docx (zip) masquerading as a .pdf is rejected', () => {
    // Real .docx files start with the zip signature, not %PDF — this is the
    // exact "renamed file" attack this check exists to catch.
    const filePath = writeTempFile([0x50, 0x4b, 0x03, 0x04]);
    try {
      expect(verifyFileSignature(filePath, 'application/pdf')).toBe(false);
    } finally {
      fs.unlinkSync(filePath);
    }
  });
});
