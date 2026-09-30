import mongoose from 'mongoose';
import { generateQRCode } from '../utils/generateQRCode.js';

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: [true, 'Booking number is required'],
      unique: true,
      trim: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required']
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLocation',
      required: [true, 'Parking Location ID is required']
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor',
      required: [true, 'Floor ID is required']
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: [true, 'Unit ID is required']
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
      required: [true, 'Parking Slot ID is required'],
      index: true
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    durationType: {
      type: String,
      enum: ['HOURLY', 'DAILY'],
      required: [true, 'Duration type is required']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1']
    },
    price: {
      type: Number,
      required: [true, 'Base price is required']
    },
    serviceCharge: {
      type: Number,
      default: 10
    },
    discount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required']
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    bookingStatus: {
      type: String,
      enum: [
        'PENDING_PAYMENT',
        'CONFIRMED',
        'ACTIVE',
        'COMPLETED',
        'CANCELLED',
        'EXPIRED'
      ],
      default: 'PENDING_PAYMENT'
    },
    qrCode: {
      type: String,
      default: ''
    },
    entryTime: {
      type: Date,
      default: null
    },
    entryManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    exitTime: {
      type: Date,
      default: null
    },
    exitManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    holdExpiresAt: {
      type: Date,
      default: null,
      index: true
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    cancelReason: {
      type: String,
      default: ''
    },
    refundAmount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound index for high-speed slot overlap verification
bookingSchema.index({ slotId: 1, startTime: 1, endTime: 1 });

/**
 * Static method: Detect overlapping bookings for a given slot.
 * A conflict occurs when:
 *   existing.startTime < requested.endTime AND existing.endTime > requested.startTime
 * Excludes cancelled, expired, or failed bookings, and ignores PENDING_PAYMENT bookings whose hold has expired.
 */
bookingSchema.statics.findOverlappingBookings = function (
  slotId,
  startTime,
  endTime,
  excludeBookingId = null
) {
  const now = new Date();
  const query = {
    slotId,
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) },
    bookingStatus: {
      $nin: ['CANCELLED', 'EXPIRED', 'FAILED']
    },
    $nor: [
      {
        bookingStatus: 'PENDING_PAYMENT',
        holdExpiresAt: { $lt: now }
      }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return this.find(query);
};

bookingSchema.methods.generateQRPayload = function () {
  // Spec Section 24: QR payload = bookingNumber ONLY
  return this.bookingNumber;
};

bookingSchema.virtual('qrPayload').get(function () {
  // Spec Section 24: QR payload = bookingNumber ONLY
  return this.bookingNumber;
});

bookingSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
