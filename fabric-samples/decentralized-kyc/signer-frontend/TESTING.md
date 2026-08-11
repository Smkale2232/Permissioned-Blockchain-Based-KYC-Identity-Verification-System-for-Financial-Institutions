# Manual Test Checklist — Frontend (the signer-frontend team)

Run through this against the backend team's live backend before the Day 14 demo. Check off each row.

## Auth
- [ ] Register as a **user** → redirected to login, account created
- [ ] Register as a **signer** → redirected to login, account created
- [ ] Register with an already-used email → inline error shown, no crash
- [ ] Register with mismatched passwords → blocked client-side, no API call made
- [ ] Login with correct user credentials → redirected to `/dashboard`
- [ ] Login with correct signer credentials → redirected to `/signer`
- [ ] Login with wrong password → inline error shown
- [ ] While logged in, manually visit `/login` → auto-redirected to your dashboard
- [ ] Log out → token cleared, redirected, dashboards no longer reachable

## Role boundaries
- [ ] Logged in as **user**, manually visit `/signer` → redirected to `/dashboard`, no data leak
- [ ] Logged in as **signer**, manually visit `/dashboard` → redirected to `/signer`
- [ ] Logged out, visit `/dashboard` or `/signer` directly → redirected to `/login`
- [ ] Visit a nonsense URL (`/xyz`) → 404 page, not a blank screen

## User dashboard
- [ ] Upload a document with title + file → appears in "My Documents" with Pending status
- [ ] Upload with no title → blocked client-side with a message
- [ ] Upload with no file → blocked client-side with a message
- [ ] Upload a file >10MB → blocked client-side with a message
- [ ] After upload, success toast appears
- [ ] Click "View history" on a document → modal shows audit trail
- [ ] Empty state (no documents yet) renders correctly for a brand-new user

## Signer dashboard
- [ ] Pending documents list loads and shows uploader + status
- [ ] "Review & Sign" opens the confirmation modal
- [ ] Confirming sign → document disappears from pending list, success toast shown
- [ ] Cancel on the modal → nothing happens, document still pending
- [ ] "History" button on a pending doc → modal shows audit trail
- [ ] Empty state ("nothing waiting") renders correctly when queue is empty

## Session / error handling
- [ ] Let the token expire (or manually clear it in devtools) then perform an action → auto-redirected to `/login`
- [ ] Turn off the backend and try to load a dashboard → error message shown, not a blank screen or crash
- [ ] Refresh the page while logged in → session persists (still logged in, same dashboard)

## Cross-browser / responsive
- [ ] Chrome desktop
- [ ] Firefox desktop
- [ ] Mobile width (Chrome devtools responsive mode) — forms and tables don't overflow badly
