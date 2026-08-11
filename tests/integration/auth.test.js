const { app, request, createAuthedUser } = require('../helpers');

describe('POST /api/auth/register', () => {
  test('rejects a weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Weak Pw',
      email: 'weak@example.com',
      password: 'short',
      role: 'user',
      pin: '1234',
    });
    expect(res.status).toBe(400);
  });

  test('rejects a PIN outside 4-6 digits', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Pin',
      email: 'badpin@example.com',
      password: 'CorrectHorse123',
      role: 'user',
      pin: '123',
    });
    expect(res.status).toBe(400);
  });

  test('rejects an invalid role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Role',
      email: 'badrole@example.com',
      password: 'CorrectHorse123',
      role: 'admin',
      pin: '1234',
    });
    expect(res.status).toBe(400);
  });

  test('a valid registration succeeds and generates a real PKI identity', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Good User',
      email: 'good@example.com',
      password: 'CorrectHorse123',
      role: 'user',
      pin: '1234',
    });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('good@example.com');
    // toSafeJSON() must never leak the private key or password hash
    expect(res.body.privateKeyPem).toBeUndefined();
    expect(res.body.password).toBeUndefined();
    expect(res.body.certificateStatus).toBe('active');
  });

  test('rejects a duplicate email', async () => {
    await createAuthedUser({ email: 'dupe@example.com' });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dupe',
      email: 'dupe@example.com',
      password: 'CorrectHorse123',
      role: 'user',
      pin: '1234',
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  test('rejects a wrong password with a generic message', async () => {
    const { email } = await createAuthedUser();
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.message).not.toMatch(/exist|found/i); // must not confirm the account exists
  });

  test('rejects a non-existent email with the SAME generic message', async () => {
    const res1 = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'whatever123' });
    const { email } = await createAuthedUser();
    const res2 = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(res1.body.message).toBe(res2.body.message);
  });

  test('a correct login returns a token and the user', async () => {
    const { email, password } = await createAuthedUser();
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.email).toBe(email);
  });
});

describe('PUT /api/auth/profile', () => {
  test('requires authentication', async () => {
    const res = await request(app).put('/api/auth/profile').send({ name: 'New Name' });
    expect(res.status).toBe(401);
  });

  test('updates the display name', async () => {
    const { authHeader } = await createAuthedUser();
    const res = await request(app).put('/api/auth/profile').set('Authorization', authHeader).send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  test('rejects an empty name', async () => {
    const { authHeader } = await createAuthedUser();
    const res = await request(app).put('/api/auth/profile').set('Authorization', authHeader).send({ name: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/change-password', () => {
  test('rejects the wrong current password', async () => {
    const { authHeader } = await createAuthedUser();
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', authHeader)
      .send({ currentPassword: 'wrong', newPassword: 'NewPassword123' });
    expect(res.status).toBe(401);
  });

  test('changes the password, and the new one works at login', async () => {
    const { authHeader, email } = await createAuthedUser({ password: 'OldPassword123' });
    const change = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', authHeader)
      .send({ currentPassword: 'OldPassword123', newPassword: 'NewPassword123' });
    expect(change.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email, password: 'NewPassword123' });
    expect(login.status).toBe(200);
  });
});

describe('forgot-password / reset-password flow', () => {
  test('forgot-password gives a generic response for a non-existent email, with no token', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.resetToken).toBeUndefined();
  });

  test('forgot-password returns a dev-mode token for a real account, and it resets the password', async () => {
    const { email } = await createAuthedUser({ password: 'OriginalPassword123' });

    const forgot = await request(app).post('/api/auth/forgot-password').send({ email });
    expect(forgot.status).toBe(200);
    expect(typeof forgot.body.resetToken).toBe('string');

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ email, token: forgot.body.resetToken, newPassword: 'BrandNewPassword123' });
    expect(reset.status).toBe(200);

    const login = await request(app).post('/api/auth/login').send({ email, password: 'BrandNewPassword123' });
    expect(login.status).toBe(200);
  });

  test('reset-password rejects an invalid token', async () => {
    const { email } = await createAuthedUser();
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email, token: 'not-the-real-token', newPassword: 'BrandNewPassword123' });
    expect(res.status).toBe(400);
  });
});
