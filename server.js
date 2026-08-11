require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const fabricConfig = require('./src/config/fabric');
const validateEnv = require('./src/config/validateEnv');

const PORT = process.env.PORT || 5000;

async function start() {
  validateEnv();
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`DocChain backend running at http://localhost:${PORT}`);
    logger.info(`Swagger docs at http://localhost:${PORT}/api-docs`);
    logger.info(
      fabricConfig.mock
        ? 'Fabric: running in MOCK mode (FABRIC_MOCK=true) — no live Fabric network required.'
        : `Fabric: connected to channel "${fabricConfig.channelName}", chaincode "${fabricConfig.chaincodeName}".`
    );
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
