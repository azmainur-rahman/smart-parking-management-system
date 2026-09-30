import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Payment from '../models/Payment.js';
import { calculatePrice } from '../utils/calculatePrice.js';
import { generateBookingNumber } from '../utils/generateBookingNumber.js';
import { calculateCancellationRefund } from '../config/policy.js';

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

// @desc    Get pricing quote and check vehicle-slot compatibility/availability
// @route   POST /api/bookings/quote
// @access  Private (requireAuth)
export const quoteBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }

  const { vehicleId, slotId, startTime, durationType, duration } = req.body;

  if (!mongoose.isValidObjectId(vehicleId) || !mongoose.isValidObjectId(slotId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vehicle ID or parking slot ID.'
    });
  }

  const start = new Date(startTime);
  if (isNaN(start.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid start time format.'
    });
  }

  const normDurationType = (durationType || 'HOURLY').toUpperCase();
  const numDuration = Math.max(1, Number(duration) || 1);

  const durationMs = normDurationType === 'HOURLY'
    ? numDuration * 60 * 60 * 1000
    : numDuration * 24 * 60 * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);

  try {
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      userId: req.user._id,
      status: 'ACTIVE'
    });

    const slot = await ParkingSlot.findById(slotId);

    let available = true;
    let reason = null;

    if (!vehicle) {
      available = false;
      reason = 'Active vehicle not found.';
    } else if (!slot) {
      available = false;
      reason = 'Parking slot not found.';
    } else if (slot.status !== 'AVAILABLE') {
      available = false;
      reason = `Slot is currently ${slot.status.toLowerCase()}.`;
    } else if (!slot.vehicleTypes.includes(vehicle.vehicleType)) {
      available = false;
      reason = `Slot does not support vehicle type ${vehicle.vehicleType}. Supported types: ${slot.vehicleTypes.join(', ')}.`;
    } else {
      const conflicts = await Booking.findOverlappingBookings(slotId, start, end);
      if (conflicts.length > 0) {
        available = false;
        reason = 'This parking slot is already booked for the requested time frame.';
      }
    }

    const vehicleType = vehicle ? vehicle.vehicleType : 'CAR';
    const pricing = calculatePrice({
      vehicleType,
      durationType: normDurationType,
      duration: numDuration
    });

    return res.status(200).json({
      success: true,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      price: pricing.basePrice,
      serviceCharge: pricing.serviceCharge,
      discount: pricing.discount,
      totalAmount: pricing.total,
      ratePerUnit: pricing.unitRate,
      available,
      reason
    });
  } catch (error) {
    console.error('[Booking Controller] quoteBooking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error generating booking quote.'
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

  const { vehicleId, slotId, startTime, durationType, duration } = req.body;

  if (!mongoose.isValidObjectId(vehicleId) || !mongoose.isValidObjectId(slotId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vehicle ID or parking slot ID.'
    });
  }

  const start = new Date(startTime);
  if (isNaN(start.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid start time format.'
    });
  }

  // Reject startTime in the past (5 minute grace)
  const now = new Date();
  if (start.getTime() < now.getTime() - 5 * 60 * 1000) {
    return res.status(400).json({
      success: false,
      message: 'Reservation start time cannot be in the past.'
    });
  }

  const normDurationType = (durationType || '').toUpperCase();
  if (!['HOURLY', 'DAILY'].includes(normDurationType)) {
    return res.status(400).json({
      success: false,
      message: 'Duration type must be HOURLY or DAILY.'
    });
  }

  const numDuration = Number(duration);
  if (!Number.isInteger(numDuration)) {
    return res.status(400).json({
      success: false,
      message: 'Duration must be an integer.'
    });
  }

  if (normDurationType === 'HOURLY' && (numDuration < 1 || numDuration > 24)) {
    return res.status(400).json({
      success: false,
      message: 'Hourly duration must be an integer between 1 and 24 hours.'
    });
  }

  if (normDurationType === 'DAILY' && (numDuration < 1 || numDuration > 30)) {
    return res.status(400).json({
      success: false,
      message: 'Daily duration must be an integer between 1 and 30 days.'
    });
  }

  // Compute endTime = startTime + duration (HOURLY: hours, DAILY: days*24h). Client endTime and price are ignored.
  const durationMs = normDurationType === 'HOURLY'
    ? numDuration * 60 * 60 * 1000
    : numDuration * 24 * 60 * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);

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

    // 6. Create booking record with 10-minute hold window
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
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
      bookingStatus: 'PENDING_PAYMENT',
      holdExpiresAt
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
    const now = new Date();
    const query = { userId: req.user._id };

    // Search by bookingNumber if q provided
    if (req.query.q) {
      const escapedQ = req.query.q.trim().slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escapedQ) {
        query.bookingNumber = { $regex: escapedQ, $options: 'i' };
      }
    }

    // Status filter
    if (req.query.status) {
      const statusParam = req.query.status.toUpperCase();
      if (statusParam === 'UPCOMING') {
        query.bookingStatus = { $in: ['CONFIRMED', 'PENDING_PAYMENT'] };
        query.startTime = { $gt: now };
      } else if (statusParam === 'ACTIVE') {
        query.bookingStatus = 'ACTIVE';
      } else if (statusParam === 'COMPLETED') {
        query.bookingStatus = 'COMPLETED';
      } else if (statusParam === 'CANCELLED') {
        query.bookingStatus = { $in: ['CANCELLED', 'EXPIRED'] };
      } else if (statusParam !== 'ALL') {
        query.bookingStatus = statusParam;
      }
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Counts for filter tabs (All, Upcoming, Active, Completed, Cancelled)
    const [totalMatching, totalAll, totalUpcoming, totalActive, totalCompleted, totalCancelled] =
      await Promise.all([
        Booking.countDocuments(query),
        Booking.countDocuments({ userId: req.user._id }),
        Booking.countDocuments({
          userId: req.user._id,
          bookingStatus: { $in: ['CONFIRMED', 'PENDING_PAYMENT'] },
          startTime: { $gt: now }
        }),
        Booking.countDocuments({ userId: req.user._id, bookingStatus: 'ACTIVE' }),
        Booking.countDocuments({ userId: req.user._id, bookingStatus: 'COMPLETED' }),
        Booking.countDocuments({
          userId: req.user._id,
          bookingStatus: { $in: ['CANCELLED', 'EXPIRED'] }
        })
      ]);

    const bookings = await Booking.find(query)
      .populate('vehicleId', 'brand model registrationNumber vehicleType')
      .populate('locationId', 'name address')
      .populate('floorId', 'name floorNumber')
      .populate('unitId', 'name code')
      .populate('slotId', 'slotNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      total: totalMatching,
      count: bookings.length,
      page,
      totalPages: Math.ceil(totalMatching / limit) || 1,
      counts: {
        all: totalAll,
        upcoming: totalUpcoming,
        active: totalActive,
        completed: totalCompleted,
        cancelled: totalCancelled
      },
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

// @desc    Get cancellation preview (allowed, refund amount, policy explanation)
// @route   GET /api/bookings/:id/cancellation-preview
// @access  Private (requireAuth)
export const getCancellationPreview = async (req, res) => {
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
        message: 'Access forbidden. You cannot preview cancellation for this booking.'
      });
    }

    const preview = calculateCancellationRefund(booking);

    return res.status(200).json({
      success: true,
      allowed: preview.allowed,
      refundAmount: preview.refundAmount,
      message: preview.message
    });
  } catch (error) {
    console.error('[Booking Controller] getCancellationPreview error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error calculating cancellation preview.'
    });
  }
};

