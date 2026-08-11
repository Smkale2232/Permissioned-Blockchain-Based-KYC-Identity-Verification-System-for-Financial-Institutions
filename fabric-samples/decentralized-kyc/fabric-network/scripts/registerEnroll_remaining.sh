#!/bin/bash

set -e

FABRIC_CA_CLIENT_HOME=${PWD}/../organizations
SCRIPT_DIR=${PWD}

echo ">>> [BankB] Enrolling CA Admin..."

export FABRIC_CA_CLIENT_HOME=${SCRIPT_DIR}/../organizations/bankB

fabric-ca-client enroll \
  -u https://admin:adminpw@localhost:8054 \
  --caname ca.bankb.com \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/bankB/ca/ca-cert.pem

echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-bankb-com.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-bankb-com.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-bankb-com.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-bankb-com.pem
    OrganizationalUnitIdentifier: orderer' \
> ${SCRIPT_DIR}/../organizations/bankB/msp/config.yaml

echo ">>> [BankB] Registering peer0..."
fabric-ca-client register \
  --caname ca.bankb.com \
  --id.name peer0.bankb.com \
  --id.secret peer0pw \
  --id.type peer \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/bankB/ca/ca-cert.pem

echo ">>> [BankB] Registering orderer..."
fabric-ca-client register \
  --caname ca.bankb.com \
  --id.name orderer.bankb.com \
  --id.secret ordererpw \
  --id.type orderer \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/bankB/ca/ca-cert.pem

echo ">>> [BankB] Registering org admin..."
fabric-ca-client register \
  --caname ca.bankb.com \
  --id.name bankBadmin \
  --id.secret bankBadminpw \
  --id.type admin \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/bankB/ca/ca-cert.pem

echo ">>> [BankB] Registering KYC officer..."
fabric-ca-client register \
  --caname ca.bankb.com \
  --id.name kycofficer.bankb \
  --id.secret kycofficerpw \
  --id.type client \
  --id.attrs "role=signer:ecert" \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/bankB/ca/ca-cert.pem

echo ">>> [BankB] Enrolling peer0..."
fabric-ca-client enroll \
  -u https://peer0.bankb.com:peer0pw@localhost:8054 \
  --caname ca.bankb.com \
  -M ${SCRIPT_DIR}/../organizations/bankB/peers/peer0.bankb.com/msp \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/bankB/ca/ca-cert.pem

cp ${SCRIPT_DIR}/../organizations/bankB/msp/config.yaml \
   ${SCRIPT_DIR}/../organizations/bankB/peers/peer0.bankb.com/msp/config.yaml

echo ">>> [BankB] Enrolling peer0 TLS..."
fabric-ca-client enroll \
  -u https://peer0.bankb.com:peer0pw@localhost:8054 \
  --caname ca.bankb.com \
  -M ${SCRIPT_DIR}/../organizations/bankB/peers/peer0.bankb.com/tls \
  --enrollment.profile tls \
  --csr.hosts peer0.bankb.com \
  --csr.hosts localhost \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/bankB/ca/ca-cert.pem

