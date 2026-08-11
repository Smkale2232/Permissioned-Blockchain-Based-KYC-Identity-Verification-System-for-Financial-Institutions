const { hashPassword, comparePassword, generateResetToken, hashResetToken } = require('../../src/utils/hash');

describe('hash.js — password/PIN hashing', () => {
  test('hashPassword produces a bcrypt hash, not the plaintext', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(hash).not.toBe('correct horse battery staple');
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
  });

  test('comparePassword returns true for the correct plaintext', async () => {
    const hash = await hashPassword('my-secret-password');
    expect(await comparePassword('my-secret-password', hash)).toBe(true);
  });

  test('comparePassword returns false for the wrong plaintext', async () => {
    const hash = await hashPassword('my-secret-password');
    expect(await comparePassword('wrong-password', hash)).toBe(false);
  });

  test('hashing the same plaintext twice produces different hashes (random salt)', async () => {
    const [a, b] = await Promise.all([hashPassword('same-input'), hashPassword('same-input')]);
    expect(a).not.toBe(b);
  });
});

describe('hash.js — reset tokens', () => {
  test('generateResetToken produces a long random hex string', () => {
    const token = generateResetToken();
    expect(token).toMatch(/^[0-9a-f]+$/);
    expect(token.length).toBeGreaterThanOrEqual(48); // 32 bytes hex-encoded = 64 chars
  });

  test('two generated tokens are never the same', () => {
    expect(generateResetToken()).not.toBe(generateResetToken());
  });

  test('hashResetToken is deterministic for the same input', () => {
    const token = generateResetToken();
    expect(hashResetToken(token)).toBe(hashResetToken(token));
  });

  test('hashResetToken never reveals the original token', () => {
    const token = generateResetToken();
    expect(hashResetToken(token)).not.toBe(token);
  });
});
