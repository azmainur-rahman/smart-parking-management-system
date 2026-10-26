import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import ParkingLocation from '../models/ParkingLocation.js';
import Floor from '../models/Floor.js';
import Unit from '../models/Unit.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Payment from '../models/Payment.js';
import {
  getManagerAllowedLocationIds,
  isLocationAllowed
} from '../middleware/managerScopeMiddleware.js';

/**
 * @desc    Get Manager Dashboard Metrics & Recent Bookings
 * @route   GET /api/manager/dashboard
 * @access  Private (Manager / Admin)
 */
export const getManagerDashboard = async (req, res) => {
  try {
    const allowedLocIds = await getManagerAllowedLocationIds(req.user);

    // Filter condition for locations
    const locationQuery = allowedLocIds === null
      ? { status: 'ACTIVE' }
      : { _id: { $in: allowedLocIds }, status: 'ACTIVE' };

    const assignedLocations = await ParkingLocation.find(locationQuery)
      .select('name address facilities status')
      .lean();

    const activeLocIds = assignedLocations.map((l) => l._id);

    // If manager is not assigned to any active locations
    if (allowedLocIds !== null && activeLocIds.length === 0) {
      return res.status(200).json({
        success: true,
        dashboard: {
          todayBookings: 0,
          activeParking: 0,
          availableSlots: 0,
          todayRevenue: 0,
          assignedLocations: [],
          recentBookings: []
        }
      });
    }

    const bookingLocFilter = { locationId: { $in: activeLocIds } };

    // Define "Today" boundaries in local time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Concurrent aggregations
    const [
      todayBookings,
      activeParking,
      availableSlotsCount,
      todayPaidBookings,
      recentBookings
    ] = await Promise.all([
      // 1. Today's Bookings (created today or starting today)
      Booking.countDocuments({
        ...bookingLocFilter,
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      }),

      // 2. Currently Active Parking sessions
      Booking.countDocuments({
        ...bookingLocFilter,
        bookingStatus: 'ACTIVE'
      }),

      // 3. Available Slots (status === 'AVAILABLE' in assigned locations)
      ParkingSlot.countDocuments({
        locationId: { $in: activeLocIds },
        status: 'AVAILABLE'
      }),

      // 4. Today's Revenue (bookings paid today or created/paid today)
      Booking.find({
        ...bookingLocFilter,
        paymentStatus: 'PAID',
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      }).select('totalAmount price'),

      // 5. Recent Bookings (top 10 newest)
      Booking.find(bookingLocFilter)
        .populate('userId', 'name email phone')
        .populate('vehicleId', 'brand model registrationNumber vehicleType')
        .populate('locationId', 'name address')
        .populate('slotId', 'slotNumber')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    const todayRevenue = todayPaidBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    return res.status(200).json({
      success: true,
      dashboard: {
        todayBookings,
        activeParking,
        availableSlots: Math.max(0, availableSlotsCount - activeParking),
        todayRevenue,
        assignedLocations,
        recentBookings
      }
    });
  } catch (error) {
    console.error('[Manager Controller] getManagerDashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving manager dashboard data.'
    });
  }
};

/**
 * @desc    Get manager assigned active locations (Admin receives all active)
 * @route   GET /api/manager/locations
 * @access  Private (Manager / Admin)
 */
export const getManagerLocations = async (req, res) => {
  try {
    const allowedLocIds = await getManagerAllowedLocationIds(req.user);

    const query = { status: 'ACTIVE' };
    if (allowedLocIds !== null) {
      query._id = { $in: allowedLocIds };
    }

    const locations = await ParkingLocation.find(query)
      .select('name address facilities description status')
      .lean();

    return res.status(200).json({
      success: true,
      count: locations.length,
      locations
    });
  } catch (error) {
    console.error('[Manager Controller] getManagerLocations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving manager locations.'
    });
  }
};

/**
 * @desc    Get filtered bookings across manager-assigned locations
 * @route   GET /api/manager/bookings
 * @access  Private (Manager / Admin)
 */
