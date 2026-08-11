const express = require('express');
const regulatorController = require('../controllers/regulator.controller');
const requireAuth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

const router = express.Router();

// Every route here is regulator-only.
router.use(requireAuth, requireRole('regulator'));

/**
 * @swagger
 * /regulator/statistics:
 *   get:
 *     summary: Overview counters for the regulator dashboard StatCards
 *     tags: [Regulator]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Aggregate statistics }
 */
router.get('/statistics', regulatorController.getStatistics);

/**
 * @swagger
 * /regulator/documents:
 *   get:
 *     summary: List every document in the system (AllDocuments view)
 *     tags: [Regulator]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: false
 *         description: Scope to one user's uploads (used by the Review action)
 *         schema: { type: string }
 *     responses:
 *       200: { description: Array of all documents }
 */
router.get('/documents', regulatorController.getAllDocuments);

/**
 * @swagger
 * /regulator/audit-trail:
 *   get:
 *     summary: System-wide audit trail, optionally filtered by docId or userId
 *     tags: [Regulator]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: docId
 *         required: false
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         required: false
 *         description: Scope to events by/about one user (used by the Review action)
 *         schema: { type: string }
 *     responses:
 *       200: { description: Array of audit events }
 */
router.get('/audit-trail', regulatorController.getAuditTrail);

/**
 * @swagger
 * /regulator/users:
 *   get:
 *     summary: List every user (for Certificate Management)
 *     tags: [Regulator]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of users with certificate status }
 */
router.get('/users', regulatorController.listUsers);

/**
 * @swagger
 * /regulator/certificates/{userId}/revoke:
 *   post:
 *     summary: Revoke a user's certificate (CA + on-chain)
 *     tags: [Regulator]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Certificate revoked }
 *       404: { description: User not found }
 *       409: { description: Already revoked }
 */
router.post('/certificates/:userId/revoke', regulatorController.revokeCertificate);

/**
 * @swagger
 * /regulator/certificates/{userId}/reactivate:
 *   post:
 *     summary: Reactivate (un-revoke) a user's certificate — corrective undo
 *     tags: [Regulator]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Certificate reactivated }
 *       404: { description: User not found }
 *       409: { description: Not currently revoked }
 */
router.post('/certificates/:userId/reactivate', regulatorController.reactivateCertificate);

module.exports = router;
