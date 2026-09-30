import express from 'express';
import { body } from 'express-validator';
import { getMe, updateMe, updatePassword } from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

const updateMeValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('phone').optional().trim(),
  body('profileImage').optional().trim()
];

const updatePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
];

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', requireAuth, getMe);

/**
 * @route   PUT /api/users/me
 * @desc    Update name, phone, or profileImage
 * @access  Private
 */
router.put('/me', requireAuth, updateMeValidation, updateMe);

/**
 * @route   PUT /api/users/me/password
 * @desc    Change password
 * @access  Private
 */
router.put('/me/password', requireAuth, updatePasswordValidation, updatePassword);

export default router;