export const getManagerBookings = async (req, res) => {
  try {
    const allowedLocIds = await getManagerAllowedLocationIds(req.user);
    const { locationId, status, date, q } = req.query;

    const query = {};

    // 1. Enforce location scoping
    if (locationId) {
      if (!mongoose.isValidObjectId(locationId)) {
        return res.status(400).json({ success: false, message: 'Invalid location ID.' });
      }

      const hasAccess = await isLocationAllowed(req.user, locationId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view bookings for this facility.'
        });
      }
      query.locationId = locationId;
    } else {
      if (allowedLocIds !== null) {
        query.locationId = { $in: allowedLocIds };
      }
    }

    // 2. Filter by status
    if (status) {
      query.bookingStatus = status.toUpperCase();
    }

    // 3. Filter by date (YYYY-MM-DD covering startTime)
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      if (!isNaN(startOfDay.getTime())) {
        query.startTime = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    // 4. Search by booking number or customer name/phone
    if (q) {
      const escapedQ = q.trim().slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escapedQ) {
        query.bookingNumber = { $regex: escapedQ, $options: 'i' };
      }
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [total, bookings] = await Promise.all([
      Booking.countDocuments(query),
      Booking.find(query)
        .populate('userId', 'name email phone')
        .populate('vehicleId', 'brand model registrationNumber vehicleType color')
        .populate('locationId', 'name address')
        .populate('floorId', 'name floorNumber')
        .populate('unitId', 'name code')
        .populate('slotId', 'slotNumber')
        .populate('entryManager', 'name email')
        .populate('exitManager', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      total,
      count: bookings.length,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      bookings
    });
  } catch (error) {
    console.error('[Manager Controller] getManagerBookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving manager bookings.'
    });
  }
};

/**
 * @desc    Get slot inventory for manager assigned locations
 * @route   GET /api/manager/slots
 * @access  Private (Manager / Admin)
 */
export const getManagerSlots = async (req, res) => {
  try {
    const allowedLocIds = await getManagerAllowedLocationIds(req.user);
    const { locationId, floorId, unitId } = req.query;

    const query = {};

    if (locationId) {
      if (!mongoose.isValidObjectId(locationId)) {
        return res.status(400).json({ success: false, message: 'Invalid location ID.' });
      }
      const hasAccess = await isLocationAllowed(req.user, locationId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view slots for this facility.'
        });
      }
      query.locationId = locationId;
    } else {
      if (allowedLocIds !== null) {
        query.locationId = { $in: allowedLocIds };
      }
    }

    if (floorId && mongoose.isValidObjectId(floorId)) {
      query.floorId = floorId;
    }

    if (unitId && mongoose.isValidObjectId(unitId)) {
      query.unitId = unitId;
    }

    const slots = await ParkingSlot.find(query)
      .populate('locationId', 'name address')
      .populate('floorId', 'name floorNumber')
      .populate('unitId', 'name code')
      .sort({ slotNumber: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: slots.length,
      slots
    });
  } catch (error) {
    console.error('[Manager Controller] getManagerSlots error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving parking slots.'
    });
  }
};

/**
 * @desc    Change slot operational status (AVAILABLE, DISABLED, MAINTENANCE)
 * @route   PUT /api/manager/slots/:id
 * @access  Private (Manager / Admin)
 */
export const updateSlotStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: 'Invalid slot ID.' });
  }

  const validStatuses = ['AVAILABLE', 'DISABLED', 'MAINTENANCE'];
  const normStatus = (status || '').toUpperCase();

  if (!validStatuses.includes(normStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be one of: AVAILABLE, DISABLED, MAINTENANCE.'
    });
  }

  try {
    const slot = await ParkingSlot.findById(id);

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found.' });
    }

    // Verify manager is assigned to this slot's location
    const hasAccess = await isLocationAllowed(req.user, slot.locationId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to modify slots at this location.'
      });
    }

    slot.status = normStatus;
    await slot.save();

    const populatedSlot = await ParkingSlot.findById(slot._id)
      .populate('locationId', 'name')
      .populate('floorId', 'name floorNumber')
      .populate('unitId', 'name code');

    return res.status(200).json({
      success: true,
      message: `Slot ${slot.slotNumber} status updated to ${normStatus}.`,
      slot: populatedSlot
    });
  } catch (error) {
    console.error('[Manager Controller] updateSlotStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating parking slot status.'
    });
  }
};

/**
 * @desc    Verify booking by booking number / QR payload
 * @route   POST /api/manager/verify-qr
 * @access  Private (Manager / Admin)
 */
