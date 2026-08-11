# DocChain Backend

Express + MongoDB + Hyperledger Fabric API for the CDAC PGCP-FBD group project
("DocChain" — document upload → sign → audit trail, on Hyperledger Fabric).

## Team ownership

| Area | Owner | File(s) |
|---|---|---|
| Fabric network, chaincode, PKI | the Fabric/chaincode team | `src/services/fabric.service.js`, `src/services/ca.service.js`, `src/config/fabric.js` |
| APIs, SDK integration, MongoDB | the backend team | everything else in `src/` |
| User & Signer frontend | the signer-frontend team | `signer-frontend/` (separate repo) |
| Regulator frontend & DevOps | the regulator-dashboard team | consumes `/api/regulator/*`, owns deployment |

## Quick start

```bash
cp .env.example .env          # then edit values, esp. JWT_SECRET
npm install
npm run dev                   # nodemon, http://localhost:5000
```

Open `http://localhost:5000/api-docs` for interactive Swagger docs of every
route. `http://localhost:5000/health` is a plain liveness check.

### Running without a live Fabric network

`FABRIC_MOCK=true` (the default in `.env.example`) makes every Fabric call in
`fabric.service.js` / `ca.service.js` return a fake transaction id instead of
touching a real network. **MongoDB remains the actual source of truth for API
responses** either way. This means the backend team, the signer-frontend team, and the regulator-dashboard team can build and
test the entire system before the Fabric/chaincode team's Fabric network + chaincode are ready.
the Fabric/chaincode team flips `FABRIC_MOCK=false` and fills in the marked TODO sections once
the connection profile, wallet, and deployed chaincode exist.

### Creating a regulator account

Public registration only allows `user` and `signer` roles (matches the
frontend's registration form). To create the regulator login:

```bash
npm run seed
```

This creates `regulator@docchain.local` / `Regulator@123` (override via
`SEED_REGULATOR_EMAIL` / `SEED_REGULATOR_PASSWORD` / `SEED_REGULATOR_NAME` env
vars). Change the password after first login.

## API contract (matches the existing signer-frontend exactly)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{ name, email, password, role: 'user'\|'signer' }` |
| POST | `/api/auth/login` | — | → `{ token, user }` |
| GET | `/api/documents` | user/signer | caller's own uploaded documents |
| POST | `/api/documents/upload` | user/signer | multipart `{ file, title }` |
| GET | `/api/documents/:docId/history` | owner or signer/regulator | audit trail |
| GET | `/api/documents/pending` | signer | documents awaiting signature |
| POST | `/api/documents/sign/:docId` | signer | signs a pending document |
| GET | `/api/regulator/statistics` | regulator | dashboard StatCards |
| GET | `/api/regulator/documents` | regulator | all documents (GetAllDocuments) |
| GET | `/api/regulator/audit-trail` | regulator | system-wide, `?docId=` optional |
| POST | `/api/regulator/certificates/:userId/revoke` | regulator | CA + on-chain revoke |

See `INTEGRATION.md` at the repo root for the full cross-team contract and
request/response examples.

## Folder structure

```
backend/
├── server.js                 entrypoint: loads env, connects DB, starts app
├── src/
│   ├── app.js                Express app: middleware, routes, error handling
│   ├── config/                db.js, fabric.js, swagger.js
│   ├── controllers/            auth / document / regulator
│   ├── middleware/            auth, role, upload (multer), error
│   ├── models/                 User, Document, AuditLog (Mongoose)
│   ├── routes/                 auth / document / regulator (+ swagger jsdoc)
│   ├── services/               fabric.service, ca.service, crypto.service, jwt.service
│   ├── utils/                  hash, logger, constants, seed
│   └── uploads/                uploaded files land here (disk storage)
```

## Notes on security choices

- Passwords hashed with bcrypt (12 rounds), never returned in any response.
- JWT signed with `JWT_SECRET`, role embedded in the token, verified on every
  protected route via `auth.middleware.js`.
- Uploaded files are renamed to random ids on disk (no path traversal, no
  guessable URLs); a SHA-256 hash of the file is computed and is what actually
  gets recorded on-chain — never the raw file bytes.
- A revoked certificate (`certificateStatus: 'revoked'`) blocks both login and
  any further authenticated request, even with a still-valid JWT.
- `helmet()` + explicit CORS origin restriction (`CLIENT_ORIGIN`) are on by
  default.

## Known limitation in this environment

This backend was written and syntax-verified in a sandbox without a running
MongoDB instance or live Fabric network, so it hasn't been exercised
end-to-end here. Run `npm run dev` locally against a real `mongod` (or
MongoDB Atlas URI) to do that — the code has no other external dependencies
in mock mode.
