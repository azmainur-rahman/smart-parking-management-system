import mongoose from 'mongoose';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import ParkingLocation from '../models/ParkingLocation.js';
import ParkingSlot from '../models/ParkingSlot.js';
import PricingSetting from '../models/PricingSetting.js';

/**
 * @desc    Get System-Wide Admin Dashboard Overview
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin Only)
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalManagers,
      totalLocations,
      totalSlots,
      occupiedSlots,
      totalBookings,
      activeBookings,
      pendingBookings,
      completedBookings,
      revenueResult,
      recentBookings
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'CUSTOMER' }),
      User.countDocuments({ role: 'MANAGER' }),
      ParkingLocation.countDocuments({ status: 'ACTIVE' }),
      ParkingSlot.countDocuments({ status: { $ne: 'DISABLED' } }),
      Booking.countDocuments({ bookingStatus: 'ACTIVE' }),
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'ACTIVE' }),
      Booking.countDocuments({ bookingStatus: 'PENDING_PAYMENT' }),
      Booking.countDocuments({ bookingStatus: 'COMPLETED' }),
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Booking.find()
        .populate('userId', 'name email phone')
        .populate('locationId', 'name')
        .populate('slotId', 'slotNumber')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    // Calculate occupancy rate
    const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

    // 7-day revenue trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyRevenueAgg = await Payment.aggregate([
      {
        $match: {
          status: 'SUCCESS',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRevenue,
          totalUsers,
          totalCustomers,
          totalManagers,
          totalLocations,
          totalSlots,
          occupiedSlots,
          availableSlots: Math.max(0, totalSlots - occupiedSlots),
          occupancyRate,
          totalBookings,
          activeBookings,
          pendingBookings,
          completedBookings
        },
        dailyTrend: dailyRevenueAgg,
        recentBookings
      }
    });
  } catch (error) {
    console.error('[Admin Controller] getAdminDashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate admin dashboard data: ' + error.message
    });
  }
};

/**
 * @desc    Get Paginated Users List with Filters
 * @route   GET /api/admin/users
 * @access  Private (Admin Only)
 */
export const getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { role, status, q } = req.query;
    const query = {};

    if (role && ['CUSTOMER', 'MANAGER', 'ADMIN'].includes(role.toUpperCase())) {
      query.role = role.toUpperCase();
    }

    if (status && ['ACTIVE', 'BLOCKED', 'SUSPENDED'].includes(status.toUpperCase())) {
      query.status = status.toUpperCase();
    }

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[Admin Controller] getAdminUsers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users: ' + error.message
    });
  }
};

/**
 * @desc    Create User Directly by Admin
 * @route   POST /api/admin/users
 * @access  Private (Admin Only)
 */
export const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, status } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : '',
      role: ['CUSTOMER', 'MANAGER', 'ADMIN'].includes(role) ? role : 'CUSTOMER',
      status: ['ACTIVE', 'BLOCKED', 'SUSPENDED'].includes(status) ? status : 'ACTIVE'
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[Admin Controller] createAdminUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user: ' + error.message
    });
  }
};

/**
 * @desc    Update User Role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (Admin Only)
 */
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['CUSTOMER', 'MANAGER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be CUSTOMER, MANAGER, or ADMIN.'
      });
    }

    // Prevent admin from removing their own admin role
    if (req.user._id.toString() === req.params.id && role !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'You cannot downgrade your own administrative account role.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user
    });
  } catch (error) {
    console.error('[Admin Controller] updateUserRole error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role: ' + error.message
    });
  }
};

/**
 * @desc    Update User Status (Active, Blocked, Suspended)
 * @route   PUT /api/admin/users/:id/status
 * @access  Private (Admin Only)
 */
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['ACTIVE', 'BLOCKED', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be ACTIVE, BLOCKED, or SUSPENDED.'
      });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block or suspend your own account.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `User status changed to ${status}.`,
      user
    });
  } catch (error) {
    console.error('[Admin Controller] updateUserStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status: ' + error.message
    });
  }
};

/**
 * @desc    Get List of Managers & Facility Assignments
 * @route   GET /api/admin/managers
 * @access  Private (Admin Only)
 */
export const getAdminManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'MANAGER' }).select('-password').lean();
    const locations = await ParkingLocation.find({ status: 'ACTIVE' })
      .select('name managerIds address')
      .lean();

    // Map assigned locations to each manager
    const managerList = managers.map((m) => {
      const assignedLocs = locations.filter((loc) =>
        (loc.managerIds || []).some((id) => id.toString() === m._id.toString())
      );
      return {
        ...m,
        assignedLocations: assignedLocs.map((l) => ({ id: l._id, name: l.name }))
      };
    });

    return res.status(200).json({
      success: true,
      managers: managerList,
      locations: locations.map((l) => ({ id: l._id, name: l.name }))
    });
  } catch (error) {
    console.error('[Admin Controller] getAdminManagers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve managers: ' + error.message
    });
  }
};