cp ${SCRIPT_DIR}/../organizations/bankB/peers/peer0.bankb.com/tls/signcerts/*.pem \
   ${SCRIPT_DIR}/../organizations/bankB/peers/peer0.bankb.com/tls/server.crt
cp ${SCRIPT_DIR}/../organizations/bankB/peers/peer0.bankb.com/tls/keystore/* \
   ${SCRIPT_DIR}/../organizations/bankB/peers/peer0.bankb.com/tls/server.key
cp ${SCRIPT_DIR}/../organizations/bankB/peers/peer0.bankb.com/tls/tlscacerts/*.pem \
   ${SCRIPT_DIR}/../organizations/bankB/peers/peer0.bankb.com/tls/ca.crt

echo ">>> [BankB] Enrolling orderer..."
fabric-ca-client enroll \
  -u https://orderer.bankb.com:ordererpw@localhost:8054 \
  --caname ca.bankb.com \
  -M ${SCRIPT_DIR}/../organizations/bankB/orderers/orderer.bankb.com/msp \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/bankB/ca/ca-cert.pem

cp ${SCRIPT_DIR}/../organizations/bankB/msp/config.yaml \
   ${SCRIPT_DIR}/../organizations/bankB/orderers/orderer.bankb.com/msp/config.yaml

echo ">>> [BankB] Enrolling orderer TLS..."
fabric-ca-client enroll \
  -u https://orderer.bankb.com:ordererpw@localhost:8054 \
  --caname ca.bankb.com \
  -M ${SCRIPT_DIR}/../organizations/bankB/orderers/orderer.bankb.com/tls \
  --enrollment.profile tls \
  --csr.hosts orderer.bankb.com \
  --csr.hosts localhost \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/bankB/ca/ca-cert.pem

cp ${SCRIPT_DIR}/../organizations/bankB/orderers/orderer.bankb.com/tls/signcerts/*.pem \
   ${SCRIPT_DIR}/../organizations/bankB/orderers/orderer.bankb.com/tls/server.crt
cp ${SCRIPT_DIR}/../organizations/bankB/orderers/orderer.bankb.com/tls/keystore/* \
   ${SCRIPT_DIR}/../organizations/bankB/orderers/orderer.bankb.com/tls/server.key
cp ${SCRIPT_DIR}/../organizations/bankB/orderers/orderer.bankb.com/tls/tlscacerts/*.pem \
   ${SCRIPT_DIR}/../organizations/bankB/orderers/orderer.bankb.com/tls/ca.crt

echo ">>> [BankB] Enrolling org admin..."
fabric-ca-client enroll \
  -u https://bankBadmin:bankBadminpw@localhost:8054 \
  --caname ca.bankb.com \
  -M ${SCRIPT_DIR}/../organizations/bankB/users/Admin@bankb.com/msp \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/bankB/ca/ca-cert.pem

cp ${SCRIPT_DIR}/../organizations/bankB/msp/config.yaml \
   ${SCRIPT_DIR}/../organizations/bankB/users/Admin@bankb.com/msp/config.yaml

echo ">>> BankB DONE"

# -------------------------------------------------------
# REGULATOR
# -------------------------------------------------------
echo ""
echo ">>> [Regulator] Enrolling CA Admin..."

export FABRIC_CA_CLIENT_HOME=${SCRIPT_DIR}/../organizations/regulator

fabric-ca-client enroll \
  -u https://admin:adminpw@localhost:9054 \
  --caname ca.regulator.com \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/regulator/ca/ca-cert.pem

echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-regulator-com.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-regulator-com.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-regulator-com.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-regulator-com.pem
    OrganizationalUnitIdentifier: orderer' \
> ${SCRIPT_DIR}/../organizations/regulator/msp/config.yaml

echo ">>> [Regulator] Registering peer0..."
fabric-ca-client register \
  --caname ca.regulator.com \
  --id.name peer0.regulator.com \
  --id.secret peer0pw \
  --id.type peer \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/regulator/ca/ca-cert.pem

echo ">>> [Regulator] Registering orderer..."
fabric-ca-client register \
  --caname ca.regulator.com \
  --id.name orderer.regulator.com \
  --id.secret ordererpw \
  --id.type orderer \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/regulator/ca/ca-cert.pem

echo ">>> [Regulator] Registering regulator admin..."
fabric-ca-client register \
  --caname ca.regulator.com \
  --id.name regulatoradmin \
  --id.secret regulatoradminpw \
  --id.type admin \
  --id.attrs "role=regulator:ecert" \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/regulator/ca/ca-cert.pem

echo ">>> [Regulator] Enrolling peer0..."
fabric-ca-client enroll \
  -u https://peer0.regulator.com:peer0pw@localhost:9054 \
  --caname ca.regulator.com \
  -M ${SCRIPT_DIR}/../organizations/regulator/peers/peer0.regulator.com/msp \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/regulator/ca/ca-cert.pem

cp ${SCRIPT_DIR}/../organizations/regulator/msp/config.yaml \
   ${SCRIPT_DIR}/../organizations/regulator/peers/peer0.regulator.com/msp/config.yaml

echo ">>> [Regulator] Enrolling peer0 TLS..."
fabric-ca-client enroll \
  -u https://peer0.regulator.com:peer0pw@localhost:9054 \
  --caname ca.regulator.com \
  -M ${SCRIPT_DIR}/../organizations/regulator/peers/peer0.regulator.com/tls \
  --enrollment.profile tls \
  --csr.hosts peer0.regulator.com \
  --csr.hosts localhost \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/regulator/ca/ca-cert.pem

cp ${SCRIPT_DIR}/../organizations/regulator/peers/peer0.regulator.com/tls/signcerts/*.pem \
   ${SCRIPT_DIR}/../organizations/regulator/peers/peer0.regulator.com/tls/server.crt
cp ${SCRIPT_DIR}/../organizations/regulator/peers/peer0.regulator.com/tls/keystore/* \
   ${SCRIPT_DIR}/../organizations/regulator/peers/peer0.regulator.com/tls/server.key
cp ${SCRIPT_DIR}/../organizations/regulator/peers/peer0.regulator.com/tls/tlscacerts/*.pem \
   ${SCRIPT_DIR}/../organizations/regulator/peers/peer0.regulator.com/tls/ca.crt

echo ">>> [Regulator] Enrolling orderer..."
fabric-ca-client enroll \
  -u https://orderer.regulator.com:ordererpw@localhost:9054 \
  --caname ca.regulator.com \
  -M ${SCRIPT_DIR}/../organizations/regulator/orderers/orderer.regulator.com/msp \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/regulator/ca/ca-cert.pem

cp ${SCRIPT_DIR}/../organizations/regulator/msp/config.yaml \
   ${SCRIPT_DIR}/../organizations/regulator/orderers/orderer.regulator.com/msp/config.yaml

echo ">>> [Regulator] Enrolling orderer TLS..."
fabric-ca-client enroll \
  -u https://orderer.regulator.com:ordererpw@localhost:9054 \
  --caname ca.regulator.com \
  -M ${SCRIPT_DIR}/../organizations/regulator/orderers/orderer.regulator.com/tls \
  --enrollment.profile tls \
  --csr.hosts orderer.regulator.com \
  --csr.hosts localhost \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/regulator/ca/ca-cert.pem

cp ${SCRIPT_DIR}/../organizations/regulator/orderers/orderer.regulator.com/tls/signcerts/*.pem \
   ${SCRIPT_DIR}/../organizations/regulator/orderers/orderer.regulator.com/tls/server.crt
cp ${SCRIPT_DIR}/../organizations/regulator/orderers/orderer.regulator.com/tls/keystore/* \
   ${SCRIPT_DIR}/../organizations/regulator/orderers/orderer.regulator.com/tls/server.key
cp ${SCRIPT_DIR}/../organizations/regulator/orderers/orderer.regulator.com/tls/tlscacerts/*.pem \
   ${SCRIPT_DIR}/../organizations/regulator/orderers/orderer.regulator.com/tls/ca.crt

echo ">>> [Regulator] Enrolling regulator admin..."
fabric-ca-client enroll \
  -u https://regulatoradmin:regulatoradminpw@localhost:9054 \
  --caname ca.regulator.com \
  -M ${SCRIPT_DIR}/../organizations/regulator/users/Admin@regulator.com/msp \
  --tls.certfiles ${SCRIPT_DIR}/../organizations/regulator/ca/ca-cert.pem

cp ${SCRIPT_DIR}/../organizations/regulator/msp/config.yaml \
   ${SCRIPT_DIR}/../organizations/regulator/users/Admin@regulator.com/msp/config.yaml

echo ""
echo "============================================"
echo " All organizations enrolled successfully"
echo "============================================"
