/**
 * Smart Parking Management System — Booking & Cancellation Policy Configuration
 */

export const CANCEL_FREE_HOURS = 2;

/**
 * Calculates whether cancellation is permitted and the eligible refund amount according to policy.
 *
 * Rules:
 * 1. Allowed only for CONFIRMED or PENDING_PAYMENT bookings that have not started.
 * 2. If startTime is at least CANCEL_FREE_HOURS (2 hours) away:
 *    - Full refund of base price. Service charge is non-refundable.
 *    - paymentStatus becomes REFUNDED (mock).
 * 3. If startTime is less than CANCEL_FREE_HOURS (2 hours) away:
 *    - Cancellation is allowed, but refundAmount is 0.
 * 4. Never allowed once booking status is ACTIVE or COMPLETED.
 *
 * @param {Object} booking - Populated or raw Mongoose Booking document
 * @param {Date} [now=new Date()] - Reference timestamp for evaluation
 * @returns {{ allowed: boolean, refundAmount: number, message: string }}
 */
export const calculateCancellationRefund = (booking, now = new Date()) => {
  if (!booking) {
    return {
      allowed: false,
      refundAmount: 0,
      message: 'Booking not found.'
    };
  }

  // Never allowed once ACTIVE, COMPLETED, or already CANCELLED/EXPIRED
  if (['ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'].includes(booking.bookingStatus)) {
    return {
      allowed: false,
      refundAmount: 0,
      message: `Cancellation is not permitted for bookings with status ${booking.bookingStatus}.`
    };
  }

  // Allowed only for CONFIRMED or PENDING_PAYMENT
  if (!['CONFIRMED', 'PENDING_PAYMENT'].includes(booking.bookingStatus)) {
    return {
      allowed: false,
      refundAmount: 0,
      message: `Cancellation is not permitted for bookings with status ${booking.bookingStatus}.`
    };
  }

  const startTime = new Date(booking.startTime);
  if (now.getTime() >= startTime.getTime()) {
    return {
      allowed: false,
      refundAmount: 0,
      message: 'Cancellation is not permitted after the scheduled reservation start time.'
    };
  }

  // If pending payment: allowed, 0 refund (no payment captured)
  if (booking.bookingStatus === 'PENDING_PAYMENT') {
    return {
      allowed: true,
      refundAmount: 0,
      message: 'Provisional reservation will be cancelled. No payment was charged.'
    };
  }

  // If CONFIRMED and paid:
  const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilStart >= CANCEL_FREE_HOURS) {
    // Full refund of base rate; service charge is retained
    const refundAmount = Math.max(0, Number(booking.price) || 0);
    const serviceCharge = Number(booking.serviceCharge) || 10;
    return {
      allowed: true,
      refundAmount,
      message: `Full refund of base parking fee (৳${refundAmount}). Service charge (৳${serviceCharge}) is non-refundable.`
    };
  } else {
    return {
      allowed: true,
      refundAmount: 0,
      message: `Cancellation within ${CANCEL_FREE_HOURS} hours of reservation start time is non-refundable (refund: ৳0).`
    };
  }
};

export default {
  CANCEL_FREE_HOURS,
  calculateCancellationRefund
};
