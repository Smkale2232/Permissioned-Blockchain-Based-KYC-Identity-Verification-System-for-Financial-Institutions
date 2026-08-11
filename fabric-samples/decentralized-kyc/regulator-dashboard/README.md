# DocChain — Regulator Dashboard

the regulator-dashboard team's piece: the regulator-only console for DocChain. Consumes the
`/api/regulator/*` endpoints from `backend/` — same visual identity
(white/blue/grey, MUI) as the signer-frontend team's `signer-frontend/`, so the two feel like
one product even though they're separate apps for separate roles.

## Pages

| Route | Purpose |
|---|---|
| `/login` | Regulator-only login. Rejects non-regulator accounts client-side (backend also enforces this). |
| `/overview` | StatCards (documents by status, users, revoked certs) + a bar chart + the Alert Center |
| `/documents` | Every document in the system, searchable by title/uploader, with file hash shown |
| `/audit-trail` | System-wide audit log, optionally filtered by document ID |
| `/certificates` | Certificate Management — list every user, revoke a certificate with a confirm dialog |

## Alert Center

`src/components/AlertCenter.jsx` derives a small set of rule-based alerts
(revoked certificates, rejected documents, recent revoke events) from data the
dashboard already fetches (`/statistics` + `/audit-trail`), polled every 30s.
This avoids needing a separate websocket/real-time backend for the first
version. If a real push-based alert feed is added later, swap the polling
`useEffect` in `Overview.jsx` for a subscription and keep `AlertCenter`'s
props the same.

## Getting a regulator login

Regulators aren't self-registered. From `backend/`, run:
```bash
npm run seed
```
This prints a regulator email/password (see `backend/README.md`).

## Local development

```bash
cp .env.example .env      # points at the backend; edit if it's not on :5000
npm install
npm run dev                 # http://localhost:5174
```

Runs on **5174** (not 5173) so it can run side-by-side with `signer-frontend/`
against the same backend.

## Docker

```bash
docker build --build-arg VITE_API_BASE_URL=http://localhost:5000/api -t docchain-regulator-dashboard .
docker run -p 5174:80 docchain-regulator-dashboard
```

Or via the root `docker-compose.yml`: `docker compose up -d regulator-dashboard`.

Note: `VITE_API_BASE_URL` is baked in at **build time** (Vite inlines env vars
into the static bundle) — there's no runtime env injection for a plain nginx
static server. Rebuild the image if the backend URL changes for a deployment.
