import express from 'express';
import { body } from 'express-validator';
import { submitContactMessage } from '../controllers/contactController.js';
import { contactLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email address is required').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim(),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message content is required')
];

/**
 * @route   POST /api/contact
 * @desc    Submit public contact inquiry
 * @access  Public (Rate limited to 5/hour)
 */
router.post('/', contactLimiter, contactValidation, submitContactMessage);

export default router;
