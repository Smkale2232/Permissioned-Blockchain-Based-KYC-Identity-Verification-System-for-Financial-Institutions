// Fill in the real values (connection profile path, channel/chaincode
// names, CA settings). Everyone else should only need to read FABRIC_MOCK.
module.exports = {
  mock: String(process.env.FABRIC_MOCK || 'true').toLowerCase() === 'true',
  channelName: process.env.FABRIC_CHANNEL_NAME || 'documentchannel',
  chaincodeName: process.env.FABRIC_CHAINCODE_NAME || 'doccc',
  connectionProfilePath: process.env.FABRIC_CONNECTION_PROFILE || './src/config/connection-profile.json',
  walletPath: process.env.FABRIC_WALLET_PATH || './wallet',
  caUrl: process.env.FABRIC_CA_URL || 'https://localhost:7054',
  caName: process.env.FABRIC_CA_NAME || 'ca-org1',
  mspId: process.env.FABRIC_MSP_ID || 'Org1MSP',
  adminUser: process.env.FABRIC_ADMIN_USER || 'admin',
  adminPassword: process.env.FABRIC_ADMIN_PASSWORD || 'adminpw',
};
