const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const CONFIG_PATH = path.join(__dirname, '.mongo-test-config.json');

// Safe, deterministic env vars for every test run — set here (not in a
// checked-in .env.test) so tests never depend on a developer's local .env
// file existing or matching what tests expect.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-do-not-use-in-real-deployments-0000';
process.env.JWT_EXPIRES_IN = '1h';
process.env.FABRIC_MOCK = 'true';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.AUTH_RATE_LIMIT_MAX = '1000'; // rate limiting isn't what these tests are checking
process.env.PIN_RATE_LIMIT_MAX = '1000';

beforeAll(async () => {
  const { uri } = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri);
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.close();
});
