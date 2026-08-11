const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '.mongo-test-config.json');

module.exports = async function globalTeardown() {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
  if (fs.existsSync(CONFIG_PATH)) {
    fs.unlinkSync(CONFIG_PATH);
  }
};
