import mongoose from 'mongoose';
import ParkingLocation from '../models/ParkingLocation.js';
import Floor from '../models/Floor.js';
import Unit from '../models/Unit.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Booking from '../models/Booking.js';

// Helper: Normalize query booking window
const resolveBookingWindow = (query) => {
  const { startTime, endTime } = query;
  let start = startTime ? new Date(startTime) : new Date();
  let end = endTime ? new Date(endTime) : new Date(Date.now() + 60 * 60 * 1000);

  if (isNaN(start.getTime())) start = new Date();
  if (isNaN(end.getTime()) || end <= start) end = new Date(start.getTime() + 60 * 60 * 1000);

  return { start, end };
};

// Helper: Find active overlapping booking slot IDs for a set of slots within a window
const findBookedSlotIds = async (slotIds, start, end) => {
  if (!slotIds || slotIds.length === 0) return new Set();

  const now = new Date();
  const overlapping = await Booking.find({
    slotId: { $in: slotIds },
    startTime: { $lt: end },
    endTime: { $gt: start },
    bookingStatus: { $nin: ['CANCELLED', 'EXPIRED', 'FAILED'] },
    $nor: [
      {
        bookingStatus: 'PENDING_PAYMENT',
        holdExpiresAt: { $lt: now }
      }
    ]
  }).select('slotId');

  return new Set(overlapping.map((b) => b.slotId.toString()));
};

// Helper: Escape special regex characters
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// @desc    Get all active parking locations with totalSlots, availableSlots, and fromPrice
// @route   GET /api/public/locations
// @access  Public
export const getPublicLocations = async (req, res) => {
  try {
    const { q, startTime, endTime } = req.query;
    const vehicleType = req.query.vehicleType ? req.query.vehicleType.toUpperCase() : null;

    const locationFilter = { status: 'ACTIVE' };
    if (q && q.trim()) {
      const sanitizedQ = escapeRegex(q.trim().slice(0, 50));
      const regex = new RegExp(sanitizedQ, 'i');
      locationFilter.$or = [
        { name: regex },
        { 'address.area': regex },
        { 'address.city': regex },
        { 'address.addressLine': regex }
      ];
    }

    const locations = await ParkingLocation.find(locationFilter).lean();
    const locIds = locations.map((loc) => loc._id);

    // 1. Total slot counts per location (all slots regardless of filters)
    const slotCounts = await ParkingSlot.aggregate([
      { $match: { locationId: { $in: locIds } } },
      { $group: { _id: '$locationId', totalSlots: { $sum: 1 } } }
    ]);

    const totalCountMap = new Map();
    slotCounts.forEach((item) => {
      totalCountMap.set(item._id.toString(), item.totalSlots);
    });

    // 2. Available slots calculation
    const hasWindow = Boolean(startTime || endTime);
    const slotFilter = {
      locationId: { $in: locIds },
      status: 'AVAILABLE'
    };
    if (vehicleType) {
      slotFilter.vehicleTypes = vehicleType;
    }

    const candidateSlots = await ParkingSlot.find(slotFilter)
      .select('_id locationId status vehicleTypes')
      .lean();

    const availableCountMap = new Map();
    locIds.forEach((id) => availableCountMap.set(id.toString(), 0));

    if (hasWindow) {
      const { start, end } = resolveBookingWindow(req.query);
      const slotIds = candidateSlots.map((s) => s._id);
      const bookedIds = await findBookedSlotIds(slotIds, start, end);

      candidateSlots.forEach((slot) => {
        if (slot.status === 'AVAILABLE' && !bookedIds.has(slot._id.toString())) {
          const locKey = slot.locationId.toString();
          availableCountMap.set(locKey, (availableCountMap.get(locKey) || 0) + 1);
        }
      });
    } else {
      // Without a window, availableSlots counts only status 'AVAILABLE' (exclude MAINTENANCE and DISABLED)
      candidateSlots.forEach((slot) => {
        if (slot.status === 'AVAILABLE') {
          const locKey = slot.locationId.toString();
          availableCountMap.set(locKey, (availableCountMap.get(locKey) || 0) + 1);
        }
      });
    }

    // Lowest hourly rate across vehicle types is 30 BDT (Motorcycle)
    const fromPrice = 30;

    const data = locations.map((loc) => ({
      _id: loc._id,
      name: loc.name,
      address: loc.address,
      description: loc.description,
      images: loc.images,
      facilities: loc.facilities,
      status: loc.status,
      totalSlots: totalCountMap.get(loc._id.toString()) || 0,
      availableSlots: availableCountMap.get(loc._id.toString()) || 0,
      fromPrice
    }));

    const response = {
      success: true,
      count: data.length,
      locations: data
    };

    if (hasWindow) {
      const { start, end } = resolveBookingWindow(req.query);
      response.window = { startTime: start.toISOString(), endTime: end.toISOString() };
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('[Public Controller] getPublicLocations error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving locations.'
    });
  }
};

// @desc    Get single active parking location by ID
// @route   GET /api/public/locations/:id
// @access  Public
export const getPublicLocationById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid parking location ID.'
    });
  }

  try {
    const location = await ParkingLocation.findOne({ _id: id, status: 'ACTIVE' }).lean();
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Parking location not found.'
      });
    }

    return res.status(200).json({
      success: true,
      location
    });
  } catch (error) {
    console.error('[Public Controller] getPublicLocationById error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving location.'
    });
  }
};

