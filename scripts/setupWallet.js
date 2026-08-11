const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

// backend/scripts/ -> backend/ -> decentralized-kyc/ -> fabric-network/
const FABRIC_BASE = path.resolve(__dirname, '../../fabric-network/organizations/cryptogen');
const WALLET_PATH = path.resolve(__dirname, '../wallet');

console.log('FABRIC_BASE:', FABRIC_BASE);
console.log('WALLET_PATH:', WALLET_PATH);

const identities = [
  {
    label: 'bankA-admin',
    mspId: 'BankAMSP',
    certPath: `${FABRIC_BASE}/peerOrganizations/banka.com/users/Admin@banka.com/msp/signcerts/Admin@banka.com-cert.pem`,
    keyDir:   `${FABRIC_BASE}/peerOrganizations/banka.com/users/Admin@banka.com/msp/keystore`,
  },
  {
    label: 'bankB-admin',
    mspId: 'BankBMSP',
    certPath: `${FABRIC_BASE}/peerOrganizations/bankb.com/users/Admin@bankb.com/msp/signcerts/Admin@bankb.com-cert.pem`,
    keyDir:   `${FABRIC_BASE}/peerOrganizations/bankb.com/users/Admin@bankb.com/msp/keystore`,
  },
  {
    label: 'regulator-admin',
    mspId: 'RegulatorMSP',
    certPath: `${FABRIC_BASE}/peerOrganizations/regulator.com/users/Admin@regulator.com/msp/signcerts/Admin@regulator.com-cert.pem`,
    keyDir:   `${FABRIC_BASE}/peerOrganizations/regulator.com/users/Admin@regulator.com/msp/keystore`,
  },
  {
    label: 'bankA-user1',
    mspId: 'BankAMSP',
    certPath: `${FABRIC_BASE}/peerOrganizations/banka.com/users/User1@banka.com/msp/signcerts/User1@banka.com-cert.pem`,
    keyDir:   `${FABRIC_BASE}/peerOrganizations/banka.com/users/User1@banka.com/msp/keystore`,
  },
];

async function main() {
  const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);

  for (const id of identities) {
    const existing = await wallet.get(id.label);
    if (existing) {
      console.log(`✓ ${id.label} already in wallet`);
      continue;
    }

    if (!fs.existsSync(id.certPath)) {
      console.error(`✗ Cert not found: ${id.certPath}`);
      continue;
    }

    const cert = fs.readFileSync(id.certPath).toString();
    const keyFiles = fs.readdirSync(id.keyDir).filter(f => f.endsWith('_sk') || f.endsWith('-key.pem'));
    if (!keyFiles.length) {
      console.error(`✗ No key found in ${id.keyDir}`);
      continue;
    }
    const key = fs.readFileSync(path.join(id.keyDir, keyFiles[0])).toString();

    const identity = { credentials: { certificate: cert, privateKey: key }, mspId: id.mspId, type: 'X.509' };
    await wallet.put(id.label, identity);
    console.log(`✓ Imported ${id.label} (${id.mspId})`);
  }

  console.log('\nWallet contents:');
  const labels = await wallet.list();
  labels.forEach(l => console.log(' -', l));
}

main().catch(e => { console.error(e); process.exit(1); });