// @desc    Cancel a confirmed or pending booking per cancellation policy
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

    const policyResult = calculateCancellationRefund(booking);
    if (!policyResult.allowed) {
      return res.status(400).json({
        success: false,
        message: policyResult.message
      });
    }

    booking.bookingStatus = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.cancelReason = req.body.reason || req.body.cancelReason || 'Cancelled by customer';
    booking.refundAmount = policyResult.refundAmount;

    if (booking.paymentStatus === 'PAID' && policyResult.refundAmount > 0) {
      booking.paymentStatus = 'REFUNDED';
    }

    await booking.save();

    // If an associated Payment record exists, update its status
    await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      { status: 'CANCELLED' }
    );

    return res.status(200).json({
      success: true,
      message: policyResult.message || 'Booking cancelled successfully. The slot has been released.',
      refundAmount: policyResult.refundAmount,
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

// @desc    Get booking QR code data URL (PNG)
// @route   GET /api/bookings/:id/qr
// @access  Private (requireAuth)
export const getBookingQR = async (req, res) => {
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
        message: 'Access forbidden. You do not have permission to view this QR code.'
      });
    }

    // Spec Section 24: QR payload = bookingNumber ONLY
    const payload = booking.qrCode || booking.bookingNumber;
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300
    });

    return res.status(200).json({
      success: true,
      payload,
      dataUrl
    });
  } catch (error) {
    console.error('[Booking Controller] getBookingQR error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error generating QR code.'
    });
  }
};

