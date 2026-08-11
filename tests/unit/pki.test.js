const forge = require('node-forge');
const pkiService = require('../../src/services/pki.service');

describe('pki.service', () => {
  const identity = { name: 'Alice Signer', email: 'alice@example.com', role: 'signer' };

  test('generateIdentity produces a valid, parseable self-signed X.509 certificate', () => {
    const result = pkiService.generateIdentity(identity);

    expect(result.publicKeyPem).toMatch(/-----BEGIN PUBLIC KEY-----/);
    expect(result.privateKeyPem).toMatch(/-----BEGIN (RSA )?PRIVATE KEY-----/);
    expect(result.certificatePem).toMatch(/-----BEGIN CERTIFICATE-----/);
    expect(typeof result.serialNumber).toBe('string');

    // The certificate must actually parse as X.509 and bind to the identity
    // we asked for — this is the "not just a string field" check.
    const cert = forge.pki.certificateFromPem(result.certificatePem);
    expect(cert.subject.getField('CN').value).toBe(identity.name);
    expect(cert.subject.getField('emailAddress').value).toBe(identity.email);
    // Self-signed: issuer === subject
    expect(cert.issuer.getField('CN').value).toBe(identity.name);

    // The certificate's embedded public key must match the returned public key
    const certPublicKeyPem = forge.pki.publicKeyToPem(cert.publicKey);
    expect(certPublicKeyPem).toBe(result.publicKeyPem);

    // Validity window: not expired, not before "now"
    expect(cert.validity.notBefore.getTime()).toBeLessThanOrEqual(Date.now());
    expect(cert.validity.notAfter.getTime()).toBeGreaterThan(Date.now());
  });

  test('two identities never share a serial number or keypair', () => {
    const a = pkiService.generateIdentity(identity);
    const b = pkiService.generateIdentity({ ...identity, email: 'bob@example.com' });
    expect(a.serialNumber).not.toBe(b.serialNumber);
    expect(a.privateKeyPem).not.toBe(b.privateKeyPem);
  });

  test('signData + verifySignature round-trip correctly with the matching key', () => {
    const { publicKeyPem, privateKeyPem } = pkiService.generateIdentity(identity);
    const signature = pkiService.signData('hello world', privateKeyPem);
    expect(pkiService.verifySignature('hello world', signature, publicKeyPem)).toBe(true);
  });

  test('verifySignature rejects a signature over different data (tamper detection)', () => {
    const { publicKeyPem, privateKeyPem } = pkiService.generateIdentity(identity);
    const signature = pkiService.signData('original data', privateKeyPem);
    expect(pkiService.verifySignature('tampered data', signature, publicKeyPem)).toBe(false);
  });

  test('verifySignature rejects a signature checked against the wrong public key', () => {
    const a = pkiService.generateIdentity(identity);
    const b = pkiService.generateIdentity({ ...identity, email: 'bob@example.com' });
    const signature = pkiService.signData('hello world', a.privateKeyPem);
    expect(pkiService.verifySignature('hello world', signature, b.publicKeyPem)).toBe(false);
  });

  test('verifySignature never throws on garbage input — returns false', () => {
    const { publicKeyPem } = pkiService.generateIdentity(identity);
    expect(() => pkiService.verifySignature('data', 'not-base64!!!', publicKeyPem)).not.toThrow();
    expect(pkiService.verifySignature('data', 'not-base64!!!', publicKeyPem)).toBe(false);
    expect(pkiService.verifySignature('data', '', 'not a real pem')).toBe(false);
  });
});
