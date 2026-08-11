const { app, request, createAuthedUser, MINIMAL_PDF_BUFFER } = require('../helpers');

async function uploadDoc(authHeader, pin, overrides = {}) {
  return request(app)
    .post('/api/documents/upload')
    .set('Authorization', authHeader)
    .field('title', overrides.title || 'Test Document')
    .field('pin', pin)
    .attach('file', overrides.buffer || MINIMAL_PDF_BUFFER, { filename: 'test.pdf', contentType: 'application/pdf' });
}

describe('POST /api/documents/upload', () => {
  test('requires authentication', async () => {
    const res = await request(app).post('/api/documents/upload').field('title', 'x').field('pin', '1234');
    expect(res.status).toBe(401);
  });

  test('rejects a missing PIN', async () => {
    const { authHeader } = await createAuthedUser({ role: 'user' });
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', authHeader)
      .field('title', 'No Pin')
      .attach('file', MINIMAL_PDF_BUFFER, { filename: 'test.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
  });

  test('rejects an incorrect PIN', async () => {
    const { authHeader } = await createAuthedUser({ role: 'user', pin: '1234' });
    const res = await uploadDoc(authHeader, '9999');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/incorrect pin/i);
  });

  test('rejects a file whose content does not match its declared type', async () => {
    const { authHeader } = await createAuthedUser({ role: 'user', pin: '1234' });
    const res = await uploadDoc(authHeader, '1234', { buffer: Buffer.from('not a real pdf at all') });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/don't match/i);
  });

  test('a correct upload succeeds and creates a pending document', async () => {
    const { authHeader } = await createAuthedUser({ role: 'user', pin: '1234' });
    const res = await uploadDoc(authHeader, '1234', { title: 'My Contract' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('My Contract');
    expect(res.body.status).toBe('pending');
    expect(typeof res.body.fileHash).toBe('string');
  });

  test('rejects a title over the length limit', async () => {
    const { authHeader } = await createAuthedUser({ role: 'user', pin: '1234' });
    const res = await uploadDoc(authHeader, '1234', { title: 'x'.repeat(200) });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/documents/sign/:docId', () => {
  async function setupPendingDoc() {
    const uploader = await createAuthedUser({ role: 'user', pin: '1111' });
    const signer = await createAuthedUser({ role: 'signer', pin: '2222' });
    const uploadRes = await uploadDoc(uploader.authHeader, '1111');
    return { uploader, signer, docId: uploadRes.body.id };
  }

  test('requires the signer role', async () => {
    const { uploader, docId } = await setupPendingDoc();
    const res = await request(app)
      .post(`/api/documents/sign/${docId}`)
      .set('Authorization', uploader.authHeader)
      .send({ pin: '1111' });
    expect(res.status).toBe(403);
  });

  test('rejects an incorrect PIN', async () => {
    const { signer, docId } = await setupPendingDoc();
    const res = await request(app)
      .post(`/api/documents/sign/${docId}`)
      .set('Authorization', signer.authHeader)
      .send({ pin: '0000' });
    expect(res.status).toBe(401);
  });

  test('a correct sign succeeds and issues a verifiable, signature-valid credential', async () => {
    const { signer, docId } = await setupPendingDoc();
    const res = await request(app)
      .post(`/api/documents/sign/${docId}`)
      .set('Authorization', signer.authHeader)
      .send({ pin: '2222' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('signed');
    expect(res.body.credential).toBeDefined();
    expect(res.body.credential.credentialSubject.status).toBe('signed');
    expect(res.body.credential.proof.proofValue).toBeDefined();
  });

  test('signing an already-handled document returns 409', async () => {
    const { signer, docId } = await setupPendingDoc();
    await request(app).post(`/api/documents/sign/${docId}`).set('Authorization', signer.authHeader).send({ pin: '2222' });
    const second = await request(app)
      .post(`/api/documents/sign/${docId}`)
      .set('Authorization', signer.authHeader)
      .send({ pin: '2222' });
    expect(second.status).toBe(409);
  });
});

describe('POST /api/documents/reject/:docId', () => {
  test('a correct reject succeeds with an optional reason', async () => {
    const uploader = await createAuthedUser({ role: 'user', pin: '1111' });
    const signer = await createAuthedUser({ role: 'signer', pin: '2222' });
    const uploadRes = await uploadDoc(uploader.authHeader, '1111');

    const res = await request(app)
      .post(`/api/documents/reject/${uploadRes.body.id}`)
      .set('Authorization', signer.authHeader)
      .send({ pin: '2222', reason: 'Wrong file attached' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');
  });
});

describe('document access control', () => {
  test('an unrelated user cannot view another user\'s document history', async () => {
    const owner = await createAuthedUser({ role: 'user', pin: '1111' });
    const stranger = await createAuthedUser({ role: 'user', pin: '3333' });
    const uploadRes = await uploadDoc(owner.authHeader, '1111');

    const res = await request(app)
      .get(`/api/documents/${uploadRes.body.id}/history`)
      .set('Authorization', stranger.authHeader);
    expect(res.status).toBe(403);
  });

  test('a signer CAN view any document\'s history (privileged role)', async () => {
    const owner = await createAuthedUser({ role: 'user', pin: '1111' });
    const signer = await createAuthedUser({ role: 'signer', pin: '2222' });
    const uploadRes = await uploadDoc(owner.authHeader, '1111');

    const res = await request(app)
      .get(`/api/documents/${uploadRes.body.id}/history`)
      .set('Authorization', signer.authHeader);
    expect(res.status).toBe(200);
  });
});
