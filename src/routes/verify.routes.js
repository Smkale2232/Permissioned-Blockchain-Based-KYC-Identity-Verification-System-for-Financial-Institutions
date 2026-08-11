const express = require('express');
const verifyController = require('../controllers/verify.controller');

const router = express.Router();

// No requireAuth here on purpose — this backs a shareable public link/QR
// code, so anyone with the link can confirm a document's recorded status
// without an account. See verify.controller.js for exactly what is (and
// isn't) exposed.

/**
 * @swagger
 * /verify/{docId}:
 *   get:
 *     summary: Publicly verify a document's recorded status (no auth required)
 *     tags: [Verify]
 *     parameters:
 *       - in: path
 *         name: docId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Verification info (title, status, hash, signer, tx ids) }
 *       404: { description: No document found for this id }
 */
router.get('/:docId', verifyController.verifyDocument);

module.exports = router;
