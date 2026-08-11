const express = require('express');
const pkiController = require('../controllers/pki.controller');

const router = express.Router();

// No requireAuth on purpose — see pki.controller.js. This is the "publish
// public keys so anyone can verify independently" half of the trust story;
// the private half (signing) never leaves the server.

/**
 * @swagger
 * /pki/{userId}/certificate:
 *   get:
 *     summary: Fetch a user's public certificate (for independent Verifiable Credential verification)
 *     tags: [PKI]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Certificate found }
 *       404: { description: No certificate found for this id }
 */
router.get('/:userId/certificate', pkiController.getCertificate);

/**
 * @swagger
 * /pki/revocation-list:
 *   get:
 *     summary: List of currently-revoked certificate serial numbers
 *     tags: [PKI]
 *     responses:
 *       200: { description: Revocation list }
 */
router.get('/revocation-list', pkiController.getRevocationList);

module.exports = router;
