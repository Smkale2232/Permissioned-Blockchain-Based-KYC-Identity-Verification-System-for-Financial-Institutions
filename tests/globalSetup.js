const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '.mongo-test-config.json');

// Runs once, in the same process as globalTeardown.js (but a DIFFERENT
// process from the actual test files) — so we stash the server instance on
// `global` for teardown to reach, and write the connection URI to a small
// file for the test-file processes to read in setupAfterEnv.js.
module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ uri: mongod.getUri() }));
};
