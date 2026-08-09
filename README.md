# Permissioned-Blockchain-Based-KYC-Identity-Verification-System-for-Financial-Institutions

A decentralized KYC (Know Your Customer) and identity-verification platform for financial institutions, built using **Hyperledger Fabric**, **Node.js/Express**, **MongoDB**, and **React**.

> **C-DAC PGCP-FBD End Project — 2026**  
> Team: Sachin · Payal · Tejaswa · Himanshu

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Problem Statement](#2-problem-statement)
- [3. Solution](#3-solution)
- [4. Key Features](#4-key-features)
- [5. System Architecture](#5-system-architecture)
- [6. Technology Stack](#6-technology-stack)
- [7. Project Workflow](#7-project-workflow)
- [8. Repository Structure](#8-repository-structure)
- [9. Hyperledger Fabric Network](#9-hyperledger-fabric-network)
- [10. Prerequisites](#10-prerequisites)
- [11. Clone / Enter the Project](#11-clone--enter-the-project)
- [12. Host Configuration](#12-host-configuration)
- [13. Start the Fabric Network](#13-start-the-fabric-network)
- [14. Create and Join the Channel](#14-create-and-join-the-channel)
- [15. Deploy the Chaincode](#15-deploy-the-chaincode)
- [16. Start MongoDB](#16-start-mongodb)
- [17. Configure and Start the Backend](#17-configure-and-start-the-backend)
- [18. Start the Frontend Applications](#18-start-the-frontend-applications)
- [19. First-Time Application Setup](#19-first-time-application-setup)
- [20. End-to-End Testing](#20-end-to-end-testing)
- [21. Important Fabric Environment Variables](#21-important-fabric-environment-variables)
- [22. Network Management Commands](#22-network-management-commands)
- [23. Verification and Health Checks](#23-verification-and-health-checks)
- [24. API Overview](#24-api-overview)
- [25. Roles and Permissions](#25-roles-and-permissions)
- [26. On-Chain vs Off-Chain Data](#26-on-chain-vs-off-chain-data)
- [27. Security Model](#27-security-model)
- [28. Troubleshooting](#28-troubleshooting)
- [29. Current Limitations](#29-current-limitations)
- [30. Future Enhancements](#30-future-enhancements)
- [31. Team Responsibilities](#31-team-responsibilities)

---

# 1. Project Overview

This project implements a **permissioned, blockchain-based KYC platform** in which participating financial institutions can trust KYC verification performed by another participating institution without requiring the customer to repeatedly submit the same documents.

The system has three primary roles:

| Role | Description |
|---|---|
| `user` | Customer who registers and uploads KYC documents |
| `signer` | KYC officer who reviews, approves, rejects documents, and issues credentials |
| `regulator` | Regulatory authority with cross-organization visibility and audit capabilities |

The project uses Hyperledger Fabric as the trust and audit layer. Actual KYC files remain off-chain; the blockchain stores cryptographic hashes, document state, credential claims, revocations, and audit information.

---

# 2. Problem Statement

Traditional KYC requires customers to submit the same identity documents to multiple banks or financial institutions.

This creates:

- Duplicate verification work
- Longer customer onboarding times
- Repeated handling of sensitive personal information
- Increased data-storage and breach exposure
- Fragmented audit trails
- Difficulty establishing trust between independent institutions

The project addresses this by creating a **shared, permissioned blockchain network** in which authorized organizations can verify cryptographic proof of KYC activity.

---

# 3. Solution

The core workflow is:

```text
Customer
   |
   | Register + upload KYC document
   v
Backend
   |
   | SHA-256 hash
   +-----------------------> MongoDB
   |                           |
   |                           +-- Actual file
   |                           +-- User/document metadata
   |
   +-----------------------> Hyperledger Fabric
                               |
                               +-- Document hash
                               +-- Document state
                               +-- Signer information
                               +-- Transaction/audit information
                                      |
                                      v
                                KYC Officer
                                      |
                         Approve / Reject document
                                      |
                                      v
                             Verifiable Credential
                                      |
                                      v
                              BankB / Other Bank
                                      |
                               Verify credential
                                      |
                                      v
                             No document resubmission
```

The blockchain provides the shared trust layer while MongoDB and local file storage handle application data and documents.

---

# 4. Key Features

### Customer

- Registration and login
- Upload KYC documents
- SHA-256 file hashing
- View submitted document status
- View issued verifiable credentials
- Share a credential/verification identifier

### KYC Officer / Signer

- View pending KYC submissions
- Preview/download documents
- Approve documents
- Reject documents with remarks/reasons
- PIN-protected sensitive operations
- Issue verifiable credentials
- View document history

### Regulator

- View documents across participating organizations
- View statistics
- View immutable audit trail
- Inspect transaction IDs
- Manage/revoke credentials or certificates
- Monitor system alerts

### Blockchain

- Permissioned membership
- X.509 identity
- TLS-secured communication
- Raft ordering
- Channel isolation
- Chaincode-level role enforcement
- Immutable document state and audit records

---

# 5. System Architecture

The system is divided into three main application layers.

```text
+-------------------------------------------------------------------+
|                         FRONTEND LAYER                            |
|                                                                   |
|  signer-frontend :5173          regulator-dashboard :5174         |
|  ---------------------          -------------------------         |
|  User Dashboard                 Regulator Dashboard               |
|  Signer Dashboard               Documents / Audit / Analytics     |
|  Upload / Review / Credential   Certificate / Alert Management   |
+-------------------------------+-----------------------------------+
                                |
                                | HTTP / REST
                                v
+-------------------------------------------------------------------+
|                         BACKEND LAYER                             |
|                         Node.js / Express                         |
|                             :5000                                 |
|                                                                   |
|  Authentication | JWT | Role Middleware | PIN | Upload | Rate    |
|  Limiting | Validation | Fabric Integration | PKI | Credentials  |
+-------------------------------+-----------------------------------+
                |                                      |
                v                                      v
+---------------------------+          +-----------------------------+
|         MongoDB           |          |     Hyperledger Fabric      |
|          :27017           |          |                             |
|                           |          | Channel: kycchannel        |
| Users                     |          | 3 Organizations             |
| Documents                 |          | 3 Peers                     |
| Audit Logs                |          | 3 Raft Orderers             |
| Sessions / Keys           |          | 3 Fabric CAs                |
+---------------------------+          | TypeScript Chaincode        |
                                       +-----------------------------+
```

---

# 6. Technology Stack

| Layer | Technology |
|---|---|
| Blockchain | Hyperledger Fabric 2.5.x |
| Consensus | Raft / etcdraft |
| Smart Contract | TypeScript |
| Blockchain SDK | `fabric-network` |
| Identity | X.509 / MSP |
| Certificate Authority | Fabric CA |
| Backend | Node.js + Express |
| Database | MongoDB 7.x |
| Frontend | React + MUI |
| Authentication | JWT |
| Password Hashing | bcrypt |
| File Hashing | SHA-256 |
| Credential Signing | RSA + `node-forge` |
| Containers | Docker + Docker Compose |
| API Documentation | Swagger |

---

# 7. Project Workflow

## 7.1 Customer Registration

```text
Customer
   |
   +--> POST /api/auth/register
   |
   +--> User stored in MongoDB
   |
   +--> Fabric identity/PKI setup
   |
   +--> RSA key pair generated for credential operations
   |
   +--> JWT returned
```

## 7.2 Document Upload

```text
Customer selects document
        |
        v
Backend validates file
        |
        v
SHA-256 hash calculated
        |
        +------------------> Actual file stored off-chain
        |
        +------------------> Hash written to Fabric
                                  |
                                  v
                              PENDING
```

## 7.3 KYC Review

```text
Signer logs in
     |
     v
Pending documents
     |
     v
Review actual file
     |
     +---------> Reject
     |
     +---------> Approve
```

## 7.4 Approval and Credential Issuance

```text
Signer approves document
        |
        v
Chaincode updates document
status = approved
        |
        v
Credential issued
        |
        +--> Claims written on-chain
        |
        +--> RSA-signed credential stored by application
```

## 7.5 Cross-Bank Verification

```text
Customer gives credential ID
             |
             v
          BankB
             |
             v
VerifyCredential()
             |
             v
Check:
- existence
- status
- expiry
- issuer
- claims
             |
             v
        KYC trusted
```

---

# 8. Repository Structure

The project root is:

```text
~/fabric-samples/decentralized-kyc/
```

Recommended structure:

```text
decentralized-kyc/
│
├── fabric-network/
│   ├── chaincode/
│   │   └── kyc-contract/
│   │       ├── src/
│   │       │   ├── index.ts
│   │       │   └── kycContract.ts
│   │       ├── dist/
│   │       ├── package.json
│   │       └── tsconfig.json
│   │
│   ├── channel-artifacts/
│   │   └── kycchannel.block
│   │
│   ├── organizations/
│   │   ├── bankA/
│   │   ├── bankB/
│   │   ├── regulator/
│   │   └── tls-ca/
│   │
│   ├── scripts/
│   │   └── createChannel.sh
│   │
│   ├── configtx.yaml
│   ├── docker-compose.yaml
│   └── docker-compose-ca.yaml
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── wallet/
│   ├── scripts/
│   │   └── setupWallet.js
│   └── src/
│       ├── app.js
│       ├── config/
│       ├── controllers/
│       ├── services/
│       ├── models/
│       ├── routes/
│       ├── middleware/
│       └── utils/
│
├── signer-frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       └── api/
│
└── regulator-dashboard/
    └── src/
        ├── pages/
        ├── components/
        └── api/
```

### Important directories

| Directory | Purpose |
|---|---|
| `fabric-network/chaincode` | Smart contract source |
| `fabric-network/organizations` | Fabric MSP, peer, orderer and TLS identities |
| `fabric-network/scripts` | Channel/network automation |
| `backend/src/services` | Fabric, PKI, JWT, crypto and credential logic |
| `backend/src/controllers` | REST request handlers |
| `backend/src/models` | MongoDB models |
| `signer-frontend` | User + signer React application |
| `regulator-dashboard` | Regulator React application |

---

# 9. Hyperledger Fabric Network

The current working Fabric configuration contains:

```text
3 Organizations
3 Peers
3 Raft Orderers
3 Fabric CAs
TLS enabled
Channel Participation API
No system channel
Application channel: kycchannel
```

## Organizations

### BankA

```text
MSP ID:        BankAMSP
Peer:          peer0.banka.com
Peer endpoint: localhost:7051

Orderer:       orderer.banka.com
Orderer:       localhost:7050
Admin API:     localhost:7053
```

### BankB

```text
MSP ID:        BankBMSP
Peer:          peer0.bankb.com
Peer endpoint: localhost:8051

Orderer:       orderer.bankb.com
Orderer:       localhost:8050
Admin API:     localhost:8053
```

### Regulator

```text
MSP ID:        RegulatorMSP
Peer:          peer0.regulator.com
Peer endpoint: localhost:9051

Orderer:       orderer.regulator.com
Orderer:       localhost:9050
Admin API:     localhost:9053
```

## Channel

```text
Channel:       kycchannel
Block:         fabric-network/channel-artifacts/kycchannel.block
```

Raft consenters:

```text
orderer.banka.com:7050
orderer.bankb.com:8050
orderer.regulator.com:9050
```

---

# 10. Prerequisites

The project is intended to run locally on Linux/WSL with Docker.

## Required software

### Docker

```bash
docker --version
docker compose version
```

Recommended baseline:

```text
Docker 20.x+
Docker Compose 2.x+
```

### Node.js

```bash
node --version
npm --version
```

Node.js 18+ is required by the documented backend stack.

### Hyperledger Fabric binaries

The project requires Fabric CLI tools such as:

```text
peer
osnadmin
configtxgen
cryptogen
```

Verify:

```bash
peer version
osnadmin version
configtxgen --version
```

If the Fabric binaries are installed under `~/fabric-samples/bin`:

```bash
export PATH=$PATH:$HOME/fabric-samples/bin
```

### Fabric configuration

For `peer` commands:

```bash
export FABRIC_CFG_PATH=$HOME/fabric-samples/config
```

Verify:

```bash
ls -l $HOME/fabric-samples/config/core.yaml
```

---

# 11. Clone / Enter the Project

If the project already exists under `fabric-samples`:

```bash
cd ~/fabric-samples/decentralized-kyc
```

For the Fabric network:

```bash
cd ~/fabric-samples/decentralized-kyc/fabric-network
```

Set Fabric environment:

```bash
export PATH=$PATH:$HOME/fabric-samples/bin
export FABRIC_CFG_PATH=$HOME/fabric-samples/config
```

---

# 12. Host Configuration

The Fabric certificates and Docker configuration use the following hostnames:

```text
peer0.banka.com
peer0.bankb.com
peer0.regulator.com
orderer.banka.com
orderer.bankb.com
orderer.regulator.com
```

On WSL/Linux, add them to `/etc/hosts`:

```bash
echo "127.0.0.1 peer0.banka.com peer0.bankb.com peer0.regulator.com orderer.banka.com orderer.bankb.com orderer.regulator.com" \
  | sudo tee -a /etc/hosts
```

Verify:

```bash
getent hosts peer0.banka.com
getent hosts peer0.bankb.com
getent hosts peer0.regulator.com
getent hosts orderer.banka.com
```

If these entries disappear after a WSL restart, add them again.

---

# 13. Start the Fabric Network

Go to the Fabric directory:

```bash
cd ~/fabric-samples/decentralized-kyc/fabric-network
```

Set configuration:

```bash
export FABRIC_CFG_PATH=$HOME/fabric-samples/config
```

Start Docker services:

```bash
docker compose -p kyc-network up -d
```

Check containers:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Expected services include:

```text
orderer.banka.com
orderer.bankb.com
orderer.regulator.com

peer0.banka.com
peer0.bankb.com
peer0.regulator.com

ca.banka.com
ca.bankb.com
ca.regulator.com
```

Check logs:

```bash
docker logs orderer.banka.com --tail 50
docker logs orderer.bankb.com --tail 50
docker logs orderer.regulator.com --tail 50

docker logs peer0.banka.com --tail 50
docker logs peer0.bankb.com --tail 50
docker logs peer0.regulator.com --tail 50
```

Healthy orderers should show messages indicating TLS is enabled, cluster setup has started, and the orderer is serving requests.

---

# 14. Create and Join the Channel

The channel-management script is:

```text
fabric-network/scripts/createChannel.sh
```

Make it executable:

```bash
chmod +x scripts/createChannel.sh
```

Validate shell syntax:

```bash
bash -n scripts/createChannel.sh
```

Run:

```bash
./scripts/createChannel.sh
```

The script performs:

1. Join BankA orderer to `kycchannel`
2. Join BankB orderer to `kycchannel`
3. Join Regulator orderer to `kycchannel`
4. Join BankA peer
5. Join BankB peer
6. Join Regulator peer
7. Update BankA anchor peer
8. Update BankB anchor peer
9. Update Regulator anchor peer

The script should calculate its project root from its own location rather than relying on the caller's current directory.

Recommended pattern:

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$(cd "$SCRIPT_DIR/.." && pwd)"
```

---

# 15. Deploy the Chaincode

The smart contract is located at:

```text
fabric-network/chaincode/kyc-contract/
```

The main files are:

```text
src/index.ts
src/kycContract.ts
package.json
tsconfig.json
```

The chaincode implements the KYC business logic, including:

```text
CreateDocument
SignDocument
IssueCredential
VerifyCredential
GetDocument
GetDocumentHistory
GetAllDocuments
GetStatistics
GetAuditTrail
RevokeCredential
InitLedger
```

If your `network.sh` or deployment automation already packages and deploys the chaincode, use the project's network script.

Typical package/build operations from the chaincode directory are:

```bash
cd ~/fabric-samples/decentralized-kyc/fabric-network/chaincode/kyc-contract

npm install
npm run build
```

Then use the project's Fabric deployment script/command for packaging, installation, approval, commit, and initialization.

> **Important:** The exact chaincode lifecycle command is not fully specified in the supplied project documentation. Do not substitute an unrelated Fabric sample deployment script without checking the project's current `network.sh`/deployment scripts.

After deployment, verify that the chaincode is committed to:

```text
kycchannel
```

with the expected chaincode name:

```text
kyc-contract
```

---

# 16. Start MongoDB

The backend uses MongoDB on port `27017`.

A simple local Docker deployment is:

```bash
docker run -d \
  -p 27017:27017 \
  --name docchain-mongo \
  mongo:7
```

Check:

```bash
docker ps --filter name=docchain-mongo
```

If the container already exists:

```bash
docker start docchain-mongo
```

MongoDB is used for application data such as:

- Users
- Document metadata
- Actual document file references
- RSA credential material
- Application audit logs
- Sessions / related application state

The Fabric ledger remains the authoritative shared trust and audit layer.

---

# 17. Configure and Start the Backend

Go to:

```bash
cd ~/fabric-samples/decentralized-kyc/backend
```

Install dependencies:

```bash
npm install
```

The backend entry point is:

```text
server.js
```

The Express application is configured through:

```text
src/app.js
```

## Environment configuration

Create/configure:

```text
backend/.env
```

The exact environment variables depend on the current backend implementation. At minimum, configure the MongoDB connection, JWT configuration, Fabric network/channel/chaincode settings, and application ports expected by the source code.

Do not commit production secrets, passwords, private keys, or populated `.env` files to Git.

## Import Fabric identities

Run:

```bash
node scripts/setupWallet.js
```

The wallet contains identities used by the backend to interact with Fabric.

Documented identity labels include:

```text
bankA-admin
bankB-admin
regulator-admin
bankA-user1
```

## Seed regulator account

Run:

```bash
npm run seed
```

The documented default development regulator account is:

```text
Email:    regulator@docchain.local
Password: Regulator@123
```

Change default credentials after first login in any non-demo environment.

## Start backend

Development:

```bash
npm run dev
```

Expected API address:

```text
http://localhost:5000
```

---

# 18. Start the Frontend Applications

## 18.1 User / Signer Frontend

Open another terminal:

```bash
cd ~/fabric-samples/decentralized-kyc/signer-frontend
```

Install:

```bash
npm install
```

Start:

```bash
npm run dev
```

Expected address:

```text
http://localhost:5173
```

This application serves:

- Customer registration/login
- User dashboard
- Document upload
- Document status
- Signer dashboard
- Pending document review
- Credential viewing
- Document history
- Verification

---

## 18.2 Regulator Dashboard

Open another terminal:

```bash
cd ~/fabric-samples/decentralized-kyc/regulator-dashboard
```

Install:

```bash
npm install
```

Start:

```bash
npm run dev
```

Expected address:

```text
http://localhost:5174
```

The regulator application provides:

- Overview
- All documents
- Audit trail
- Analytics
- Certificate management
- Alerts
- Credential verification

---

# 19. First-Time Application Setup

Once all services are running:

```text
Fabric network       → running
MongoDB              → running
Backend              → :5000
Signer frontend      → :5173
Regulator dashboard  → :5174
```

## Create a customer

Open:

```text
http://localhost:5173
```

Register with:

```text
role = user
```

## Create a signer

Register through the same frontend with:

```text
role = signer
```

The signer should have permission to review and approve/reject documents according to the application's role middleware and Fabric identity configuration.

## Regulator

Use the seeded development account:

```text
regulator@docchain.local
Regulator@123
```

---

# 20. End-to-End Testing

The following sequence demonstrates the complete project.

## Step 1 — Customer registration

```text
Frontend
  |
  +--> POST /api/auth/register
  |
  +--> MongoDB user created
  |
  +--> JWT returned
```

## Step 2 — Upload KYC document

Select a supported document such as:

```text
PAN card
Aadhaar-related document
Passport
Address proof
```

The application validates the file and calculates:

```text
SHA-256(file bytes)
```

The resulting 64-character hexadecimal hash is stored on the Fabric ledger.

The actual file remains off-chain.

## Step 3 — Confirm ledger state

The document should initially have:

```text
status = pending
```

The ledger contains the document ID, owner information, document type/title, SHA-256 hash, timestamps and related metadata.

## Step 4 — Signer review

Log in as the signer.

Open the pending documents list.

The signer reviews the actual document and chooses:

```text
Approve
```

or:

```text
Reject
```

A PIN is required for sensitive operations.

## Step 5 — Approval

On approval:

```text
pending
   ↓
approved
```

The blockchain records:

- Signer identity
- Organization
- Approval action
- Remarks
- Fabric transaction ID
- Audit entry

A verifiable credential is then issued.

## Step 6 — Verify credential

Use the credential ID through the verification endpoint or frontend.

The system checks:

```text
Credential exists
AND
status = active
AND
current time < expiry
```

A valid credential can be trusted across participating organizations without requiring the original KYC document to be resubmitted.

## Step 7 — Regulator audit

Log into:

```text
http://localhost:5174
```

Confirm:

- Document statistics
- Cross-organization documents
- Audit entries
- Fabric transaction IDs
- Credential information
- Alerts

---

# 21. Important Fabric Environment Variables

Before executing `peer` commands, set:

```bash
export FABRIC_CFG_PATH=$HOME/fabric-samples/config
```

## BankA

```bash
export CORE_PEER_LOCALMSPID=BankAMSP
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=$HOME/fabric-samples/decentralized-kyc/fabric-network/organizations/bankA/peers/peer0.banka.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$HOME/fabric-samples/decentralized-kyc/fabric-network/organizations/bankA/users/Admin@banka.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```

## BankB

```bash
export CORE_PEER_LOCALMSPID=BankBMSP
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=$HOME/fabric-samples/decentralized-kyc/fabric-network/organizations/bankB/peers/peer0.bankb.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$HOME/fabric-samples/decentralized-kyc/fabric-network/organizations/bankB/users/Admin@bankb.com/msp
export CORE_PEER_ADDRESS=localhost:8051
```

## Regulator

```bash
export CORE_PEER_LOCALMSPID=RegulatorMSP
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_ROOTCERT_FILE=$HOME/fabric-samples/decentralized-kyc/fabric-network/organizations/regulator/peers/peer0.regulator.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$HOME/fabric-samples/decentralized-kyc/fabric-network/organizations/regulator/users/Admin@regulator.com/msp
export CORE_PEER_ADDRESS=localhost:9051
```

For scripts, prefer calculating:

```bash
BASE="$(cd "$SCRIPT_DIR/.." && pwd)"
```

instead of hard-coding paths or assuming the caller's current directory.

---

# 22. Network Management Commands

## Start

```bash
cd ~/fabric-samples/decentralized-kyc/fabric-network
export FABRIC_CFG_PATH=$HOME/fabric-samples/config

docker compose -p kyc-network up -d
```

## Stop

```bash
docker compose -p kyc-network down
```

## View running containers

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## View orderer logs

```bash
docker logs orderer.banka.com --tail 50
docker logs orderer.bankb.com --tail 50
docker logs orderer.regulator.com --tail 50
```

## View peer logs

```bash
docker logs peer0.banka.com --tail 50
docker logs peer0.bankb.com --tail 50
docker logs peer0.regulator.com --tail 50
```

## Restart MongoDB

```bash
docker start docchain-mongo
```

## Stop MongoDB

```bash
docker stop docchain-mongo
```

---

# 23. Verification and Health Checks

## Check Fabric containers

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

All required services should be running.

## Check channel block

```bash
ls -lh channel-artifacts/kycchannel.block
```

Inspect:

```bash
configtxgen \
  -inspectBlock ./channel-artifacts/kycchannel.block \
  > /tmp/kycchannel.json
```

Check the three Raft consenters:

```bash
grep -n "orderer.banka.com" /tmp/kycchannel.json
grep -n "orderer.bankb.com" /tmp/kycchannel.json
grep -n "orderer.regulator.com" /tmp/kycchannel.json
```

## Check TLS CA bundle

Shared bundle:

```text
organizations/tls-ca/all-tls-ca.crt
```

Expected certificate count in each orderer's CA file:

```bash
grep -c "BEGIN CERTIFICATE" \
  organizations/bankA/orderers/orderer.banka.com/tls/ca.crt

grep -c "BEGIN CERTIFICATE" \
  organizations/bankB/orderers/orderer.bankb.com/tls/ca.crt

grep -c "BEGIN CERTIFICATE" \
  organizations/regulator/orderers/orderer.regulator.com/tls/ca.crt
```

Expected:

```text
3
3
3
```

## Verify orderer TLS certificates

```bash
openssl verify \
  -CAfile organizations/tls-ca/all-tls-ca.crt \
  organizations/bankA/orderers/orderer.banka.com/tls/server.crt

openssl verify \
  -CAfile organizations/tls-ca/all-tls-ca.crt \
  organizations/bankB/orderers/orderer.bankb.com/tls/server.crt

openssl verify \
  -CAfile organizations/tls-ca/all-tls-ca.crt \
  organizations/regulator/orderers/orderer.regulator.com/tls/server.crt
```

Expected:

```text
OK
```

If TLS certificates are regenerated, the certificates embedded in the channel block must correspond to the currently deployed certificates. Regenerate the channel block when required.

## Check peer channel membership

After configuring a peer identity:

```bash
peer channel list
```

Expected:

```text
kycchannel
```

---

# 24. API Overview

The backend runs on:

```text
http://localhost:5000
```

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-pin
```

## Documents

```http
POST /api/documents/upload
GET  /api/documents
GET  /api/documents/pending

POST /api/documents/:docId/sign
POST /api/documents/:docId/reject

GET  /api/documents/:docId/history
```

## Verification

```http
GET /api/verify/:credentialId
GET /api/verify/document/:docId
```

The credential verification endpoint is documented as public so another bank can verify a credential without first creating an application session.

## Regulator

```http
GET  /api/regulator/documents
GET  /api/regulator/statistics
GET  /api/regulator/audit-trail
GET  /api/regulator/alerts

POST /api/regulator/revoke-cert
```

## PKI

```http
GET  /api/pki/certificate/:userId
POST /api/pki/verify
```

---

# 25. Roles and Permissions

| Operation | User | Signer | Regulator |
|---|:---:|:---:|:---:|
| Register/login | Yes | Yes | Seeded |
| Upload document | Yes | Yes* | No |
| View own documents | Yes | Yes | Yes |
| View pending documents | No | Yes | Yes |
| Approve document | No | Yes | No |
| Reject document | No | Yes | No |
| Issue credential | No | Yes | No |
| Verify credential | Yes | Yes | Yes |
| View document history | No | Yes | Yes |
| View all documents | No | No | Yes |
| View statistics | No | No | Yes |
| View audit trail | No | No | Yes |
| Revoke credential | No | No | Yes |

\* Subject to the current backend role implementation.

Access is enforced at two levels:

1. Express/JWT middleware
2. Fabric chaincode

The chaincode is the final authority for blockchain operations.

---

# 26. On-Chain vs Off-Chain Data

## On-chain

The Fabric ledger stores data that needs shared integrity and verifiability:

| Data | Purpose |
|---|---|
| Document hash | Detect document tampering |
| Document status | Shared approval/rejection state |
| Signer identity | Non-repudiable decision record |
| Transaction IDs | Traceability |
| Credential claims | Cross-bank verification |
| Credential status | Active/revoked state |
| Audit entries | Immutable audit history |

## Off-chain

MongoDB/local storage contains:

| Data | Reason |
|---|---|
| User profiles | PII and application querying |
| Password hashes | Authentication |
| Actual documents | Large and sensitive |
| RSA key material | Private cryptographic material |
| Sessions/application state | High-churn application data |
| Supplementary application logs | Operational logging |

### Why only the hash is stored on-chain

A SHA-256 hash provides a deterministic fingerprint:

```text
Original document
      |
      v
   SHA-256
      |
      v
64 hexadecimal characters
```

If even one byte changes:

```text
SHA-256(original) != SHA-256(modified)
```

Therefore, the ledger hash can be used to detect tampering without storing the raw document on the shared blockchain.

---

# 27. Security Model

## Authentication

- JWT-based authentication
- bcrypt password hashing
- JWT expiry
- Separate PIN for sensitive operations
- Rate limiting on authentication endpoints

## File security

- File-size restrictions
- File-type validation using magic bytes
- Files stored outside the public web root
- SHA-256 integrity hashing

## Blockchain security

- X.509 identities
- MSP-based organization membership
- TLS communication
- Transaction signatures
- Chaincode-level authorization
- Immutable ledger history

## Credential security

The system uses two cryptographic layers:

### Fabric layer

The credential is written through a Fabric identity and receives a permanent transaction record.

### RSA layer

The application credential service uses RSA signing to create a digital proof associated with the credential.

---

# 28. Troubleshooting

## 28.1 `Config File "core" Not Found`

Set:

```bash
export FABRIC_CFG_PATH=$HOME/fabric-samples/config
```

Verify:

```bash
ls $HOME/fabric-samples/config/core.yaml
```

Important distinction:

```text
peer       -> $HOME/fabric-samples/config/core.yaml
configtxgen -> project configtx.yaml
```

Do not point `peer` at the project directory unless a suitable `core.yaml` exists there.

---

## 28.2 Wrong `../organizations` path

From the Fabric project root:

```text
organizations/...
```

not:

```text
../organizations/...
```

Inside scripts, calculate the project root from the script's directory.

---

## 28.3 `KYCChannel` profile not found

Check profiles in:

```bash
grep -n "^  [A-Za-z].*:" configtx.yaml
```

Use the exact profile name defined by the current `configtx.yaml`.

The supplied project documentation identifies profiles including:

```text
KYCSystemGenesis
KYCGenesis
```

Do not assume the profile name if the configuration has changed.

---

## 28.4 TLS `unknown authority`

Example:

```text
x509: certificate signed by unknown authority
```

Check:

1. Orderer TLS CA files
2. Shared TLS CA bundle
3. Current server certificates
4. Certificates embedded in `kycchannel.block`

Verify:

```bash
openssl verify \
  -CAfile organizations/tls-ca/all-tls-ca.crt \
  organizations/bankA/orderers/orderer.banka.com/tls/server.crt
```

Repeat for BankB and Regulator.

If certificates have been regenerated, regenerate the channel block so its Raft consenter certificates match the current deployment.

---

## 28.5 `ledger [kycchannel] already exists with state [ACTIVE]`

This normally means the peer has already joined the channel.

Check:

```bash
peer channel list
```

If `kycchannel` is listed, do not run `peer channel join` again.

---

## 28.6 WSL hostname issues

Check:

```bash
grep -E "banka|bankb|regulator|orderer" /etc/hosts
```

Re-add entries if necessary:

```bash
echo "127.0.0.1 peer0.banka.com peer0.bankb.com peer0.regulator.com orderer.banka.com orderer.bankb.com orderer.regulator.com" \
  | sudo tee -a /etc/hosts
```

---

## 28.7 Peer/orderer not starting

Check:

```bash
docker ps -a
```

Then inspect logs:

```bash
docker logs peer0.banka.com --tail 100
docker logs orderer.banka.com --tail 100
```

Also verify:

```text
FABRIC_CFG_PATH
TLS CA files
MSP paths
Docker volume mounts
certificate validity
channel block
```

---

## 28.8 MongoDB connection failure

Check:

```bash
docker ps --filter name=docchain-mongo
```

If stopped:

```bash
docker start docchain-mongo
```

If missing:

```bash
docker run -d \
  -p 27017:27017 \
  --name docchain-mongo \
  mongo:7
```

Then restart the backend.

---

# 29. Current Limitations

The project is an academic/reference implementation rather than a production financial-institution deployment.

Known limitations include:

### Local document storage

Actual documents are stored using local/off-chain storage rather than decentralized storage such as IPFS or encrypted object storage.

### Cryptographic identity lifecycle

A production deployment should use dynamic Fabric CA enrollment for individual users and officers rather than relying on static/demo identities.

### Shared/demo wallet identities

The development setup may use shared cryptogen-derived identities for certain application roles. Production should provide a unique Fabric identity per authorized participant.

### No zero-knowledge proofs

The original design considered selective disclosure using zero-knowledge proofs. The current implementation uses claims-based credentials instead.

### Academic environment

The project is intended to demonstrate the architecture and workflow rather than replace regulatory KYC infrastructure.

---

# 30. Future Enhancements

Potential improvements include:

- Production-grade multi-orderer Raft deployment and operational hardening
- Dynamic per-user Fabric CA enrollment
- Unique X.509 identities for individual officers/users
- IPFS or encrypted S3 document storage
- DigiLocker integration
- Government-document verification integrations
- Zero-knowledge proof selective disclosure
- Mobile credential wallet
- Automated credential expiry notifications
- Stronger cross-bank credential exchange
- Production-grade monitoring and observability
- Hardware-backed key protection
- High-availability MongoDB
- Backup and disaster-recovery infrastructure

---

# 31. Team Responsibilities

| Member | Responsibility |
|---|---|
| **Sachin** | Hyperledger Fabric network, TypeScript chaincode, PKI/X.509, Fabric SDK integration, wallet setup, network automation |
| **Payal** | Node.js/Express backend, MongoDB models, JWT authentication, PIN middleware, rate limiting, file upload, controllers/routes, Swagger |
| **Tejaswa** | React user/signer frontend, dashboards, document upload, signer workflow, credential viewer, notifications |
| **Himanshu** | Regulator dashboard, audit/analytics UI, certificate management, alert center, Docker deployment and integration testing |

---

# Quick Start

For an already-configured development machine:

```bash
# Terminal 1 — Fabric
cd ~/fabric-samples/decentralized-kyc/fabric-network
export PATH=$PATH:$HOME/fabric-samples/bin
export FABRIC_CFG_PATH=$HOME/fabric-samples/config

docker compose -p kyc-network up -d

chmod +x scripts/createChannel.sh
./scripts/createChannel.sh
```

```bash
# Terminal 2 — MongoDB
docker start docchain-mongo
# If it does not exist:
docker run -d -p 27017:27017 --name docchain-mongo mongo:7
```

```bash
# Terminal 3 — Backend
cd ~/fabric-samples/decentralized-kyc/backend
npm install
node scripts/setupWallet.js
npm run seed
npm run dev
```

```bash
# Terminal 4 — User/Signer frontend
cd ~/fabric-samples/decentralized-kyc/signer-frontend
npm install
npm run dev
```

```bash
# Terminal 5 — Regulator frontend
cd ~/fabric-samples/decentralized-kyc/regulator-dashboard
npm install
npm run dev
```

Then open:

```text
User / Signer:  http://localhost:5173
Backend:        http://localhost:5000
Regulator:      http://localhost:5174
MongoDB:        localhost:27017
```

---

## Final Development Checklist

Before testing the application, verify:

- [ ] Docker is running
- [ ] Fabric binaries are in `PATH`
- [ ] `FABRIC_CFG_PATH` points to `$HOME/fabric-samples/config`
- [ ] `/etc/hosts` contains Fabric hostnames
- [ ] Three CAs are running
- [ ] Three peers are running
- [ ] Three Raft orderers are running
- [ ] TLS is enabled
- [ ] `kycchannel.block` exists
- [ ] All three orderers are present in the channel configuration
- [ ] All three peers have joined `kycchannel`
- [ ] Chaincode is deployed and committed
- [ ] MongoDB is running
- [ ] Backend dependencies are installed
- [ ] Fabric wallet is populated
- [ ] Regulator account is seeded
- [ ] Backend is running on port 5000
- [ ] Signer frontend is running on port 5173
- [ ] Regulator frontend is running on port 5174
- [ ] Customer registration works
- [ ] Document upload works
- [ ] SHA-256 hash is written to Fabric
- [ ] Signer approval/rejection works
- [ ] Credential issuance works
- [ ] Credential verification works
- [ ] Regulator audit trail is visible

---

## Project Summary

This project demonstrates how a **permissioned blockchain network can be used as a shared trust and audit layer for decentralized KYC**.

The key architectural principle is:

```text
Sensitive data + actual documents
              |
              v
         Off-chain storage

Cryptographic proof + state + audit
              |
              v
       Hyperledger Fabric
```

This allows participating institutions to verify KYC-related claims without placing raw customer documents on a shared blockchain.

---

*Permissioned Blockchain-Based KYC & Identity Verification System*  
*C-DAC PGCP-FBD End Project — 2026*
