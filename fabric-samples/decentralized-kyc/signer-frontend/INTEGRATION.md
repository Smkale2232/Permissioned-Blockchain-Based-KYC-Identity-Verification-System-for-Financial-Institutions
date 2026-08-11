# API Contract — What the Frontend Expects

Hand this to the backend team (backend) and the Fabric/chaincode team (chaincode/regulator fields) to confirm before final integration.
Base URL is set via `VITE_API_BASE_URL` in `.env` (defaults to `http://localhost:5000/api`).

Every request except register/login sends `Authorization: Bearer <token>` automatically.

---

## Auth

### `POST /auth/register`
Request:
```json
{ "name": "string", "email": "string", "password": "string", "role": "user | signer" }
```
Expected response (2xx): any body is fine, frontend just needs success/failure.
Failure: `{ "message": "string" }` with a non-2xx status — shown directly in the form.

**Frontend enforces this password policy client-side (UX only — confirm the backend enforces
its own rule independently, since client checks can be bypassed):** 8–128 characters, at least
one uppercase, one lowercase, one digit. If the backend has a different policy, update this doc and
I'll update `src/utils/validators.js` — one file, used by both Login and Register.

### `POST /auth/login`
Request:
```json
{ "email": "string", "password": "string" }
```
Expected response:
```json
{
  "token": "jwt-string",
  "user": { "id": "string", "name": "string", "email": "string", "role": "user | signer" }
}
```
`role` is what drives the redirect to `/dashboard` vs `/signer` — this field name and these two values must match exactly.

---

## Documents — user side

### `GET /documents`
Returns the logged-in user's own uploaded documents.
```json
[
  { "id": "string", "title": "string", "status": "pending | signed | rejected", "uploadedAt": "ISO-date-string" }
]
```

### `POST /documents/upload`
`multipart/form-data` with fields: `file`, `title`.
Expected response: the created document, same shape as one item above.

Frontend pre-checks (UX only, **backend must re-validate independently**): file under 10MB,
MIME type in `{pdf, doc, docx, png, jpeg}`, title under 150 characters.

### `GET /documents/:docId/history`
```json
[
  {
    "id": "string",
    "actor": "string (name of who performed the action)",
    "action": "uploaded | signed | pending | rejected",
    "timestamp": "ISO-date-string",
    "note": "string (optional)"
  }
]
```

---

## Documents — signer side

### `GET /documents/pending`
Documents awaiting the logged-in signer's signature.
```json
[
  { "id": "string", "title": "string", "uploadedBy": "string", "status": "pending", "uploadedAt": "ISO-date-string" }
]
```

### `POST /documents/sign/:docId`
No body required. Any 2xx response is treated as success; a non-2xx with `{ "message": "..." }` is shown in the sign confirmation modal.

---

## Global error shape
Everywhere above, on failure the frontend reads `error.response.data.message` and shows it inline. If your API wraps errors differently (e.g. `{ error: "..." }` instead of `{ message: "..." }`), tell me and I'll adjust `axiosClient.js` in one place rather than every page.

## Auth failures
Any `401` response, from any endpoint, automatically logs the user out and redirects to `/login` — this is handled globally in `src/api/axiosClient.js`, no per-page code needed.