export const verifyBookingQR = async (req, res) => {
  const { bookingNumber } = req.body;

  if (!bookingNumber || typeof bookingNumber !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Booking number is required.'
    });
  }

  try {
    const booking = await Booking.findOne({
      bookingNumber: bookingNumber.trim()
    })
      .populate('userId', 'name email phone')
      .populate('vehicleId', 'brand model registrationNumber vehicleType color')
      .populate('locationId', 'name address')
      .populate('floorId', 'name floorNumber')
      .populate('unitId', 'name code')
      .populate('slotId', 'slotNumber position')
      .populate('entryManager', 'name')
      .populate('exitManager', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking reservation not found.'
      });
    }

    // Ensure manager has access to this booking's location
    const hasAccess = await isLocationAllowed(req.user, booking.locationId._id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to manage the facility for this booking.'
      });
    }

    // Evaluate allowed entry window: 30 minutes before startTime through endTime
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const windowStart = new Date(startTime.getTime() - 30 * 60 * 1000);
    const windowEnd = endTime;

    const isWithinWindow = now >= windowStart && now <= windowEnd;
    const validNow = isWithinWindow && (booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'ACTIVE');

    return res.status(200).json({
      success: true,
      validNow,
      isWithinWindow,
      window: {
        windowStart,
        windowEnd,
        startTime,
        endTime
      },
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        customer: booking.userId ? { name: booking.userId.name, email: booking.userId.email, phone: booking.userId.phone } : null,
        vehicle: booking.vehicleId ? { brand: booking.vehicleId.brand, model: booking.vehicleId.model, registrationNumber: booking.vehicleId.registrationNumber, vehicleType: booking.vehicleId.vehicleType } : null,
        location: booking.locationId ? { _id: booking.locationId._id, name: booking.locationId.name, address: booking.locationId.address } : null,
        floor: booking.floorId ? { name: booking.floorId.name } : null,
        unit: booking.unitId ? { name: booking.unitId.name, code: booking.unitId.code } : null,
        slot: booking.slotId ? { slotNumber: booking.slotId.slotNumber } : null,
        schedule: {
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          durationType: booking.durationType
        },
        pricing: {
          totalAmount: booking.totalAmount,
          paymentStatus: booking.paymentStatus
        },
        status: booking.bookingStatus,
        entryTime: booking.entryTime,
        exitTime: booking.exitTime,
        entryManager: booking.entryManager ? booking.entryManager.name : null,
        exitManager: booking.exitManager ? booking.exitManager.name : null
      }
    });
  } catch (error) {
    console.error('[Manager Controller] verifyBookingQR error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error verifying booking reservation.'
    });
  }
};

/**
 * @desc    Record vehicle entry into parking facility
 * @route   POST /api/manager/entry
 * @access  Private (Manager / Admin)
 */
export const recordEntry = async (req, res) => {
  const { bookingNumber } = req.body;

  if (!bookingNumber || typeof bookingNumber !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Booking number is required.'
    });
  }

  try {
    const booking = await Booking.findOne({ bookingNumber: bookingNumber.trim() })
      .populate('userId', 'name phone')
      .populate('vehicleId', 'brand model registrationNumber')
      .populate('locationId', 'name')
      .populate('slotId', 'slotNumber');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking reservation not found.'
      });
    }

    // Access check
    const hasAccess = await isLocationAllowed(req.user, booking.locationId._id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not manage the facility for this reservation.'
      });
    }

    // Rule: Booking must be CONFIRMED
    if (booking.bookingStatus === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle has already entered and session is currently ACTIVE.'
      });
    }

    if (booking.bookingStatus !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: `Cannot check in booking. Current status is ${booking.bookingStatus}. Status must be CONFIRMED.`
      });
    }

    // Rule: Entry window is 30 minutes before startTime through endTime
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const windowStart = new Date(startTime.getTime() - 30 * 60 * 1000);

    if (now < windowStart) {
      const minutesEarly = Math.ceil((windowStart.getTime() - now.getTime()) / (1000 * 60));
      return res.status(400).json({
        success: false,
        message: `Entry too early. The allowable entry window opens 30 minutes before reservation start time (in ${minutesEarly} minutes).`
      });
    }

    if (now > endTime) {
      return res.status(400).json({
        success: false,
        message: 'Entry window has expired. The reservation scheduled end time has already elapsed.'
      });
    }

    // Record entry
    booking.entryTime = now;
    booking.entryManager = req.user._id;
    booking.bookingStatus = 'ACTIVE';
    await booking.save();

    return res.status(200).json({
      success: true,
      message: `Vehicle entry confirmed for bay ${booking.slotId ? booking.slotId.slotNumber : ''}. Session is now ACTIVE.`,
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.bookingStatus,
        entryTime: booking.entryTime,
        entryManagerName: req.user.name,
        slotNumber: booking.slotId ? booking.slotId.slotNumber : '—',
        vehicleRegistration: booking.vehicleId ? booking.vehicleId.registrationNumber : '—',
        customerName: booking.userId ? booking.userId.name : '—'
      }
    });
  } catch (error) {
    console.error('[Manager Controller] recordEntry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error recording vehicle entry.'
    });
  }
};

/**
 * @desc    Record vehicle exit from parking facility
 * @route   POST /api/manager/exit
 * @access  Private (Manager / Admin)
 */