// @desc    Get floors for a location with total, available, and occupied counts
// @route   GET /api/public/locations/:id/floors
// @access  Public
export const getFloorsForLocation = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid parking location ID.'
    });
  }

  try {
    const location = await ParkingLocation.findById(id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Parking location not found.'
      });
    }

    const { start, end } = resolveBookingWindow(req.query);
    const vehicleType = req.query.vehicleType ? req.query.vehicleType.toUpperCase() : null;

    const floors = await Floor.find({
      parkingLocationId: id,
      status: 'ACTIVE'
    })
      .sort({ floorNumber: 1 })
      .lean();

    const floorIds = floors.map((f) => f._id);
    const allSlots = await ParkingSlot.find({ floorId: { $in: floorIds } })
      .select('_id floorId status vehicleTypes')
      .lean();

    const allSlotIds = allSlots.map((s) => s._id);
    const bookedIds = await findBookedSlotIds(allSlotIds, start, end);

    const floorSlotMap = new Map();
    floorIds.forEach((fId) => floorSlotMap.set(fId.toString(), []));

    allSlots.forEach((slot) => {
      const list = floorSlotMap.get(slot.floorId.toString());
      if (list) list.push(slot);
    });

    const result = floors.map((floor) => {
      const slots = floorSlotMap.get(floor._id.toString()) || [];
      const total = slots.length;
      const available = slots.filter(
        (s) =>
          s.status === 'AVAILABLE' &&
          !bookedIds.has(s._id.toString()) &&
          (!vehicleType || (s.vehicleTypes && s.vehicleTypes.includes(vehicleType)))
      ).length;
      const occupied = total - available;

      return {
        _id: floor._id,
        name: floor.name,
        floorNumber: floor.floorNumber,
        status: floor.status,
        total,
        available,
        occupied
      };
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      window: { startTime: start.toISOString(), endTime: end.toISOString() },
      floors: result
    });
  } catch (error) {
    console.error('[Public Controller] getFloorsForLocation error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving floors.'
    });
  }
};

// @desc    Get units for a floor with total, available, and occupied counts
// @route   GET /api/public/floors/:id/units
// @access  Public
export const getUnitsForFloor = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid floor ID.'
    });
  }

  try {
    const floor = await Floor.findById(id);
    if (!floor) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found.'
      });
    }

    const { start, end } = resolveBookingWindow(req.query);
    const vehicleType = req.query.vehicleType ? req.query.vehicleType.toUpperCase() : null;

    const units = await Unit.find({
      floorId: id,
      status: 'ACTIVE'
    })
      .sort({ code: 1 })
      .lean();

    const unitIds = units.map((u) => u._id);
    const allSlots = await ParkingSlot.find({ unitId: { $in: unitIds } })
      .select('_id unitId status vehicleTypes')
      .lean();

    const allSlotIds = allSlots.map((s) => s._id);
    const bookedIds = await findBookedSlotIds(allSlotIds, start, end);

    const unitSlotMap = new Map();
    unitIds.forEach((uId) => unitSlotMap.set(uId.toString(), []));

    allSlots.forEach((slot) => {
      const list = unitSlotMap.get(slot.unitId.toString());
      if (list) list.push(slot);
    });

    const result = units.map((unit) => {
      const slots = unitSlotMap.get(unit._id.toString()) || [];
      const total = slots.length;
      const available = slots.filter(
        (s) =>
          s.status === 'AVAILABLE' &&
          !bookedIds.has(s._id.toString()) &&
          (!vehicleType || (s.vehicleTypes && s.vehicleTypes.includes(vehicleType)))
      ).length;
      const occupied = total - available;

      return {
        _id: unit._id,
        name: unit.name,
        code: unit.code,
        status: unit.status,
        total,
        available,
        occupied
      };
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      window: { startTime: start.toISOString(), endTime: end.toISOString() },
      units: result
    });
  } catch (error) {
    console.error('[Public Controller] getUnitsForFloor error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving units.'
    });
  }
};

// @desc    Get slots for a unit with dynamically computed state (AVAILABLE | BOOKED | DISABLED | MAINTENANCE | INCOMPATIBLE)
// @route   GET /api/public/units/:id/slots
// @access  Public
export const getSlotsForUnit = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid unit ID.'
    });
  }

  try {
    const unit = await Unit.findById(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found.'
      });
    }

    const { start, end } = resolveBookingWindow(req.query);
    const vehicleType = req.query.vehicleType ? req.query.vehicleType.toUpperCase() : null;

    const slots = await ParkingSlot.find({ unitId: id })
      .sort({ slotNumber: 1 })
      .lean();

    const slotIds = slots.map((s) => s._id);
    const bookedIds = await findBookedSlotIds(slotIds, start, end);

    const result = slots.map((slot) => {
      let state = 'AVAILABLE';

      if (slot.status === 'DISABLED') {
        state = 'DISABLED';
      } else if (slot.status === 'MAINTENANCE') {
        state = 'MAINTENANCE';
      } else if (vehicleType && !slot.vehicleTypes.includes(vehicleType)) {
        state = 'INCOMPATIBLE';
      } else if (bookedIds.has(slot._id.toString())) {
        state = 'BOOKED';
      } else {
        state = 'AVAILABLE';
      }

      return {
        _id: slot._id,
        slotNumber: slot.slotNumber,
        locationId: slot.locationId,
        floorId: slot.floorId,
        unitId: slot.unitId,
        vehicleTypes: slot.vehicleTypes,
        position: slot.position,
        state
      };
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      window: { startTime: start.toISOString(), endTime: end.toISOString() },
      slots: result
    });
  } catch (error) {
    console.error('[Public Controller] getSlotsForUnit error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving slots.'
    });
  }
};

export default {
  getPublicLocations,
  getFloorsForLocation,
  getUnitsForFloor,
  getSlotsForUnit
};
