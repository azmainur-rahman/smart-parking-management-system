import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import paymentService from '../services/paymentService.js';

// @desc    Initiate payment session for a booking reservation
// @route   POST /api/payments/initiate
// @access  Private (requireAuth)
export const initiatePayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }

  const { bookingId } = req.body;

  if (!mongoose.isValidObjectId(bookingId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking ID.'
    });
  }

  try {
    const session = await paymentService.initiatePayment(bookingId, req.user._id);

    return res.status(200).json({
      success: true,
      message: 'Payment session initiated successfully.',
      gateway: session.gateway,
      holdExpiresAt: session.holdExpiresAt,
      session
    });
  } catch (error) {
    console.error('[Payment Controller] initiatePayment error:', error.message);
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('Unauthorized')
      ? 403
      : error.message.includes('already paid') || error.message.includes('Cannot pay')
      ? 400
      : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error initiating payment.'
    });
  }
};

// @desc    Handle payment success callback / verification
// @route   POST /api/payments/success
// @access  Private (requireAuth / Gateway IPN)
export const paymentSuccess = async (req, res) => {
  const paymentMode = process.env.PAYMENT_MODE || 'MOCK';
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (paymentMode !== 'MOCK' || nodeEnv === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Mock payment verification is disabled in production or when PAYMENT_MODE is not MOCK.'
    });
  }

  const transactionId =
    req.body.transactionId ||
    req.body.tran_id ||
    req.query.transactionId ||
    req.query.tran_id;

  if (!transactionId) {
    return res.status(400).json({
      success: false,
      message: 'Transaction ID is required.'
    });
  }

  try {
    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment transaction not found.'
      });
    }

    // Access control: Ensure ownership or ADMIN/MANAGER privileges when invoked by authenticated user
    if (req.user) {
      const isOwner = payment.userId.equals(req.user._id);
      const isStaff = ['ADMIN', 'MANAGER'].includes(req.user.role);
      if (!isOwner && !isStaff) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden. You do not own this transaction.'
        });
      }
    }

    // If client requested mock delay simulation, execute 2-second sleep
    const shouldSimulateDelay =
      req.query.simulate === 'true' || req.body.simulate === true;

    let result;
    if (shouldSimulateDelay) {
      result = await paymentService.simulateMockSuccess(transactionId, 2000);
    } else {
      result = await paymentService.verifyPayment(
        transactionId,
        'SUCCESS',
        req.body
      );
    }

    // Populate booking details for rich response
    const populatedBooking = await Booking.findById(result.booking._id)
      .populate('vehicleId', 'brand model registrationNumber vehicleType')
      .populate('locationId', 'name address')
      .populate('floorId', 'name floorNumber')
      .populate('unitId', 'name code')
      .populate('slotId', 'slotNumber');

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully. Booking is now CONFIRMED and PAID.',
      payment: result.payment,
      booking: populatedBooking
    });
  } catch (error) {
    console.error('[Payment Controller] paymentSuccess error:', error.message);
    const statusCode = error.message.includes('not found')
      ? 404
      : error.message.includes('mismatch')
      ? 400
      : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error verifying payment success.'
    });
  }
};

// @desc    Handle payment failure callback
// @route   POST /api/payments/fail
// @access  Private (requireAuth)
export const paymentFailed = async (req, res) => {
  const transactionId =
    req.body.transactionId ||
    req.body.tran_id ||
    req.query.transactionId ||
    req.query.tran_id;

  if (!transactionId) {
    return res.status(400).json({
      success: false,
      message: 'Transaction ID is required.'
    });
  }

  try {
    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment transaction not found.'
      });
    }

    if (req.user) {
      const isOwner = payment.userId.equals(req.user._id);
      const isStaff = ['ADMIN', 'MANAGER'].includes(req.user.role);
      if (!isOwner && !isStaff) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden. You do not own this transaction.'
        });
      }
    }

    const result = await paymentService.verifyPayment(
      transactionId,
      'FAILED',
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Payment has been recorded as failed.',
      payment: result.payment,
      booking: result.booking
    });
  } catch (error) {
    console.error('[Payment Controller] paymentFailed error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error recording payment failure.'
    });
  }
};

// @desc    Get payment record for a given booking ID
// @route   GET /api/payments/booking/:bookingId
// @access  Private (requireAuth)
export const getPaymentByBooking = async (req, res) => {
  const { bookingId } = req.params;

  if (!mongoose.isValidObjectId(bookingId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking ID.'
    });
  }

  try {
    const payment = await Payment.findOne({ bookingId })
      .populate('userId', 'name email phone')
      .populate('bookingId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No payment record found for this booking.'
      });
    }

    // Access control: Ensure ownership or ADMIN/MANAGER privileges
    const isOwner = payment.userId._id.equals(req.user._id);
    const isStaff = ['ADMIN', 'MANAGER'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You do not have permission to view this payment.'
      });
    }

    return res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('[Payment Controller] getPaymentByBooking error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving payment details.'
    });
  }
};

// @desc    Get all payment records for authenticated user
// @route   GET /api/payments
// @access  Private (requireAuth)
export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('bookingId', 'bookingNumber startTime endTime')
      .sort({ createdAt: -1 });

    const formattedPayments = payments.map((p) => ({
      _id: p._id,
      bookingId: p.bookingId ? p.bookingId._id : null,
      bookingNumber: p.bookingId ? p.bookingId.bookingNumber : '—',
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      transactionId: p.transactionId,
      gateway: p.gateway,
      paidAt: p.paidAt,
      createdAt: p.createdAt
    }));

    return res.status(200).json({
      success: true,
      count: formattedPayments.length,
      payments: formattedPayments
    });
  } catch (error) {
    console.error('[Payment Controller] getMyPayments error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving payment transactions.'
    });
  }
};

export default {
  initiatePayment,
  paymentSuccess,
  paymentFailed,
  getPaymentByBooking,
  getMyPayments
};

