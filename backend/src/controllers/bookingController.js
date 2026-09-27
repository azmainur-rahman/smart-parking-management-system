import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import ParkingSlot from '../models/ParkingSlot.js';
import { calculatePrice } from '../utils/calculatePrice.js';
import { generateBookingNumber } from '../utils/generateBookingNumber.js';

// @desc    Check if a slot is available for a time range
// @route   POST /api/bookings/check-availability
// @access  Private (requireAuth)
export const checkAvailability = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }

  const { slotId, startTime, endTime } = req.body;

  if (!mongoose.isValidObjectId(slotId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid parking slot ID.'
    });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date/time format.'
    });
  }

  if (end <= start) {
    return res.status(400).json({
      success: false,
      message: 'End time must be after start time.'
    });
  }

  try {
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found.'
      });
    }

    if (slot.status !== 'AVAILABLE') {
      return res.status(200).json({
        success: true,
        available: false,
        reason: `Slot is currently marked as ${slot.status.toLowerCase()}.`
      });
    }

    const conflicts = await Booking.findOverlappingBookings(slotId, start, end);

    return res.status(200).json({
      success: true,
      available: conflicts.length === 0,
      conflictCount: conflicts.length
    });
  } catch (error) {
    console.error('[Booking Controller] checkAvailability error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking slot availability.'
    });
  }
};

// @desc    Create a new parking reservation
// @route   POST /api/bookings
// @access  Private (requireAuth)
export const createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }

  const { vehicleId, slotId, startTime, endTime, durationType, duration } = req.body;

  if (!mongoose.isValidObjectId(vehicleId) || !mongoose.isValidObjectId(slotId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vehicle ID or parking slot ID.'
    });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date/time format.'
    });
  }

  if (end <= start) {
    return res.status(400).json({
      success: false,
      message: 'End time must be after start time.'
    });
  }

  try {
    // 1. Validate vehicle ownership & status
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      userId: req.user._id,
      status: 'ACTIVE'
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Active vehicle not found or does not belong to your account.'
      });
    }

    // 2. Validate parking slot and vehicle compatibility
    const slot = await ParkingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found.'
      });
    }

    if (slot.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: `Slot ${slot.slotNumber} is currently ${slot.status.toLowerCase()} and cannot be reserved.`
      });
    }

    if (!slot.vehicleTypes.includes(vehicle.vehicleType)) {
      return res.status(400).json({
        success: false,
        message: `Slot ${slot.slotNumber} is not compatible with vehicle type ${vehicle.vehicleType}. Supported types: ${slot.vehicleTypes.join(', ')}.`
      });
    }

    // 3. Detect time overlap
    const conflicts = await Booking.findOverlappingBookings(slotId, start, end);
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This parking slot is already reserved for the requested time frame.'
      });
    }

    // 4. Server-side price calculation (never accept client-sent prices)
    const pricing = calculatePrice({
      vehicleType: vehicle.vehicleType,
      durationType,
      duration,
      locationId: slot.locationId
    });

    // 5. Generate unique booking identifier
    let bookingNumber = generateBookingNumber();
    let collisionCheck = await Booking.findOne({ bookingNumber });
    while (collisionCheck) {
      bookingNumber = generateBookingNumber();
      collisionCheck = await Booking.findOne({ bookingNumber });
    }

    // 6. Create booking record
    const booking = await Booking.create({
      bookingNumber,
      userId: req.user._id,
      vehicleId: vehicle._id,
      locationId: slot.locationId,
      floorId: slot.floorId,
      unitId: slot.unitId,
      slotId: slot._id,
      startTime: start,
      endTime: end,
      durationType: durationType.toUpperCase(),
      duration: Number(duration),
      price: pricing.basePrice,
      serviceCharge: pricing.serviceCharge,
      discount: pricing.discount,
      totalAmount: pricing.total,
      paymentStatus: 'PENDING',
      bookingStatus: 'PENDING_PAYMENT'
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('vehicleId', 'brand model registrationNumber vehicleType')
      .populate('locationId', 'name address')
      .populate('floorId', 'name floorNumber')
      .populate('unitId', 'name code')
      .populate('slotId', 'slotNumber vehicleTypes');

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please proceed to payment.',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('[Booking Controller] createBooking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating booking.'
    });
  }
};

// @desc    Get all bookings for the authenticated user
// @route   GET /api/bookings
// @access  Private (requireAuth)
export const getMyBookings = async (req, res) => {
  try {
    const query = { userId: req.user._id };

    if (req.query.status) {
      query.bookingStatus = req.query.status.toUpperCase();
    }

    const bookings = await Booking.find(query)
      .populate('vehicleId', 'brand model registrationNumber vehicleType')
      .populate('locationId', 'name address')
      .populate('floorId', 'name floorNumber')
      .populate('unitId', 'name code')
      .populate('slotId', 'slotNumber')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('[Booking Controller] getMyBookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving your bookings.'
    });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private (requireAuth)
export const getBookingById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking ID.'
    });
  }

  try {
    const booking = await Booking.findById(id)
      .populate('userId', 'name email phone')
      .populate('vehicleId', 'brand model registrationNumber color vehicleType')
      .populate('locationId', 'name address facilities')
      .populate('floorId', 'name floorNumber')
      .populate('unitId', 'name code')
      .populate('slotId', 'slotNumber position');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Access control: Ensure ownership or ADMIN/MANAGER privileges
    const isOwner = booking.userId._id.equals(req.user._id);
    const isStaff = ['ADMIN', 'MANAGER'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You do not have permission to view this booking.'
      });
    }

    return res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('[Booking Controller] getBookingById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving booking details.'
    });
  }
};

// @desc    Cancel a confirmed or pending booking
// @route   POST /api/bookings/:id/cancel
// @access  Private (requireAuth)
export const cancelBooking = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid booking ID.'
    });
  }

  try {
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    const isOwner = booking.userId.equals(req.user._id);
    const isStaff = ['ADMIN', 'MANAGER'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You cannot cancel this booking.'
      });
    }

    if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(booking.bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: `Booking cannot be cancelled because it is already ${booking.bookingStatus.toLowerCase()}.`
      });
    }

    if (booking.bookingStatus === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Active parking session is currently ongoing and cannot be cancelled.'
      });
    }

    booking.bookingStatus = 'CANCELLED';
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. The slot has been released.',
      booking
    });
  } catch (error) {
    console.error('[Booking Controller] cancelBooking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error cancelling booking.'
    });
  }
};

export default {
  checkAvailability,
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking
};
