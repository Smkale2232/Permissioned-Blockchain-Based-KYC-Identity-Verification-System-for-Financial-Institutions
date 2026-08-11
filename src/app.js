const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/auth.routes');
const documentRoutes = require('./routes/document.routes');
const regulatorRoutes = require('./routes/regulator.routes');
const verifyRoutes = require('./routes/verify.routes');
const pkiRoutes = require('./routes/pki.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

// --- Security & core middleware ---
app.use(helmet());
// CLIENT_ORIGIN supports a comma-separated list — the signer-frontend and the
// regulator-dashboard normally run on different ports (5173 / 5174).
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin/non-browser requests (no Origin header) and any listed origin.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// --- Health check ---
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// --- API docs ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/regulator', regulatorRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/pki', pkiRoutes);

// --- 404 + error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
