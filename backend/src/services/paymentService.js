import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import ParkingSlot from '../models/ParkingSlot.js';

/**
 * Initiates a payment session for a booking reservation.
 *
 * @param {string} bookingId - Mongoose ObjectId string of the booking
 * @param {string} userId - Authenticated user's ObjectId
 * @returns {Promise<Object>} Payment session details including redirect URL
 */
export const initiatePayment = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new Error('Booking not found.');
  }

  // Ensure user owns this booking
  if (booking.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized: Booking does not belong to this account.');
  }

  if (booking.paymentStatus === 'PAID' || booking.bookingStatus === 'CONFIRMED') {
    throw new Error('This booking is already paid and confirmed.');
  }

  if (['CANCELLED', 'EXPIRED', 'FAILED', 'COMPLETED'].includes(booking.bookingStatus)) {
    throw new Error(`Cannot pay for a booking that is ${booking.bookingStatus.toLowerCase()}.`);
  }

  // Reject expired booking hold
  if (
    booking.bookingStatus === 'PENDING_PAYMENT' &&
    booking.holdExpiresAt &&
    new Date(booking.holdExpiresAt) < new Date()
  ) {
    booking.bookingStatus = 'EXPIRED';
    await booking.save();
    throw new Error('Booking hold has expired. Please create a new reservation.');
  }

  // Generate unique transaction identifier for the payment gateway session
  const timestamp = Date.now();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const transactionId = `MOCK-TXN-${timestamp}-${randomSuffix}`;

  // Check if a payment record already exists for this booking (due to unique index on bookingId)
  let payment = await Payment.findOne({ bookingId: booking._id });

  if (payment) {
    if (payment.status === 'SUCCESS') {
      throw new Error('Payment has already succeeded for this booking.');
    }
    // Update existing payment session with new transaction ID and refresh PENDING state
    payment.transactionId = transactionId;
    payment.amount = booking.totalAmount;
    payment.status = 'PENDING';
    payment.gateway = 'MOCK';
    payment.gatewayResponse = {};
    payment.paidAt = null;
    await payment.save();
  } else {
    // Create new payment record
    payment = await Payment.create({
      bookingId: booking._id,
      userId: booking.userId,
      transactionId,
      gateway: 'MOCK',
      amount: booking.totalAmount,
      currency: 'BDT',
      status: 'PENDING',
      gatewayResponse: {}
    });
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5555';
  const redirectUrl = `${frontendUrl}/payment/mock?tran_id=${transactionId}&amount=${payment.amount}&bookingId=${booking._id}`;

  return {
    paymentId: payment._id,
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    transactionId: payment.transactionId,
    amount: payment.amount,
    currency: payment.currency,
    gateway: payment.gateway,
    status: payment.status,
    holdExpiresAt: booking.holdExpiresAt,
    redirectUrl
  };
};

/**
 * Verifies and finalizes a payment transaction.
 *
 * @param {string} transactionId - Gateway transaction reference ID
 * @param {string} status - Gateway outcome: 'SUCCESS', 'FAILED', or 'CANCELLED'
 * @param {Object} [gatewayResponse={}] - Raw callback payload from payment gateway
 * @returns {Promise<Object>} Updated payment and booking objects
 */
export const verifyPayment = async (transactionId, status = 'SUCCESS', gatewayResponse = {}) => {
  const payment = await Payment.findOne({ transactionId });

  if (!payment) {
    throw new Error('Payment transaction not found.');
  }

  const booking = await Booking.findById(payment.bookingId);
  if (!booking) {
    throw new Error('Associated booking reservation not found.');
  }

  // Idempotency check: if payment already marked SUCCESS, return current state
  if (payment.status === 'SUCCESS' && booking.bookingStatus === 'CONFIRMED') {
    return { payment, booking };
  }

  if (status === 'SUCCESS') {
    // Check if hold has expired
    if (
      booking.bookingStatus === 'EXPIRED' ||
      (booking.bookingStatus === 'PENDING_PAYMENT' &&
        booking.holdExpiresAt &&
        new Date(booking.holdExpiresAt) < new Date())
    ) {
      booking.bookingStatus = 'EXPIRED';
      payment.status = 'FAILED';
      await Promise.all([booking.save(), payment.save()]);
      throw new Error('Payment rejected: Booking hold has expired.');
    }

    // Cross-verify amount matches booking totalAmount
    if (gatewayResponse.amount && Number(gatewayResponse.amount) !== payment.amount) {
      throw new Error('Payment verification failed: transaction amount mismatch.');
    }

    // 1. Update Payment status
    payment.status = 'SUCCESS';
    payment.paidAt = new Date();
    payment.gatewayResponse = gatewayResponse;
    await payment.save();

    // 2. Resolve slot details for QR generation
    let slotNumber = 'SLOT';
    const slot = await ParkingSlot.findById(booking.slotId);
    if (slot && slot.slotNumber) {
      slotNumber = slot.slotNumber;
    }

    // 3. Update Booking to CONFIRMED + PAID & attach QR code string (bookingNumber ONLY per spec section 24)
    booking.paymentStatus = 'PAID';
    booking.bookingStatus = 'CONFIRMED';
    booking.qrCode = booking.bookingNumber;
    await booking.save();

    return { payment, booking };
  } else {
    const outcomeStatus = status === 'CANCELLED' ? 'CANCELLED' : 'FAILED';
    payment.status = outcomeStatus;
    payment.gatewayResponse = gatewayResponse;
    await payment.save();

    booking.paymentStatus = 'FAILED';
    await booking.save();

    return { payment, booking };
  }
};

/**
 * Simulates mock gateway processing with an asynchronous delay (default 2 seconds).
 *
 * @param {string} transactionId - Gateway transaction reference ID
 * @param {number} [delayMs=2000] - Mock processing delay in milliseconds
 * @returns {Promise<Object>} Result of verifyPayment
 */
export const simulateMockSuccess = async (transactionId, delayMs = 2000) => {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return await verifyPayment(transactionId, 'SUCCESS', {
    gateway: 'MOCK',
    simulated: true,
    val_id: `MOCK-VAL-${Date.now()}`,
    tran_date: new Date().toISOString()
  });
};

export default {
  initiatePayment,
  verifyPayment,
  simulateMockSuccess
};
