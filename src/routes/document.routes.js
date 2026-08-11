const express = require('express');
const documentController = require('../controllers/document.controller');
const requireAuth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');
const requireActionPin = require('../middleware/pin.middleware');
const { pinActionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Order matters: '/pending' must be registered before '/:docId/history'
// so Express doesn't try to match "pending" as a docId.

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: List the logged-in user's own uploaded documents
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of documents }
 */
router.get('/', requireAuth, documentController.listMyDocuments);

/**
 * @swagger
 * /documents/upload:
 *   post:
 *     summary: Upload a new document for signing
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, title, pin]
 *             properties:
 *               file: { type: string, format: binary }
 *               title: { type: string }
 *               pin: { type: string, description: '4–6 digit account PIN, confirms the upload' }
 *     responses:
 *       201: { description: Document created }
 *       400: { description: Validation error }
 */
// Note the order: upload.single('file') must run before requireActionPin so
// req.body.pin (sent as a form field alongside the file) is parsed by multer first.
router.post('/upload', requireAuth, pinActionLimiter, upload.single('file'), requireActionPin, documentController.uploadDocument);

/**
 * @swagger
 * /documents/pending:
 *   get:
 *     summary: List documents awaiting a signer's signature
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of pending documents }
 */
router.get('/pending', requireAuth, requireRole('signer'), documentController.pendingHandler);

/**
 * @swagger
 * /documents/sign/{docId}:
 *   post:
 *     summary: Sign a pending document
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin]
 *             properties:
 *               pin: { type: string, description: '4–6 digit account PIN, confirms the signature' }
 *     responses:
 *       200: { description: Document signed }
 *       401: { description: Incorrect PIN }
 *       404: { description: Document not found }
 *       409: { description: Document already handled }
 */
router.post('/sign/:docId', requireAuth, requireRole('signer'), pinActionLimiter, requireActionPin, documentController.signDocument);

/**
 * @swagger
 * /documents/reject/{docId}:
 *   post:
 *     summary: Reject (deny) a pending document
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin]
 *             properties:
 *               pin: { type: string, description: '4–6 digit account PIN, confirms the rejection' }
 *               reason: { type: string }
 *     responses:
 *       200: { description: Document rejected }
 *       401: { description: Incorrect PIN }
 *       404: { description: Document not found }
 *       409: { description: Document already handled }
 */
router.post('/reject/:docId', requireAuth, requireRole('signer'), pinActionLimiter, requireActionPin, documentController.rejectDocument);

/**
 * @swagger
 * /documents/{docId}/file:
 *   get:
 *     summary: Stream the underlying document file for review before signing
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Raw file bytes }
 *       403: { description: Not permitted }
 *       404: { description: Document not found }
 */
router.get('/:docId/file', requireAuth, documentController.downloadDocumentFile);

/**
 * @swagger
 * /documents/{docId}/history:
 *   get:
 *     summary: Get the audit trail for one document
 *     tags: [Documents]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Array of audit events }
 *       403: { description: Not permitted }
 *       404: { description: Document not found }
 */
router.get('/:docId/history', requireAuth, documentController.getDocumentHistory);

module.exports = router;
