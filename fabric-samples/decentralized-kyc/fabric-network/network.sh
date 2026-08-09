#!/bin/bash
set -e

export PATH=$HOME/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=$HOME/fabric-samples/config
export CORE_PEER_TLS_ENABLED=true

BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHANNEL=kycchannel
CC_NAME=kyc-contract
CC_VERSION=8.0
CC_SEQUENCE=2
ORDERER_CA=$BASE/organizations/cryptogen/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt

setGlobals() {
  case $1 in
    BankA)
      export CORE_PEER_LOCALMSPID=BankAMSP
      export CORE_PEER_TLS_ROOTCERT_FILE=$BASE/organizations/cryptogen/peerOrganizations/banka.com/peers/peer0.banka.com/tls/ca.crt
      export CORE_PEER_MSPCONFIGPATH=$BASE/organizations/cryptogen/peerOrganizations/banka.com/users/Admin@banka.com/msp
      export CORE_PEER_ADDRESS=peer0.banka.com:7051
      ;;
    BankB)
      export CORE_PEER_LOCALMSPID=BankBMSP
      export CORE_PEER_TLS_ROOTCERT_FILE=$BASE/organizations/cryptogen/peerOrganizations/bankb.com/peers/peer0.bankb.com/tls/ca.crt
      export CORE_PEER_MSPCONFIGPATH=$BASE/organizations/cryptogen/peerOrganizations/bankb.com/users/Admin@bankb.com/msp
      export CORE_PEER_ADDRESS=peer0.bankb.com:8051
      ;;
    Regulator)
      export CORE_PEER_LOCALMSPID=RegulatorMSP
      export CORE_PEER_TLS_ROOTCERT_FILE=$BASE/organizations/cryptogen/peerOrganizations/regulator.com/peers/peer0.regulator.com/tls/ca.crt
      export CORE_PEER_MSPCONFIGPATH=$BASE/organizations/cryptogen/peerOrganizations/regulator.com/users/Admin@regulator.com/msp
      export CORE_PEER_ADDRESS=peer0.regulator.com:9051
      ;;
  esac
}

