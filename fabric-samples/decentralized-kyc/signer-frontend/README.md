# DocChain — Frontend (User & Signer Dashboards)

Part of the DocChain group project, alongside:
- **the Fabric/chaincode team** — Hyperledger Fabric network + chaincode
- **the backend team** — Node.js/Express backend + fabric-network SDK
- **the regulator-dashboard team** — Regulator dashboard + DevOps/deployment

## Setup

```bash
npm install
cp .env.example .env   # then edit VITE_API_BASE_URL if the backend isn't running on localhost:5000
npm run dev
```

Runs at `http://localhost:5173`.

## Check it standalone (no teammates needed)

`mock-server/` is a small fake backend that returns the exact same response shapes as
the backend team's real API (see `INTEGRATION.md`). Use it to test your whole frontend end-to-end
before the real backend is ready:

```bash
# terminal 1
cd mock-server
npm install
npm start                 # runs at http://localhost:5000

# terminal 2 (project root)
npm run dev                # your .env should already point at http://localhost:5000/api
```

Then open `http://localhost:5173`, register a **user** account and a **signer** account,
upload a document as the user, and sign it as the signer — the full flow works with no
backend team dependency. Data resets every time you restart the mock server (in-memory only).

## What's here

- Login / register (with role selection: user or signer)
- User dashboard — upload documents, view own documents + status, view history
- Signer dashboard — see pending documents, review + sign with confirmation, view history
- Route protection by role, session persistence, global toast notifications, 404 handling

## For the team

- **`INTEGRATION.md`** — exact API request/response shapes this frontend expects. the backend team and the Fabric/chaincode team should check this against what the backend actually returns.
- **`TESTING.md`** — manual test checklist to run through once the real backend is up.
- Only two files ever need to change if backend shapes differ from what's assumed: `src/api/axiosClient.js` (auth/error handling) and `src/api/documents.js` (document endpoints).

## Folder structure

```
src/
  api/          axiosClient.js, documents.js       — all backend calls live here
  context/      AuthContext.jsx, ToastContext.jsx   — global state (auth + notifications)
  components/   layout/, DocumentUpload, MyDocuments, PendingDocuments,
                 SignDocument, DocumentHistory, StatusBadge, Spinner
  pages/        Home, Login, Register, UserDashboard, SignerDashboard, NotFound
  routes/       ProtectedRoute.jsx, GuestRoute.jsx
```
