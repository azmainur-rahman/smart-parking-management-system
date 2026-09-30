import express from 'express';
import { body } from 'express-validator';
import {
  initiatePayment,
  paymentSuccess,
  paymentFailed,
  getPaymentByBooking,
  getMyPayments
} from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/payments
 * @desc    Get user payment history sorted newest first
 * @access  Private
 */
router.get('/', requireAuth, getMyPayments);

/**
 * @route   POST /api/payments/initiate
 * @desc    Initialize a payment transaction for a booking
 * @access  Private
 */
router.post(
  '/initiate',
  requireAuth,
  [body('bookingId').notEmpty().withMessage('bookingId is required')],
  initiatePayment
);

/**
 * @route   POST /api/payments/success
 * @desc    Verify payment and confirm booking reservation
 * @access  Private / Gateway IPN
 */
router.post('/success', requireAuth, paymentSuccess);

/**
 * @route   POST /api/payments/fail
 * @desc    Record failed payment attempt
 * @access  Private
 */
router.post('/fail', requireAuth, paymentFailed);

/**
 * @route   GET /api/payments/booking/:bookingId
 * @desc    Get payment status for a specific booking
 * @access  Private
 */
router.get('/booking/:bookingId', requireAuth, getPaymentByBooking);

export default router;
