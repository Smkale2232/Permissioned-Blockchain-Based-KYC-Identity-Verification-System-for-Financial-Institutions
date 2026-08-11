const express = require('express');
const authController = require('../controllers/auth.controller');
const requireAuth = require('../middleware/auth.middleware');
const { authLimiter, pinActionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user or signer
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [user, signer] }
 *     responses:
 *       201: { description: User created }
 *       400: { description: Validation error }
 *       409: { description: Email already registered }
 */
router.post('/register', authLimiter, authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive a JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: 'Returns { token, user }' }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, authController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the current authenticated user
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Not authenticated }
 */
router.get('/me', requireAuth, authController.me);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update the caller's own display name / Employee ID
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               employeeId: { type: string, description: 'Regulator-only, but harmless for other roles' }
 *     responses:
 *       200: { description: Updated user }
 *       400: { description: Validation error }
 */
router.put('/profile', requireAuth, authController.updateProfile);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change the caller's own password
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password updated }
 *       401: { description: Current password incorrect }
 */
router.post('/change-password', requireAuth, pinActionLimiter, authController.changePassword);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: 'Generic response; includes resetToken only in dev (no email service configured)' }
 */
router.post('/forgot-password', authLimiter, authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset a password using a token from forgot-password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, token, newPassword]
 *             properties:
 *               email: { type: string }
 *               token: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200: { description: Password reset }
 *       400: { description: Invalid or expired token }
 */
router.post('/reset-password', authLimiter, authController.resetPassword);

module.exports = router;