export const recordExit = async (req, res) => {
  const { bookingNumber } = req.body;

  if (!bookingNumber || typeof bookingNumber !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Booking number is required.'
    });
  }

  try {
    const booking = await Booking.findOne({ bookingNumber: bookingNumber.trim() })
      .populate('userId', 'name phone')
      .populate('vehicleId', 'brand model registrationNumber')
      .populate('locationId', 'name')
      .populate('slotId', 'slotNumber');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking reservation not found.'
      });
    }

    // Access check
    const hasAccess = await isLocationAllowed(req.user, booking.locationId._id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not manage the facility for this reservation.'
      });
    }

    // Rule: Booking must be ACTIVE
    if (booking.bookingStatus === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle exit has already been finalized for this reservation.'
      });
    }

    if (booking.bookingStatus !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Cannot record exit. Booking status must be ACTIVE, but is currently ${booking.bookingStatus}.`
      });
    }

    const exitTime = new Date();
    booking.exitTime = exitTime;
    booking.exitManager = req.user._id;
    booking.bookingStatus = 'COMPLETED';
    await booking.save();

    const entryTime = new Date(booking.entryTime || booking.startTime);
    const durationMinutes = Math.max(1, Math.round((exitTime.getTime() - entryTime.getTime()) / (1000 * 60)));
    const durationHours = (durationMinutes / 60).toFixed(1);

    return res.status(200).json({
      success: true,
      message: `Vehicle exit completed successfully. Total duration: ${durationMinutes} minutes (${durationHours} hrs).`,
      actualDurationMinutes: durationMinutes,
      booking: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.bookingStatus,
        entryTime: booking.entryTime,
        exitTime: booking.exitTime,
        exitManagerName: req.user.name,
        actualDurationMinutes: durationMinutes,
        slotNumber: booking.slotId ? booking.slotId.slotNumber : '—',
        vehicleRegistration: booking.vehicleId ? booking.vehicleId.registrationNumber : '—',
        customerName: booking.userId ? booking.userId.name : '—'
      }
    });
  } catch (error) {
    console.error('[Manager Controller] recordExit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error recording vehicle exit.'
    });
  }
};

/**
 * @desc    Get manager analytical summary report
 * @route   GET /api/manager/reports/summary
 * @access  Private (Manager / Admin)
 */
export const getManagerReportsSummary = async (req, res) => {
  try {
    const allowedLocIds = await getManagerAllowedLocationIds(req.user);
    const { locationId, from, to } = req.query;

    const query = {};

    if (locationId) {
      if (!mongoose.isValidObjectId(locationId)) {
        return res.status(400).json({ success: false, message: 'Invalid location ID.' });
      }
      const hasAccess = await isLocationAllowed(req.user, locationId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to view reports for this facility.'
        });
      }
      query.locationId = locationId;
    } else {
      if (allowedLocIds !== null) {
        query.locationId = { $in: allowedLocIds };
      }
    }

    // Date range filter on createdAt
    if (from || to) {
      query.createdAt = {};
      if (from) {
        const fromDate = new Date(`${from}T00:00:00.000Z`);
        if (!isNaN(fromDate.getTime())) query.createdAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(`${to}T23:59:59.999Z`);
        if (!isNaN(toDate.getTime())) query.createdAt.$lte = toDate;
      }
    }

    const slotLocFilter = query.locationId
      ? { locationId: query.locationId }
      : (allowedLocIds !== null ? { locationId: { $in: allowedLocIds } } : {});

    const [
      totalBookings,
      confirmedCount,
      activeCount,
      completedCount,
      cancelledCount,
      paidBookings,
      availableSlotsCount,
      occupiedSlotsCount
    ] = await Promise.all([
      Booking.countDocuments(query),
      Booking.countDocuments({ ...query, bookingStatus: 'CONFIRMED' }),
      Booking.countDocuments({ ...query, bookingStatus: 'ACTIVE' }),
      Booking.countDocuments({ ...query, bookingStatus: 'COMPLETED' }),
      Booking.countDocuments({ ...query, bookingStatus: { $in: ['CANCELLED', 'EXPIRED'] } }),
      Booking.find({ ...query, paymentStatus: 'PAID' }).select('totalAmount'),
      ParkingSlot.countDocuments({ ...slotLocFilter, status: 'AVAILABLE' }),
      Booking.countDocuments({ ...slotLocFilter, bookingStatus: 'ACTIVE' })
    ]);

    const revenue = paidBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const summaryData = {
      totalBookings,
      confirmed: confirmedCount,
      active: activeCount,
      completed: completedCount,
      cancelled: cancelledCount,
      revenue,
      occupiedSlots: occupiedSlotsCount,
      availableSlots: Math.max(0, availableSlotsCount - occupiedSlotsCount)
    };

    return res.status(200).json({
      success: true,
      summary: summaryData,
      report: summaryData
    });
  } catch (error) {
    console.error('[Manager Controller] getManagerReportsSummary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error generating manager summary report.'
    });
  }
};

export default {
  getManagerDashboard,
  getManagerLocations,
  getManagerBookings,
  getManagerSlots,
  updateSlotStatus,
  verifyBookingQR,
  recordEntry,
  recordExit,
  getManagerReportsSummary
};
