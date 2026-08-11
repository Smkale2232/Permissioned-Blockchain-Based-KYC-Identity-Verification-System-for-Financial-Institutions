const { app, request, createAuthedUser, MINIMAL_PDF_BUFFER } = require('../helpers');
const User = require('../../src/models/User');

async function uploadAndSign() {
  const uploader = await createAuthedUser({ role: 'user', pin: '1111' });
  const signer = await createAuthedUser({ role: 'signer', pin: '2222' });

  const uploadRes = await request(app)
    .post('/api/documents/upload')
    .set('Authorization', uploader.authHeader)
    .field('title', 'Verify Me')
    .field('pin', '1111')
    .attach('file', MINIMAL_PDF_BUFFER, { filename: 'test.pdf', contentType: 'application/pdf' });

  const signRes = await request(app)
    .post(`/api/documents/sign/${uploadRes.body.id}`)
    .set('Authorization', signer.authHeader)
    .send({ pin: '2222' });

  return { docId: uploadRes.body.id, signer, signRes };
}

describe('GET /api/verify/:docId — public endpoint', () => {
  test('requires no authentication', async () => {
    const res = await request(app).get('/api/verify/000000000000000000000000');
    expect(res.status).not.toBe(401);
  });

  test('returns 404 shape for a non-existent document', async () => {
    const res = await request(app).get('/api/verify/000000000000000000000000');
    expect(res.status).toBe(404);
    expect(res.body.found).toBe(false);
  });

  test('never exposes filePath, uploader email, or internal ids beyond docId', async () => {
    const { docId } = await uploadAndSign();
    const res = await request(app).get(`/api/verify/${docId}`);
    expect(res.status).toBe(200);
    expect(res.body.filePath).toBeUndefined();
    expect(res.body.uploadedByEmail).toBeUndefined();
    expect(res.body.signedByEmail).toBeUndefined();
  });

  test('a genuinely signed document reports a valid, trustworthy credential', async () => {
    const { docId } = await uploadAndSign();
    const res = await request(app).get(`/api/verify/${docId}`);
    expect(res.status).toBe(200);
    expect(res.body.credentialVerification.signatureValid).toBe(true);
    expect(res.body.credentialVerification.trustworthy).toBe(true);
  });

  test('revoking the signer AFTER signing flips trustworthy to false, but signatureValid stays true', async () => {
    const { docId, signer } = await uploadAndSign();

    // Signature math doesn't change — the credential JSON is immutable —
    // but the issuer's certificate status does, and verify must reflect that.
    await User.findByIdAndUpdate(signer.user.id, { certificateStatus: 'revoked' });

    const res = await request(app).get(`/api/verify/${docId}`);
    expect(res.body.credentialVerification.signatureValid).toBe(true);
    expect(res.body.credentialVerification.issuerCertificateStatus).toBe('revoked');
    expect(res.body.credentialVerification.trustworthy).toBe(false);
  });

  test('a pending (unsigned) document has no credential to verify', async () => {
    const uploader = await createAuthedUser({ role: 'user', pin: '1111' });
    const uploadRes = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', uploader.authHeader)
      .field('title', 'Still Pending')
      .field('pin', '1111')
      .attach('file', MINIMAL_PDF_BUFFER, { filename: 'test.pdf', contentType: 'application/pdf' });

    const res = await request(app).get(`/api/verify/${uploadRes.body.id}`);
    expect(res.body.credential).toBeNull();
    expect(res.body.credentialVerification).toBeNull();
  });
});

describe('GET /api/pki/:userId/certificate — public endpoint', () => {
  test('returns a real, usable public certificate for a real user', async () => {
    const { user } = await createAuthedUser({ role: 'signer' });
    const res = await request(app).get(`/api/pki/${user.id}/certificate`);
    expect(res.status).toBe(200);
    expect(res.body.certificatePem).toMatch(/-----BEGIN CERTIFICATE-----/);
    expect(res.body.publicKeyPem).toMatch(/-----BEGIN PUBLIC KEY-----/);
    expect(res.body.status).toBe('active');
    // Never the private key
    expect(res.body.privateKeyPem).toBeUndefined();
  });

  test('returns 404 for a non-existent user', async () => {
    const res = await request(app).get('/api/pki/000000000000000000000000/certificate');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/pki/revocation-list — public endpoint', () => {
  test('a revoked user appears on the list; an active one does not', async () => {
    const { user } = await createAuthedUser({ role: 'signer' });
    const before = await request(app).get('/api/pki/revocation-list');
    expect(before.body.revoked.map((r) => r.serialNumber)).not.toContain(
      (await User.findById(user.id)).certificateSerialNumber
    );

    const dbUser = await User.findByIdAndUpdate(user.id, { certificateStatus: 'revoked' }, { new: true });

    const after = await request(app).get('/api/pki/revocation-list');
    expect(after.body.revoked.map((r) => r.serialNumber)).toContain(dbUser.certificateSerialNumber);
  });
});
