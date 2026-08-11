const request = require('supertest');
const app = require('../src/app');

let counter = 0;

/** Registers and logs in a fresh user, returns { user, token, authHeader }. */
async function createAuthedUser(overrides = {}) {
  counter += 1;
  const email = overrides.email || `test-user-${Date.now()}-${counter}@example.com`;
  const password = overrides.password || 'CorrectHorse123';
  const pin = overrides.pin || '1234';

  const registerRes = await request(app).post('/api/auth/register').send({
    name: overrides.name || `Test User ${counter}`,
    email,
    password,
    role: overrides.role || 'user',
    pin,
  });

  if (registerRes.status !== 201) {
    throw new Error(`createAuthedUser: register failed (${registerRes.status}): ${JSON.stringify(registerRes.body)}`);
  }

  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  if (loginRes.status !== 200) {
    throw new Error(`createAuthedUser: login failed (${loginRes.status}): ${JSON.stringify(loginRes.body)}`);
  }

  return {
    user: loginRes.body.user,
    token: loginRes.body.token,
    authHeader: `Bearer ${loginRes.body.token}`,
    email,
    password,
    pin,
  };
}

// A minimal but byte-valid PDF — just enough for the magic-byte check
// (verifyFileSignature only reads the first 8 bytes) and for multer to
// accept it as application/pdf.
const MINIMAL_PDF_BUFFER = Buffer.from('%PDF-1.4\n%%EOF\n');

module.exports = { app, request, createAuthedUser, MINIMAL_PDF_BUFFER };