/**
 * @desc    Assign or Unassign Managers to Parking Location
 * @route   PUT /api/admin/locations/:id/managers
 * @access  Private (Admin Only)
 */
export const updateLocationManagers = async (req, res) => {
  try {
    const { managerIds } = req.body;

    if (!Array.isArray(managerIds)) {
      return res.status(400).json({
        success: false,
        message: 'managerIds must be an array of user IDs.'
      });
    }

    const location = await ParkingLocation.findByIdAndUpdate(
      req.params.id,
      { $set: { managerIds } },
      { new: true }
    ).populate('managerIds', 'name email phone');

    if (!location) {
      return res.status(404).json({ success: false, message: 'Parking location not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Location managers updated successfully.',
      location
    });
  } catch (error) {
    console.error('[Admin Controller] updateLocationManagers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update location managers: ' + error.message
    });
  }
};

/**
 * @desc    Get Global System Bookings
 * @route   GET /api/admin/bookings
 * @access  Private (Admin Only)
 */
export const getAdminBookings = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { status, locationId, q } = req.query;
    const query = {};

    if (status) {
      query.bookingStatus = status.toUpperCase();
    }

    if (locationId && mongoose.Types.ObjectId.isValid(locationId)) {
      query.locationId = locationId;
    }

    if (q && q.trim()) {
      query.bookingNumber = new RegExp(q.trim(), 'i');
    }

    const [total, bookings] = await Promise.all([
      Booking.countDocuments(query),
      Booking.find(query)
        .populate('userId', 'name email phone')
        .populate('locationId', 'name address')
        .populate('slotId', 'slotNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return res.status(200).json({
      success: true,
      bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[Admin Controller] getAdminBookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings: ' + error.message
    });
  }
};

/**
 * @desc    Get Global Payments Ledger
 * @route   GET /api/admin/payments
 * @access  Private (Admin Only)
 */
export const getAdminPayments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { status, gateway, q } = req.query;
    const query = {};

    if (status) {
      query.status = status.toUpperCase();
    }

    if (gateway) {
      query.gateway = gateway.toUpperCase();
    }

    if (q && q.trim()) {
      query.transactionId = new RegExp(q.trim(), 'i');
    }

    const [total, payments, summaryAgg] = await Promise.all([
      Payment.countDocuments(query),
      Payment.find(query)
        .populate('userId', 'name email')
        .populate('bookingId', 'bookingNumber totalAmount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.aggregate([
        {
          $group: {
            _id: '$status',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const summary = {
      totalCollected: 0,
      totalPending: 0,
      totalFailed: 0,
      countSuccess: 0
    };

    summaryAgg.forEach((s) => {
      if (s._id === 'SUCCESS') {
        summary.totalCollected = s.totalAmount;
        summary.countSuccess = s.count;
      } else if (s._id === 'PENDING') {
        summary.totalPending = s.totalAmount;
      } else if (s._id === 'FAILED' || s._id === 'CANCELLED') {
        summary.totalFailed += s.totalAmount;
      }
    });

    return res.status(200).json({
      success: true,
      payments,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[Admin Controller] getAdminPayments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments: ' + error.message
    });
  }
};

/**
 * @desc    Get Pricing Configuration
 * @route   GET /api/admin/pricing
 * @access  Private (Admin Only)
 */
export const getAdminPricing = async (req, res) => {
  try {
    let setting = await PricingSetting.findOne();
    if (!setting) {
      setting = await PricingSetting.create({});
    }

    return res.status(200).json({
      success: true,
      pricing: setting
    });
  } catch (error) {
    console.error('[Admin Controller] getAdminPricing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing settings: ' + error.message
    });
  }
};

/**
 * @desc    Update Pricing Configuration
 * @route   PUT /api/admin/pricing
 * @access  Private (Admin Only)
 */
export const updateAdminPricing = async (req, res) => {
  try {
    const { rates, serviceCharge, freeCancellationHours } = req.body;

    let setting = await PricingSetting.findOne();
    if (!setting) {
      setting = new PricingSetting();
    }

    if (rates) {
      if (rates.hourly) setting.rates.hourly = { ...setting.rates.hourly, ...rates.hourly };
      if (rates.daily) setting.rates.daily = { ...setting.rates.daily, ...rates.daily };
    }

    if (serviceCharge !== undefined) {
      setting.serviceCharge = Number(serviceCharge);
    }

    if (freeCancellationHours !== undefined) {
      setting.freeCancellationHours = Number(freeCancellationHours);
    }

    await setting.save();

    return res.status(200).json({
      success: true,
      message: 'Pricing rules updated successfully.',
      pricing: setting
    });
  } catch (error) {
    console.error('[Admin Controller] updateAdminPricing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update pricing settings: ' + error.message
    });
  }
};

export default {
  getAdminDashboard,
  getAdminUsers,
  createAdminUser,
  updateUserRole,
  updateUserStatus,
  getAdminManagers,
  updateLocationManagers,
  getAdminBookings,
  getAdminPayments,
  getAdminPricing,
  updateAdminPricing
};
