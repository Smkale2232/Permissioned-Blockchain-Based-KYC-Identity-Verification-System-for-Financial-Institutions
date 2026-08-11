const { app, request, createAuthedUser } = require('../helpers');

describe('regulator routes — authorization', () => {
  test('a non-regulator gets 403 on every regulator route', async () => {
    const { authHeader } = await createAuthedUser({ role: 'user' });
    const endpoints = ['/api/regulator/statistics', '/api/regulator/documents', '/api/regulator/audit-trail', '/api/regulator/users'];
    for (const url of endpoints) {
      const res = await request(app).get(url).set('Authorization', authHeader);
      expect(res.status).toBe(403);
    }
  });

  test('an unauthenticated request gets 401, not 403', async () => {
    const res = await request(app).get('/api/regulator/statistics');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/regulator/certificates/:userId/revoke and /reactivate', () => {
  async function setup() {
    const regulator = await createAuthedUser({ role: 'user' }); // placeholder, overwritten below
    return regulator;
  }

  test('revoke then reactivate flips certificateStatus both ways, and both are audited', async () => {
    // There's no public "register as regulator" endpoint (by design — see
    // backend/src/utils/seed.js) so we register as 'user' then promote
    // directly via the model for this test only.
    const User = require('../../src/models/User');
    const target = await createAuthedUser({ role: 'user' });

    const regUser = await createAuthedUser({ role: 'user' });
    await User.findByIdAndUpdate(regUser.user.id, { role: 'regulator' });
    const regulatorLogin = await request(app).post('/api/auth/login').send({ email: regUser.email, password: regUser.password });
    const regulatorAuth = `Bearer ${regulatorLogin.body.token}`;

    const revoke = await request(app)
      .post(`/api/regulator/certificates/${target.user.id}/revoke`)
      .set('Authorization', regulatorAuth);
    expect(revoke.status).toBe(200);
    expect(revoke.body.certificateStatus).toBe('revoked');

    // Revoking again should 409
    const revokeAgain = await request(app)
      .post(`/api/regulator/certificates/${target.user.id}/revoke`)
      .set('Authorization', regulatorAuth);
    expect(revokeAgain.status).toBe(409);

    const reactivate = await request(app)
      .post(`/api/regulator/certificates/${target.user.id}/reactivate`)
      .set('Authorization', regulatorAuth);
    expect(reactivate.status).toBe(200);
    expect(reactivate.body.certificateStatus).toBe('active');

    // Both events should be in the audit trail
    const auditRes = await request(app)
      .get(`/api/regulator/audit-trail?userId=${target.user.id}`)
      .set('Authorization', regulatorAuth);
    const actions = auditRes.body.map((e) => e.action);
    expect(actions).toContain('cert_revoked');
    expect(actions).toContain('cert_reactivated');
  });

  test('a revoked user is rejected at login', async () => {
    const User = require('../../src/models/User');
    const target = await createAuthedUser({ role: 'user' });
    await User.findByIdAndUpdate(target.user.id, { certificateStatus: 'revoked' });

    const res = await request(app).post('/api/auth/login').send({ email: target.email, password: target.password });
    expect(res.status).toBe(403);
  });

  test("a revoked user's existing token is rejected on the very next request (not just at next login)", async () => {
    const User = require('../../src/models/User');
    const target = await createAuthedUser({ role: 'user' });
    // Token was issued while still active — revoke AFTER the token exists.
    await User.findByIdAndUpdate(target.user.id, { certificateStatus: 'revoked' });

    const res = await request(app).get('/api/documents').set('Authorization', target.authHeader);
    expect(res.status).toBe(403);
  });
});
