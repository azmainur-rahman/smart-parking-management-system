import express from 'express';
import { body } from 'express-validator';
import {
  checkAvailability,
  quoteBooking,
  createBooking,
  getMyBookings,
  getBookingById,
  getCancellationPreview,
  cancelBooking,
  getBookingQR,
  getBookingSlipPDF
} from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation Rules
const availabilityValidation = [
  body('slotId').trim().notEmpty().withMessage('Slot ID is required'),
  body('startTime').isISO8601().withMessage('Start time must be a valid ISO8601 date'),
  body('endTime').isISO8601().withMessage('End time must be a valid ISO8601 date')
];

const quoteBookingValidation = [
  body('vehicleId').trim().notEmpty().withMessage('Vehicle ID is required'),
  body('slotId').trim().notEmpty().withMessage('Slot ID is required'),
  body('startTime').isISO8601().withMessage('Start time must be a valid ISO8601 date'),
  body('durationType')
    .trim()
    .toUpperCase()
    .isIn(['HOURLY', 'DAILY'])
    .withMessage('Duration type must be HOURLY or DAILY'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer')
];

const createBookingValidation = [
  body('vehicleId').trim().notEmpty().withMessage('Vehicle ID is required'),
  body('slotId').trim().notEmpty().withMessage('Slot ID is required'),
  body('startTime').isISO8601().withMessage('Start time must be a valid ISO8601 date'),
  body('endTime').optional().isISO8601().withMessage('End time must be a valid ISO8601 date'),
  body('durationType')
    .trim()
    .toUpperCase()
    .isIn(['HOURLY', 'DAILY'])
    .withMessage('Duration type must be HOURLY or DAILY'),
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer')
];

// All booking routes require authentication
router.use(requireAuth);

router.post('/check-availability', availabilityValidation, checkAvailability);
router.post('/quote', quoteBookingValidation, quoteBooking);
router.post('/', createBookingValidation, createBooking);
router.get('/', getMyBookings);
router.get('/:id/cancellation-preview', getCancellationPreview);
router.get('/:id/qr', getBookingQR);
router.get('/:id/slip.pdf', getBookingSlipPDF);
router.get('/:id', getBookingById);
router.post('/:id/cancel', cancelBooking);

export default router;