networkUp() {
  echo "============================================"
  echo " Starting KYC Network"
  echo "============================================"

  # Generate crypto if missing
  if [ ! -d "$BASE/organizations/cryptogen/peerOrganizations" ]; then
    echo ">>> Generating crypto materials..."
    cryptogen generate \
      --config=$BASE/crypto-config.yaml \
      --output=$BASE/organizations/cryptogen
  fi

  # Generate channel block if missing
  if [ ! -f "$BASE/channel-artifacts/kycchannel.block" ]; then
    echo ">>> Generating channel block..."
    mkdir -p $BASE/channel-artifacts
    configtxgen \
      -configPath "$BASE" \
      -profile KYCGenesis \
      -outputBlock $BASE/channel-artifacts/kycchannel.block \
      -channelID kycchannel
  fi

  # Start containers
  echo ">>> Starting Docker containers..."
  docker compose -f $BASE/docker-compose.yaml up -d
  sleep 12

  # Join orderer
  echo ">>> Joining orderer to channel..."
  ORDERER_CERT=$BASE/organizations/cryptogen/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
  ORDERER_KEY=$BASE/organizations/cryptogen/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key

  osnadmin channel join \
    --channelID $CHANNEL \
    --config-block $BASE/channel-artifacts/kycchannel.block \
    -o orderer.example.com:7053 \
    --ca-file $ORDERER_CA \
    --client-cert $ORDERER_CERT \
    --client-key $ORDERER_KEY 2>&1 | grep -E "status|error|already" | head -2

  sleep 3

  # Join peers
  echo ">>> Joining peers to channel..."
  for ORG in BankA BankB Regulator; do
    setGlobals $ORG
    peer channel join \
      -b $BASE/channel-artifacts/kycchannel.block \
      --tls --cafile $ORDERER_CA 2>&1 | grep -E "Successfully|Error" | head -1
    echo "  $ORG peer joined"
  done

  # Deploy chaincode
  echo ""
  echo ">>> Deploying chaincode..."

  # Package
  if [ ! -f "$BASE/kyc-contract.tar.gz" ]; then
    peer lifecycle chaincode package $BASE/kyc-contract.tar.gz \
      --path $BASE/chaincode/kyc-contract \
      --lang node \
      --label kyc-contract_$CC_VERSION
  fi

  PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid $BASE/kyc-contract.tar.gz)

  # Install on all peers
  for ORG in BankA BankB Regulator; do
    setGlobals $ORG
    peer lifecycle chaincode install $BASE/kyc-contract.tar.gz 2>&1 | grep -E "Installed|already" | head -1
    echo "  $ORG: installed"
  done

  # Approve for all orgs
  for ORG in BankA BankB Regulator; do
    setGlobals $ORG
    peer lifecycle chaincode approveformyorg \
      -o orderer.example.com:7050 \
      --ordererTLSHostnameOverride orderer.example.com \
      --channelID $CHANNEL \
      --name $CC_NAME \
      --version $CC_VERSION \
      --package-id $PACKAGE_ID \
      --sequence $CC_SEQUENCE \
      --waitForEvent=false \
      --tls --cafile $ORDERER_CA 2>&1 | grep -E "Error" | head -1
    echo "  $ORG: approved"
  done

  sleep 5

  # Commit
  setGlobals BankA
  peer lifecycle chaincode commit \
    -o orderer.example.com:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --channelID $CHANNEL \
    --name $CC_NAME \
    --version $CC_VERSION \
    --sequence $CC_SEQUENCE \
    --tls --cafile $ORDERER_CA \
    --peerAddresses peer0.banka.com:7051 \
    --tlsRootCertFiles $BASE/organizations/cryptogen/peerOrganizations/banka.com/peers/peer0.banka.com/tls/ca.crt \
    --peerAddresses peer0.bankb.com:8051 \
    --tlsRootCertFiles $BASE/organizations/cryptogen/peerOrganizations/bankb.com/peers/peer0.bankb.com/tls/ca.crt \
    --peerAddresses peer0.regulator.com:9051 \
    --tlsRootCertFiles $BASE/organizations/cryptogen/peerOrganizations/regulator.com/peers/peer0.regulator.com/tls/ca.crt

  echo ""
  echo "============================================"
  echo " Network is UP and chaincode is deployed"
  echo " Channel: $CHANNEL"
  echo " Chaincode: $CC_NAME v$CC_VERSION"
  echo "============================================"
}

networkDown() {
  echo ">>> Stopping network..."
  docker compose -f $BASE/docker-compose.yaml down -v
  echo ">>> Network stopped and volumes removed"
}

networkReset() {
  networkDown
  echo ">>> Wiping crypto materials and artifacts..."
  sudo rm -rf $BASE/organizations/cryptogen \
              $BASE/channel-artifacts/* \
              $BASE/kyc-contract.tar.gz
  echo ">>> Reset complete. Run './network.sh up' to start fresh."
}

networkStatus() {
  echo "=== Container Status ==="
  docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "orderer|peer|ca" || echo "No containers running"

  echo ""
  echo "=== Channel Info ==="
  setGlobals BankA
  peer channel list 2>/dev/null || echo "Cannot reach peer"
  peer channel getinfo -c $CHANNEL --tls --cafile $ORDERER_CA 2>/dev/null | grep -o '"height":[0-9]*' || true

  echo ""
  echo "=== Chaincode Status ==="
  peer lifecycle chaincode querycommitted \
    --channelID $CHANNEL \
    --tls --cafile $ORDERER_CA 2>/dev/null || echo "No chaincode committed"
}

case $1 in
  up)     networkUp ;;
  down)   networkDown ;;
  reset)  networkReset ;;
  status) networkStatus ;;
  *)
    echo "Usage: ./network.sh [up|down|reset|status]"
    echo "  up     — start network + deploy chaincode"
    echo "  down   — stop network and remove volumes"
    echo "  reset  — full wipe and clean state"
    echo "  status — show current network status"
    ;;
esac
