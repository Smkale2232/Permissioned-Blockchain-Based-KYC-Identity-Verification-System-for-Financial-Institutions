// Standalone mock backend — mirrors INTEGRATION.md exactly, so the frontend
// can be checked end-to-end without the rest of the stack running.
// Everything is in-memory (resets when you stop this server). NOT for production —
// this is a test double only, with none of the real security work backend needs.

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// --- in-memory "database" ---
const users = []; // { id, name, email, password, role }
const documents = []; // { id, title, status, uploadedAt, uploadedBy, uploadedByEmail, history: [] }
const sessions = new Map(); // token -> user

function makeId() {
  return crypto.randomBytes(6).toString('hex');
}

function makeToken() {
  return crypto.randomBytes(24).toString('hex');
}

// --- auth middleware ---
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const user = token && sessions.get(token);
  if (!user) return res.status(401).json({ message: 'Not authenticated.' });
  req.user = user;
  next();
}

// --- auth routes ---
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password || !['user', 'signer'].includes(role)) {
    return res.status(400).json({ message: 'Missing or invalid fields.' });
  }
  if (users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(409).json({ message: 'Email already registered.' });
  }
  const newUser = { id: makeId(), name, email, password, role };
  users.push(newUser);
  console.log(`[mock] registered ${role}: ${email}`);
  res.status(201).json({ id: newUser.id, name, email, role });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find(
    (u) => u.email.toLowerCase() === String(email || '').toLowerCase() && u.password === password
  );
  if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

  const token = makeToken();
  sessions.set(token, { id: user.id, name: user.name, email: user.email, role: user.role });
  console.log(`[mock] logged in: ${user.email} (${user.role})`);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// --- document routes (user side) ---
app.get('/api/documents', requireAuth, (req, res) => {
  const mine = documents.filter((d) => d.uploadedByEmail === req.user.email);
  res.json(mine.map(strip));
});

app.post('/api/documents/upload', requireAuth, upload.single('file'), (req, res) => {
  const { title } = req.body || {};
  if (!title || !req.file) return res.status(400).json({ message: 'Title and file are required.' });

  const doc = {
    id: makeId(),
    title,
    status: 'pending',
    uploadedAt: new Date().toISOString(),
    uploadedBy: req.user.name,
    uploadedByEmail: req.user.email,
    history: [
      { id: makeId(), actor: req.user.name, action: 'uploaded', timestamp: new Date().toISOString() },
    ],
  };
  documents.push(doc);
  console.log(`[mock] uploaded doc "${title}" by ${req.user.email}`);
  res.status(201).json(strip(doc));
});

app.get('/api/documents/:docId/history', requireAuth, (req, res) => {
  const doc = documents.find((d) => d.id === req.params.docId);
  if (!doc) return res.status(404).json({ message: 'Document not found.' });
  res.json(doc.history);
});

// --- document routes (signer side) ---
app.get('/api/documents/pending', requireAuth, (req, res) => {
  const pending = documents.filter((d) => d.status === 'pending');
  res.json(pending.map(strip));
});

app.post('/api/documents/sign/:docId', requireAuth, (req, res) => {
  const doc = documents.find((d) => d.id === req.params.docId);
  if (!doc) return res.status(404).json({ message: 'Document not found.' });
  if (doc.status !== 'pending') return res.status(409).json({ message: 'Document already handled.' });

  doc.status = 'signed';
  doc.history.push({ id: makeId(), actor: req.user.name, action: 'signed', timestamp: new Date().toISOString() });
  console.log(`[mock] "${doc.title}" signed by ${req.user.email}`);
  res.json(strip(doc));
});

function strip(doc) {
  const { history, uploadedByEmail, ...rest } = doc;
  return rest;
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\nMock backend running at http://localhost:${PORT}`);
  console.log(`Frontend should point VITE_API_BASE_URL to http://localhost:${PORT}/api\n`);
});
