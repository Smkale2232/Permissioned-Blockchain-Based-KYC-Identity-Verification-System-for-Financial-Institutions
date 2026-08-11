# Security Notes — Frontend

Scope: this document covers what the **frontend** does and doesn't do for security.
PKI (certificate issuance, key management, chaincode-level signing) is the Fabric/chaincode team's layer —
the frontend never handles private keys, certificates, or raw crypto material. It only
talks to the backend team's REST API over HTTPS with a bearer token.

## What's implemented here

**Transport & headers**
- `index.html` sets a Content-Security-Policy restricting scripts to same-origin, blocking
  inline `<script>` injection — the main XSS payload delivery method.
- `axiosClient.js` warns at build time if a production build is pointed at a non-HTTPS,
  non-localhost API URL.
- All requests have a 15s timeout so a hung backend can't hang the UI indefinitely.

**Auth**
- JWT is sent as `Authorization: Bearer <token>`, not a cookie — this avoids CSRF entirely,
  since there's no ambient credential the browser attaches automatically to cross-site requests.
- Any `401` response from any endpoint immediately clears the session and forces re-login —
  handled once, globally, in `axiosClient.js` (not duplicated per-page, so it can't be missed).
- Login error messages are intentionally generic ("check your credentials") and never say
  whether the email or password was wrong — avoids account enumeration.
- Route access is role-gated (`ProtectedRoute`/`GuestRoute`); a signer can't reach `/dashboard`
  and vice versa, even by typing the URL directly.

**Input handling**
- All form fields are length-capped (email 254, name 100, password 8–128) matching realistic
  limits, not arbitrary — see `src/utils/validators.js`, the single source of truth so Login
  and Register can't drift out of sync with each other.
- New-account passwords require upper/lower/digit and a minimum length; login only checks
  "not empty" (a strict policy on login would leak information about the policy to an attacker
  probing credentials, with no benefit — the account either exists with a compliant password
  or doesn't).
- File uploads are checked against an explicit MIME allowlist and a 10MB cap.

**Rendering**
- No `dangerouslySetInnerHTML` anywhere in the codebase — every piece of user-supplied text
  (document titles, names, history notes) goes through React's default JSX escaping, which is
  the actual XSS defense. Search this yourself with `grep -r dangerouslySetInnerHTML src/` —
  it should return nothing.

## What is explicitly NOT this layer's job (flag to the right teammate)

- **Client-side validation is UX, not a security boundary.** Every check in `validators.js`
  and `DocumentUpload.jsx` can be bypassed by anyone calling the API directly (curl, Postman).
  the backend must re-validate everything — length limits, email format, file type/size,
  role values — independently. If it doesn't, that's a real vulnerability regardless of what
  the frontend enforces.
- **File content validation** (magic-byte sniffing) — ✅ now implemented server-side
  (`backend/src/utils/fileSignature.js`, called from the upload handler before the file is
  hashed/persisted). The frontend's MIME check still only reads the browser-reported
  `file.type`, which is attacker-controlled — the backend never trusts it.
- **Rate limiting / brute-force protection** on login, registration, password reset, and every
  PIN-guarded action — ✅ now implemented server-side (`backend/src/middleware/rateLimiter.js`,
  see the root `SECURITY.md` for the full parameter list).
- **PKI operations** — certificate issuance, revocation, chaincode-level signature verification —
  are the Fabric/chaincode team's Fabric CA and chaincode layer. The frontend just calls `/documents/sign/:docId`
  and trusts the backend/chaincode to do the actual cryptographic signing correctly.
- **Security headers beyond CSP** (HSTS, X-Frame-Options, etc.) need to be set by whatever serves
  the built static files in production — that's the regulator-dashboard team's deployment/DevOps layer, not
  something a `<meta>` tag can fully replace. See the root `DEPLOYMENT_GUIDE.md`.
- **JWT storage tradeoff**: the token lives in `sessionStorage`, which is readable by any script
  running on the page (i.e. vulnerable if an XSS bug ever did slip through the CSP). The
  alternative — an `httpOnly` cookie set by the backend — is more secure against XSS but requires
  the backend to set it and requires CSRF protection in exchange. For a class project scoped
  to REST + bearer tokens this tradeoff is standard and acceptable; worth a one-line mention in
  the report if asked to compare approaches.

See the root-level `SECURITY.md` for the complete, system-wide list of safety parameters
(backend + both frontends) and `FEATURES.md` for a plain-language tour of what the whole
platform does.

## Quick self-check before the demo
```bash
grep -r "dangerouslySetInnerHTML" src/     # should be empty
grep -r "eval(" src/                       # should be empty
npm audit                                  # check for known-vulnerable dependencies
```

## Known dependency advisory (accepted, not fixed)
`npm audit` reports one moderate advisory in `esbuild` (bundled by Vite 5.x):
any website open in your browser could send requests to your **local dev server**
(`npm run dev`) and read the response — [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99).

- Only affects `npm run dev` on your own machine, never the production build (`npm run build`)
  or anything served from `dist/`.
- The fix requires upgrading to Vite 6/7/8, which `npm audit fix --force` will do but is a
  breaking change this close to the demo — not worth the risk of new bugs for a dev-only issue.
- Mitigation while developing: don't browse untrusted sites while `npm run dev` is running,
  or run it on a network interface not exposed beyond localhost (the default).
