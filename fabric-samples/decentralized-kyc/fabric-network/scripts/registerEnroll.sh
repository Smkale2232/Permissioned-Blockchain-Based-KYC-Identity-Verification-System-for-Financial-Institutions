#!/bin/bash
set -e

export PATH=$HOME/fabric-samples/bin:$PATH

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$SCRIPT_DIR/.."

echo "============================================"
echo " Starting enrollment for all 3 organizations"
echo " BASE = $BASE"
echo "============================================"

# Helper: copy TLS output files to standard names
copy_tls() {
  local DIR=$1
  cp $DIR/signcerts/*.pem       $DIR/server.crt
  cp $DIR/tlscacerts/*.pem      $DIR/ca.crt
  # keystore file is named with _sk suffix not .pem
  local KEY=$(ls $DIR/keystore/ | grep -v Issuer | head -1)
  cp $DIR/keystore/$KEY         $DIR/server.key
}

# ─────────────────────────────────────
# BANK A
# ─────────────────────────────────────
echo ""
echo ">>> [BankA] Enrolling CA admin..."
export FABRIC_CA_CLIENT_HOME=$BASE/organizations/bankA

fabric-ca-client enroll \
  -u https://admin:adminpw@localhost:7054 \
  --caname ca.banka.com \
  --tls.certfiles $BASE/organizations/bankA/ca/ca-cert.pem

echo ">>> [BankA] Registering identities..."
fabric-ca-client register --caname ca.banka.com \
  --id.name peer0.banka.com --id.secret peer0pw --id.type peer \
  --tls.certfiles $BASE/organizations/bankA/ca/ca-cert.pem

fabric-ca-client register --caname ca.banka.com \
  --id.name orderer.banka.com --id.secret ordererpw --id.type orderer \
  --tls.certfiles $BASE/organizations/bankA/ca/ca-cert.pem

fabric-ca-client register --caname ca.banka.com \
  --id.name bankAadmin --id.secret bankAadminpw --id.type admin \
  --tls.certfiles $BASE/organizations/bankA/ca/ca-cert.pem

fabric-ca-client register --caname ca.banka.com \
  --id.name kycofficer.banka --id.secret kycofficerpw --id.type client \
  --id.attrs "role=signer:ecert" \
  --tls.certfiles $BASE/organizations/bankA/ca/ca-cert.pem

echo ">>> [BankA] Enrolling peer0 MSP..."
fabric-ca-client enroll \
  -u https://peer0.banka.com:peer0pw@localhost:7054 \
  --caname ca.banka.com \
  -M $BASE/organizations/bankA/peers/peer0.banka.com/msp \
  --tls.certfiles $BASE/organizations/bankA/ca/ca-cert.pem

echo ">>> [BankA] Enrolling peer0 TLS..."
fabric-ca-client enroll \
  -u https://peer0.banka.com:peer0pw@localhost:7054 \
  --caname ca.banka.com \
  -M $BASE/organizations/bankA/peers/peer0.banka.com/tls \
  --enrollment.profile tls \
  --csr.hosts peer0.banka.com,localhost \
  --tls.certfiles $BASE/organizations/bankA/ca/ca-cert.pem
copy_tls $BASE/organizations/bankA/peers/peer0.banka.com/tls

echo ">>> [BankA] Enrolling orderer MSP..."
fabric-ca-client enroll \
  -u https://orderer.banka.com:ordererpw@localhost:7054 \
  --caname ca.banka.com \
  -M $BASE/organizations/bankA/orderers/orderer.banka.com/msp \
  --tls.certfiles $BASE/organizations/bankA/ca/ca-cert.pem

echo ">>> [BankA] Enrolling orderer TLS..."
fabric-ca-client enroll \
  -u https://orderer.banka.com:ordererpw@localhost:7054 \
  --caname ca.banka.com \
  -M $BASE/organizations/bankA/orderers/orderer.banka.com/tls \
  --enrollment.profile tls \
  --csr.hosts orderer.banka.com,localhost \
  --tls.certfiles $BASE/organizations/bankA/ca/ca-cert.pem
copy_tls $BASE/organizations/bankA/orderers/orderer.banka.com/tls

echo ">>> [BankA] Enrolling admin user..."
fabric-ca-client enroll \
  -u https://bankAadmin:bankAadminpw@localhost:7054 \
  --caname ca.banka.com \
  -M $BASE/organizations/bankA/users/Admin@banka.com/msp \
  --tls.certfiles $BASE/organizations/bankA/ca/ca-cert.pem

echo ">>> BankA DONE"

# ─────────────────────────────────────
# BANK B
# ─────────────────────────────────────
echo ""
echo ">>> [BankB] Enrolling CA admin..."
export FABRIC_CA_CLIENT_HOME=$BASE/organizations/bankB

fabric-ca-client enroll \
  -u https://admin:adminpw@localhost:8054 \
  --caname ca.bankb.com \
  --tls.certfiles $BASE/organizations/bankB/ca/ca-cert.pem

fabric-ca-client register --caname ca.bankb.com \
  --id.name peer0.bankb.com --id.secret peer0pw --id.type peer \
  --tls.certfiles $BASE/organizations/bankB/ca/ca-cert.pem

fabric-ca-client register --caname ca.bankb.com \
  --id.name orderer.bankb.com --id.secret ordererpw --id.type orderer \
  --tls.certfiles $BASE/organizations/bankB/ca/ca-cert.pem

fabric-ca-client register --caname ca.bankb.com \
  --id.name bankBadmin --id.secret bankBadminpw --id.type admin \
  --tls.certfiles $BASE/organizations/bankB/ca/ca-cert.pem

fabric-ca-client register --caname ca.bankb.com \
  --id.name kycofficer.bankb --id.secret kycofficerpw --id.type client \
  --id.attrs "role=signer:ecert" \
  --tls.certfiles $BASE/organizations/bankB/ca/ca-cert.pem

fabric-ca-client enroll \
  -u https://peer0.bankb.com:peer0pw@localhost:8054 \
  --caname ca.bankb.com \
  -M $BASE/organizations/bankB/peers/peer0.bankb.com/msp \
  --tls.certfiles $BASE/organizations/bankB/ca/ca-cert.pem

fabric-ca-client enroll \
  -u https://peer0.bankb.com:peer0pw@localhost:8054 \
  --caname ca.bankb.com \
  -M $BASE/organizations/bankB/peers/peer0.bankb.com/tls \
  --enrollment.profile tls \
  --csr.hosts peer0.bankb.com,localhost \
  --tls.certfiles $BASE/organizations/bankB/ca/ca-cert.pem
copy_tls $BASE/organizations/bankB/peers/peer0.bankb.com/tls

fabric-ca-client enroll \
  -u https://orderer.bankb.com:ordererpw@localhost:8054 \
  --caname ca.bankb.com \
  -M $BASE/organizations/bankB/orderers/orderer.bankb.com/msp \
  --tls.certfiles $BASE/organizations/bankB/ca/ca-cert.pem

fabric-ca-client enroll \
  -u https://orderer.bankb.com:ordererpw@localhost:8054 \
  --caname ca.bankb.com \
  -M $BASE/organizations/bankB/orderers/orderer.bankb.com/tls \
  --enrollment.profile tls \
  --csr.hosts orderer.bankb.com,localhost \
  --tls.certfiles $BASE/organizations/bankB/ca/ca-cert.pem
copy_tls $BASE/organizations/bankB/orderers/orderer.bankb.com/tls

fabric-ca-client enroll \
  -u https://bankBadmin:bankBadminpw@localhost:8054 \
  --caname ca.bankb.com \
  -M $BASE/organizations/bankB/users/Admin@bankb.com/msp \
  --tls.certfiles $BASE/organizations/bankB/ca/ca-cert.pem

echo ">>> BankB DONE"

# ─────────────────────────────────────
# REGULATOR
# ─────────────────────────────────────
echo ""
echo ">>> [Regulator] Enrolling CA admin..."
export FABRIC_CA_CLIENT_HOME=$BASE/organizations/regulator

fabric-ca-client enroll \
  -u https://admin:adminpw@localhost:9054 \
  --caname ca.regulator.com \
  --tls.certfiles $BASE/organizations/regulator/ca/ca-cert.pem

fabric-ca-client register --caname ca.regulator.com \
  --id.name peer0.regulator.com --id.secret peer0pw --id.type peer \
  --tls.certfiles $BASE/organizations/regulator/ca/ca-cert.pem

fabric-ca-client register --caname ca.regulator.com \
  --id.name orderer.regulator.com --id.secret ordererpw --id.type orderer \
  --tls.certfiles $BASE/organizations/regulator/ca/ca-cert.pem

fabric-ca-client register --caname ca.regulator.com \
  --id.name regulatoradmin --id.secret regulatoradminpw --id.type admin \
  --id.attrs "role=regulator:ecert" \
  --tls.certfiles $BASE/organizations/regulator/ca/ca-cert.pem

fabric-ca-client enroll \
  -u https://peer0.regulator.com:peer0pw@localhost:9054 \
  --caname ca.regulator.com \
  -M $BASE/organizations/regulator/peers/peer0.regulator.com/msp \
  --tls.certfiles $BASE/organizations/regulator/ca/ca-cert.pem

fabric-ca-client enroll \
  -u https://peer0.regulator.com:peer0pw@localhost:9054 \
  --caname ca.regulator.com \
  -M $BASE/organizations/regulator/peers/peer0.regulator.com/tls \
  --enrollment.profile tls \
  --csr.hosts peer0.regulator.com,localhost \
  --tls.certfiles $BASE/organizations/regulator/ca/ca-cert.pem
copy_tls $BASE/organizations/regulator/peers/peer0.regulator.com/tls

fabric-ca-client enroll \
  -u https://orderer.regulator.com:ordererpw@localhost:9054 \
  --caname ca.regulator.com \
  -M $BASE/organizations/regulator/orderers/orderer.regulator.com/msp \
  --tls.certfiles $BASE/organizations/regulator/ca/ca-cert.pem

fabric-ca-client enroll \
  -u https://orderer.regulator.com:ordererpw@localhost:9054 \
  --caname ca.regulator.com \
  -M $BASE/organizations/regulator/orderers/orderer.regulator.com/tls \
  --enrollment.profile tls \
  --csr.hosts orderer.regulator.com,localhost \
  --tls.certfiles $BASE/organizations/regulator/ca/ca-cert.pem
copy_tls $BASE/organizations/regulator/orderers/orderer.regulator.com/tls

fabric-ca-client enroll \
  -u https://regulatoradmin:regulatoradminpw@localhost:9054 \
  --caname ca.regulator.com \
  -M $BASE/organizations/regulator/users/Admin@regulator.com/msp \
  --tls.certfiles $BASE/organizations/regulator/ca/ca-cert.pem

echo ">>> Regulator DONE"

# ─────────────────────────────────────
# BUILD COMBINED TLS CA BUNDLE
# ─────────────────────────────────────
echo ""
echo ">>> Building combined TLS CA bundle..."
mkdir -p $BASE/organizations/tls-ca

cat $BASE/organizations/bankA/orderers/orderer.banka.com/tls/ca.crt \
    $BASE/organizations/bankB/orderers/orderer.bankb.com/tls/ca.crt \
    $BASE/organizations/regulator/orderers/orderer.regulator.com/tls/ca.crt \
    > $BASE/organizations/tls-ca/all-tls-ca.crt

echo ">>> Combined bundle contains $(grep -c 'BEGIN CERTIFICATE' $BASE/organizations/tls-ca/all-tls-ca.crt) certificates"

# Replace every orderer and peer tls/ca.crt with combined bundle
for ORG in bankA bankB regulator; do
  case $ORG in
    bankA) DOMAIN="banka" ;;
    bankB) DOMAIN="bankb" ;;
    regulator) DOMAIN="regulator" ;;
  esac
  cp $BASE/organizations/tls-ca/all-tls-ca.crt \
     $BASE/organizations/$ORG/orderers/orderer.$DOMAIN.com/tls/ca.crt
  cp $BASE/organizations/tls-ca/all-tls-ca.crt \
     $BASE/organizations/$ORG/peers/peer0.$DOMAIN.com/tls/ca.crt
done

# Copy combined bundle into each org MSP tlscacerts
for ORG in bankA bankB regulator; do
  mkdir -p $BASE/organizations/$ORG/msp/tlscacerts
  cp $BASE/organizations/tls-ca/all-tls-ca.crt \
     $BASE/organizations/$ORG/msp/tlscacerts/all-tls-ca.crt
done

# Write config.yaml for each org MSP and copy down to peers/orderers/users
for ORG in bankA bankB regulator; do
  case $ORG in
    bankA) PORT=7054; NAME="banka" ;;
    bankB) PORT=8054; NAME="bankb" ;;
    regulator) PORT=9054; NAME="regulator" ;;
  esac

  cat > $BASE/organizations/$ORG/msp/config.yaml <<EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-${PORT}-ca-${NAME}-com.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-${PORT}-ca-${NAME}-com.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-${PORT}-ca-${NAME}-com.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-${PORT}-ca-${NAME}-com.pem
    OrganizationalUnitIdentifier: orderer
EOF

  cp $BASE/organizations/$ORG/msp/config.yaml \
     $BASE/organizations/$ORG/peers/peer0.$NAME.com/msp/config.yaml
  cp $BASE/organizations/$ORG/msp/config.yaml \
     $BASE/organizations/$ORG/orderers/orderer.$NAME.com/msp/config.yaml
  cp $BASE/organizations/$ORG/msp/config.yaml \
     $BASE/organizations/$ORG/users/Admin@$NAME.com/msp/config.yaml 2>/dev/null || true
done

echo ""
echo "============================================"
echo " All orgs enrolled + TLS bundle ready"
echo " Safe to run configtxgen now"
echo "============================================"
