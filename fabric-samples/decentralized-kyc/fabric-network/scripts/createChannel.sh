#!/bin/bash
set -e

export PATH=$HOME/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=$HOME/fabric-samples/config

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$SCRIPT_DIR/.."
CHANNEL=kycchannel

echo "============================================"
echo " Channel setup: $CHANNEL"
echo "============================================"

setGlobals() {
  case $1 in
    BankA)
      export CORE_PEER_LOCALMSPID=BankAMSP
      export CORE_PEER_TLS_ROOTCERT_FILE=$BASE/organizations/bankA/peerOrg/peers/peer0.banka.com/tls/ca.crt
      export CORE_PEER_MSPCONFIGPATH=$BASE/organizations/bankA/peerOrg/users/Admin@banka.com/msp
      export CORE_PEER_ADDRESS=peer0.banka.com:7051
      ORDERER_ADMIN=orderer.banka.com:7053
      ORDERER_TLS=$BASE/organizations/bankA/ordererOrg/tlsca/tlsca.banka.com-cert.pem
      ORDERER_CERT=$BASE/organizations/bankA/ordererOrg/orderers/orderer.banka.com/tls/server.crt
      ORDERER_KEY=$BASE/organizations/bankA/ordererOrg/orderers/orderer.banka.com/tls/server.key
      ORDERER_ADDR=orderer.banka.com:7050
      ORDERER_HOST=orderer.banka.com
      ;;
    BankB)
      export CORE_PEER_LOCALMSPID=BankBMSP
      export CORE_PEER_TLS_ROOTCERT_FILE=$BASE/organizations/bankB/peerOrg/peers/peer0.bankb.com/tls/ca.crt
      export CORE_PEER_MSPCONFIGPATH=$BASE/organizations/bankB/peerOrg/users/Admin@bankb.com/msp
      export CORE_PEER_ADDRESS=peer0.bankb.com:8051
      ORDERER_ADMIN=orderer.bankb.com:8053
      ORDERER_TLS=$BASE/organizations/bankB/ordererOrg/tlsca/tlsca.bankb.com-cert.pem
      ORDERER_CERT=$BASE/organizations/bankB/ordererOrg/orderers/orderer.bankb.com/tls/server.crt
      ORDERER_KEY=$BASE/organizations/bankB/ordererOrg/orderers/orderer.bankb.com/tls/server.key
      ORDERER_ADDR=orderer.bankb.com:8050
      ORDERER_HOST=orderer.bankb.com
      ;;
    Regulator)
      export CORE_PEER_LOCALMSPID=RegulatorMSP
      export CORE_PEER_TLS_ROOTCERT_FILE=$BASE/organizations/regulator/peerOrg/peers/peer0.regulator.com/tls/ca.crt
      export CORE_PEER_MSPCONFIGPATH=$BASE/organizations/regulator/peerOrg/users/Admin@regulator.com/msp
      export CORE_PEER_ADDRESS=peer0.regulator.com:9051
      ORDERER_ADMIN=orderer.regulator.com:9053
      ORDERER_TLS=$BASE/organizations/regulator/ordererOrg/tlsca/tlsca.regulator.com-cert.pem
      ORDERER_CERT=$BASE/organizations/regulator/ordererOrg/orderers/orderer.regulator.com/tls/server.crt
      ORDERER_KEY=$BASE/organizations/regulator/ordererOrg/orderers/orderer.regulator.com/tls/server.key
      ORDERER_ADDR=orderer.regulator.com:9050
      ORDERER_HOST=orderer.regulator.com
      ;;
  esac
}

# ── Join orderers ─────────────────────────────────
echo ""
echo ">>> Joining orderers..."
for ORG in BankA BankB Regulator; do
  setGlobals $ORG
  echo "--- $ORG orderer ($ORDERER_ADMIN)..."

  RESULT=$(osnadmin channel join \
    --channelID $CHANNEL \
    --config-block $BASE/channel-artifacts/$CHANNEL.block \
    -o $ORDERER_ADMIN \
    --ca-file $ORDERER_TLS \
    --client-cert $ORDERER_CERT \
    --client-key $ORDERER_KEY 2>&1) || true

  echo "$RESULT"

  if echo "$RESULT" | grep -qE '"status".*"active"|201|already exists'; then
    echo ">>> $ORG orderer joined OK"
  else
    # Check if already joined
    LIST=$(osnadmin channel list \
      -o $ORDERER_ADMIN \
      --ca-file $ORDERER_TLS \
      --client-cert $ORDERER_CERT \
      --client-key $ORDERER_KEY 2>&1) || true
    if echo "$LIST" | grep -q "$CHANNEL"; then
      echo ">>> $ORG orderer already has $CHANNEL"
    else
      echo "ERROR: $ORG orderer failed"
      echo "$LIST"
      exit 1
    fi
  fi
done

sleep 5

# ── Join peers ────────────────────────────────────
echo ""
echo ">>> Joining peers..."
for ORG in BankA BankB Regulator; do
  setGlobals $ORG
  EXISTING=$(peer channel list 2>/dev/null | grep $CHANNEL || true)
  if [ -n "$EXISTING" ]; then
    echo ">>> $ORG peer already on $CHANNEL"
  else
    peer channel join \
      -b $BASE/channel-artifacts/$CHANNEL.block \
      --tls \
      --cafile $ORDERER_TLS
    echo ">>> $ORG peer joined"
  fi
done

# ── Anchor peers ──────────────────────────────────
echo ""
echo ">>> Setting anchor peers..."
for ORG in BankA BankB Regulator; do
  setGlobals $ORG
  case $ORG in
    BankA) TX=$BASE/channel-artifacts/BankAMSPanchors.tx ;;
    BankB) TX=$BASE/channel-artifacts/BankBMSPanchors.tx ;;
    Regulator) TX=$BASE/channel-artifacts/RegulatorMSPanchors.tx ;;
  esac
  peer channel update \
    -o $ORDERER_ADDR \
    --ordererTLSHostnameOverride $ORDERER_HOST \
    -c $CHANNEL \
    -f $TX \
    --tls \
    --cafile $ORDERER_TLS
  echo ">>> $ORG anchor peer set"
done

# ── Verify ────────────────────────────────────────
echo ""
echo "============================================"
echo " Verifying channel..."
echo "============================================"
setGlobals BankA
peer channel list
peer channel getinfo -c $CHANNEL

echo ""
echo "============================================"
echo " Network fully operational!"
echo "============================================"