// @desc    Stream printable booking slip PDF per spec section 23
// @route   GET /api/bookings/:id/slip.pdf
// @access  Private (requireAuth, PAID only)
export const getBookingSlipPDF = async (req, res) => {
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
      .populate('locationId', 'name address')
      .populate('floorId', 'name floorNumber')
      .populate('unitId', 'name code')
      .populate('slotId', 'slotNumber');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    const isOwner = booking.userId._id.equals(req.user._id);
    const isStaff = ['ADMIN', 'MANAGER'].includes(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You cannot view this booking slip.'
      });
    }

    if (booking.paymentStatus !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Booking slip is available only for paid reservations.'
      });
    }

    // Spec Section 24: QR code contains bookingNumber ONLY
    const qrBuffer = await QRCode.toBuffer(booking.bookingNumber, {
      margin: 1,
      width: 130
    });

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="booking-slip-${booking.bookingNumber}.pdf"`
    );

    doc.pipe(res);

    // Format Dates
    const sDate = new Date(booking.startTime);
    const eDate = new Date(booking.endTime);
    const dateFormatted = sDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeFormatted = `${sDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })} - ${eDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`;

    const customerName = booking.userId?.name || 'Customer';
    const vehicleName = `${booking.vehicleId?.brand || ''} ${booking.vehicleId?.model || ''}`.trim() || 'Vehicle';
    const regNum = booking.vehicleId?.registrationNumber || 'N/A';
    const locationName = booking.locationId?.name || 'Facility';
    const floorName = booking.floorId?.name || 'Floor';
    const unitName = booking.unitId ? `${booking.unitId.name} (${booking.unitId.code || ''})` : 'Unit';
    const slotNumber = booking.slotId?.slotNumber || 'Slot';

    // Layout per Spec Section 23
    const pageWidth = doc.page.width;
    const boxWidth = 360;
    const startX = (pageWidth - boxWidth) / 2;
    let y = 60;

    // Header
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#111111')
      .text('SMART PARKING', startX, y, { width: boxWidth, align: 'center' });
    y += 22;

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#333333')
      .text('BOOKING RECEIPT', startX, y, { width: boxWidth, align: 'center' });
    y += 26;

    // Horizontal Divider
    doc
      .moveTo(startX, y)
      .lineTo(startX + boxWidth, y)
      .strokeColor('#555555')
      .lineWidth(1)
      .stroke();
    y += 18;

    // Helper row drawer
    const drawRow = (label, value) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#555555')
        .text(label, startX + 8, y);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#111111')
        .text(String(value), startX + 130, y, {
          width: boxWidth - 138,
          align: 'left'
        });
      y += 18;
    };

    drawRow('Booking ID:', booking.bookingNumber);
    drawRow('Customer:', customerName);
    drawRow('Vehicle:', vehicleName);
    drawRow('Registration:', regNum);
    drawRow('Parking:', locationName);
    drawRow('Floor:', floorName);
    drawRow('Unit:', unitName);
    drawRow('Slot:', slotNumber);
    drawRow('Date:', dateFormatted);
    drawRow('Time:', timeFormatted);
    // Currency in PDF MUST write "BDT" per instructions (built-in fonts lack ৳)
    drawRow('Amount:', `BDT ${booking.totalAmount}`);
    drawRow('Payment:', 'PAID');

    y += 6;

    // Horizontal Divider
    doc
      .moveTo(startX, y)
      .lineTo(startX + boxWidth, y)
      .strokeColor('#555555')
      .lineWidth(1)
      .stroke();
    y += 16;

    // QR Image Centered
    const qrX = (pageWidth - 130) / 2;
    doc.image(qrBuffer, qrX, y, { width: 130 });
    y += 138;

    // "Scan to verify booking"
    doc
      .font('Helvetica-Oblique')
      .fontSize(10)
      .fillColor('#555555')
      .text('Scan to verify booking', startX, y, { width: boxWidth, align: 'center' });
    y += 20;

    // Horizontal Divider
    doc
      .moveTo(startX, y)
      .lineTo(startX + boxWidth, y)
      .strokeColor('#555555')
      .lineWidth(1)
      .stroke();

    doc.end();
  } catch (error) {
    console.error('[Booking Controller] getBookingSlipPDF error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Server error generating booking slip PDF.'
      });
    }
  }
};

export default {
  checkAvailability,
  quoteBooking,
  createBooking,
  getMyBookings,
  getBookingById,
  getCancellationPreview,
  cancelBooking,
  getBookingQR,
  getBookingSlipPDF
};

