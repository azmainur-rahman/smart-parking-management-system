import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import ParkingLocation from '../models/ParkingLocation.js';
import Floor from '../models/Floor.js';
import Unit from '../models/Unit.js';
import ParkingSlot from '../models/ParkingSlot.js';

// ============================================================================
// 1. LOCATION CONTROLLERS
// ============================================================================

// @desc    Create a parking location
// @route   POST /api/parking/locations
// @access  Private (ADMIN, MANAGER)
export const createLocation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }

  const { name, address, description, images, facilities, managerIds, status } = req.body;

  try {
    const existing = await ParkingLocation.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A parking location with this name already exists.'
      });
    }

    const location = await ParkingLocation.create({
      name: name.trim(),
      address: {
        addressLine: address.addressLine.trim(),
        city: address.city ? address.city.trim() : 'Dhaka',
        area: address.area.trim(),
        latitude: address.latitude || null,
        longitude: address.longitude || null
      },
      description: description || '',
      images: Array.isArray(images) ? images : [],
      facilities: Array.isArray(facilities) ? facilities : [],
      managerIds: Array.isArray(managerIds) ? managerIds : [],
      status: status || 'ACTIVE'
    });

    return res.status(201).json({
      success: true,
      message: 'Parking location created successfully.',
      location
    });
  } catch (error) {
    console.error('[Parking Controller] createLocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating parking location.'
    });
  }
};

// @desc    Get all parking locations
// @route   GET /api/parking/locations
// @access  Public / Authenticated
export const getLocations = async (req, res) => {
  try {
    const filter = {};

    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.role === 'ADMIN') {
          isAdmin = true;
        }
      } catch (e) {
        isAdmin = false;
      }
    }

    if (isAdmin && req.query.status) {
      filter.status = req.query.status.toUpperCase();
    } else {
      filter.status = 'ACTIVE';
    }

    if (req.query.city) {
      filter['address.city'] = new RegExp(req.query.city, 'i');
    }

    if (req.query.area) {
      filter['address.area'] = new RegExp(req.query.area, 'i');
    }

    const locations = await ParkingLocation.find(filter)
      .populate('managerIds', 'name email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: locations.length,
      locations
    });
  } catch (error) {
    console.error('[Parking Controller] getLocations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving parking locations.'
    });
  }
};

// @desc    Get single parking location by ID
// @route   GET /api/parking/locations/:id
// @access  Public / Authenticated
export const getLocationById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid parking location ID.'
    });
  }

  try {
    const location = await ParkingLocation.findById(id).populate('managerIds', 'name email phone');

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
    console.error('[Parking Controller] getLocationById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving parking location.'
    });
  }
};

// @desc    Update parking location
// @route   PUT /api/parking/locations/:id
// @access  Private (ADMIN, MANAGER)
export const updateLocation = async (req, res) => {
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

    const { name, address, description, images, facilities, managerIds, status } = req.body;

    if (name && name.trim() !== location.name) {
      const conflict = await ParkingLocation.findOne({
        name: name.trim(),
        _id: { $ne: location._id }
      });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: 'Another parking location already uses this name.'
        });
      }
      location.name = name.trim();
    }

    if (address) {
      if (address.addressLine) location.address.addressLine = address.addressLine.trim();
      if (address.city) location.address.city = address.city.trim();
      if (address.area) location.address.area = address.area.trim();
      if (address.latitude !== undefined) location.address.latitude = address.latitude;
      if (address.longitude !== undefined) location.address.longitude = address.longitude;
    }

    if (description !== undefined) location.description = description;
    if (images && Array.isArray(images)) location.images = images;
    if (facilities && Array.isArray(facilities)) location.facilities = facilities;
    if (managerIds && Array.isArray(managerIds)) location.managerIds = managerIds;
    if (status && ['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(status.toUpperCase())) {
      location.status = status.toUpperCase();
    }

    await location.save();

    return res.status(200).json({
      success: true,
      message: 'Parking location updated successfully.',
      location
    });
  } catch (error) {
    console.error('[Parking Controller] updateLocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating parking location.'
    });
  }
};

// @desc    Soft-delete parking location
// @route   DELETE /api/parking/locations/:id
// @access  Private (ADMIN)
export const deleteLocation = async (req, res) => {
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

    location.status = 'INACTIVE';
    await location.save();

    return res.status(200).json({
      success: true,
      message: 'Parking location deactivated successfully.'
    });
  } catch (error) {
    console.error('[Parking Controller] deleteLocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deactivating parking location.'
    });
  }
};

// ============================================================================
// 2. FLOOR CONTROLLERS
// ============================================================================

// @desc    Create a floor for a location
// @route   POST /api/parking/locations/:id/floors
// @access  Private (ADMIN, MANAGER)
export const createFloor = async (req, res) => {
  const { id: parkingLocationId } = req.params;

  if (!mongoose.isValidObjectId(parkingLocationId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid parking location ID.'
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }

  const { name, floorNumber, status } = req.body;

  try {
    const location = await ParkingLocation.findById(parkingLocationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Parking location not found.'
      });
    }

    const existingFloor = await Floor.findOne({
      parkingLocationId,
      floorNumber: Number(floorNumber)
    });

    if (existingFloor) {
      return res.status(400).json({
        success: false,
        message: `Floor number ${floorNumber} already exists in this location.`
      });
    }

    const floor = await Floor.create({
      parkingLocationId,
      name: name.trim(),
      floorNumber: Number(floorNumber),
      status: status || 'ACTIVE'
    });

    return res.status(201).json({
      success: true,
      message: 'Floor created successfully.',
      floor
    });
  } catch (error) {
    console.error('[Parking Controller] createFloor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating floor.'
    });
  }
};

// @desc    Get floors for a location
// @route   GET /api/parking/locations/:id/floors
// @access  Public / Authenticated
export const getFloorsByLocation = async (req, res) => {
  const { id: parkingLocationId } = req.params;

  if (!mongoose.isValidObjectId(parkingLocationId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid parking location ID.'
    });
  }

  try {
    const floors = await Floor.find({
      parkingLocationId,
      status: { $ne: 'INACTIVE' }
    }).sort({ floorNumber: 1 });

    return res.status(200).json({
      success: true,
      count: floors.length,
      floors
    });
  } catch (error) {
    console.error('[Parking Controller] getFloorsByLocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving floors.'
    });
  }
};

// @desc    Update a floor
// @route   PUT /api/parking/floors/:id
// @access  Private (ADMIN, MANAGER)
export const updateFloor = async (req, res) => {
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

    const { name, floorNumber, status } = req.body;

    if (floorNumber !== undefined && Number(floorNumber) !== floor.floorNumber) {
      const conflict = await Floor.findOne({
        parkingLocationId: floor.parkingLocationId,
        floorNumber: Number(floorNumber),
        _id: { $ne: floor._id }
      });
      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Floor number ${floorNumber} already exists in this location.`
        });
      }
      floor.floorNumber = Number(floorNumber);
    }

    if (name) floor.name = name.trim();
    if (status && ['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      floor.status = status.toUpperCase();
    }

    await floor.save();

    return res.status(200).json({
      success: true,
      message: 'Floor updated successfully.',
      floor
    });
  } catch (error) {
    console.error('[Parking Controller] updateFloor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating floor.'
    });
  }
};

// @desc    Soft-delete a floor
// @route   DELETE /api/parking/floors/:id
// @access  Private (ADMIN, MANAGER)
export const deleteFloor = async (req, res) => {
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

    floor.status = 'INACTIVE';
    await floor.save();

    return res.status(200).json({
      success: true,
      message: 'Floor deactivated successfully.'
    });
  } catch (error) {
    console.error('[Parking Controller] deleteFloor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deactivating floor.'
    });
  }
};

// ============================================================================
// 3. UNIT CONTROLLERS
// ============================================================================

// @desc    Create a unit for a floor
// @route   POST /api/parking/floors/:id/units
// @access  Private (ADMIN, MANAGER)
export const createUnit = async (req, res) => {
  const { id: floorId } = req.params;

  if (!mongoose.isValidObjectId(floorId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid floor ID.'
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }

  const { name, code, status } = req.body;
  const normalizedCode = code.toUpperCase().trim();

  try {
    const floor = await Floor.findById(floorId);
    if (!floor) {
      return res.status(404).json({
        success: false,
        message: 'Floor not found.'
      });
    }

    const existingUnit = await Unit.findOne({
      floorId,
      code: normalizedCode
    });

    if (existingUnit) {
      return res.status(400).json({
        success: false,
        message: `Unit code '${normalizedCode}' already exists on this floor.`
      });
    }

    const unit = await Unit.create({
      floorId,
      name: name.trim(),
      code: normalizedCode,
      status: status || 'ACTIVE'
    });

    return res.status(201).json({
      success: true,
      message: 'Unit created successfully.',
      unit
    });
  } catch (error) {
    console.error('[Parking Controller] createUnit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating unit.'
    });
  }
};

// @desc    Get all units for a floor
// @route   GET /api/parking/floors/:id/units
// @access  Public / Authenticated
export const getUnitsByFloor = async (req, res) => {
  const { id: floorId } = req.params;

  if (!mongoose.isValidObjectId(floorId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid floor ID.'
    });
  }

  try {
    const units = await Unit.find({
      floorId,
      status: { $ne: 'INACTIVE' }
    }).sort({ code: 1 });

    return res.status(200).json({
      success: true,
      count: units.length,
      units
    });
  } catch (error) {
    console.error('[Parking Controller] getUnitsByFloor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving units.'
    });
  }
};

// @desc    Update a unit
// @route   PUT /api/parking/units/:id
// @access  Private (ADMIN, MANAGER)
export const updateUnit = async (req, res) => {
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

    const { name, code, status } = req.body;

    if (code) {
      const normalizedCode = code.toUpperCase().trim();
      if (normalizedCode !== unit.code) {
        const conflict = await Unit.findOne({
          floorId: unit.floorId,
          code: normalizedCode,
          _id: { $ne: unit._id }
        });
        if (conflict) {
          return res.status(400).json({
            success: false,
            message: `Unit code '${normalizedCode}' already exists on this floor.`
          });
        }
        unit.code = normalizedCode;
      }
    }

    if (name) unit.name = name.trim();
    if (status && ['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      unit.status = status.toUpperCase();
    }

    await unit.save();

    return res.status(200).json({
      success: true,
      message: 'Unit updated successfully.',
      unit
    });
  } catch (error) {
    console.error('[Parking Controller] updateUnit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating unit.'
    });
  }
};

// @desc    Soft-delete a unit
// @route   DELETE /api/parking/units/:id
// @access  Private (ADMIN, MANAGER)
export const deleteUnit = async (req, res) => {
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

    unit.status = 'INACTIVE';
    await unit.save();

    return res.status(200).json({
      success: true,
      message: 'Unit deactivated successfully.'
    });
  } catch (error) {
    console.error('[Parking Controller] deleteUnit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deactivating unit.'
    });
  }
};

// ============================================================================
// 4. PARKING SLOT CONTROLLERS
// ============================================================================

// @desc    Create a parking slot inside a unit
// @route   POST /api/parking/units/:id/slots
// @access  Private (ADMIN, MANAGER)
export const createSlot = async (req, res) => {
  const { id: unitId } = req.params;

  if (!mongoose.isValidObjectId(unitId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid unit ID.'
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }

  const { slotNumber, vehicleTypes, position, status } = req.body;
  const normalizedSlot = slotNumber.toUpperCase().trim();

  try {
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found.'
      });
    }

    const floor = await Floor.findById(unit.floorId);
    if (!floor) {
      return res.status(404).json({
        success: false,
        message: 'Associated floor not found.'
      });
    }

    const existingSlot = await ParkingSlot.findOne({
      locationId: floor.parkingLocationId,
      floorId: floor._id,
      unitId: unit._id,
      slotNumber: normalizedSlot
    });

    if (existingSlot) {
      return res.status(400).json({
        success: false,
        message: `Slot '${normalizedSlot}' already exists in this unit.`
      });
    }

    const slot = await ParkingSlot.create({
      locationId: floor.parkingLocationId,
      floorId: floor._id,
      unitId: unit._id,
      slotNumber: normalizedSlot,
      vehicleTypes: Array.isArray(vehicleTypes) ? vehicleTypes.map((v) => v.toUpperCase()) : ['CAR'],
      position: position || { x: 0, y: 0 },
      status: status || 'AVAILABLE'
    });

    return res.status(201).json({
      success: true,
      message: 'Parking slot created successfully.',
      slot
    });
  } catch (error) {
    console.error('[Parking Controller] createSlot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating parking slot.'
    });
  }
};

// @desc    Get all slots for a unit
// @route   GET /api/parking/units/:id/slots
// @access  Public / Authenticated
export const getSlotsByUnit = async (req, res) => {
  const { id: unitId } = req.params;

  if (!mongoose.isValidObjectId(unitId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid unit ID.'
    });
  }

  try {
    const filter = { unitId };

    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    }

    if (req.query.vehicleType) {
      filter.vehicleTypes = req.query.vehicleType.toUpperCase();
    }

    const slots = await ParkingSlot.find(filter).sort({ slotNumber: 1 });

    return res.status(200).json({
      success: true,
      count: slots.length,
      slots
    });
  } catch (error) {
    console.error('[Parking Controller] getSlotsByUnit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving parking slots.'
    });
  }
};

// @desc    Update a parking slot
// @route   PUT /api/parking/slots/:id
// @access  Private (ADMIN, MANAGER)
export const updateSlot = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid parking slot ID.'
    });
  }

  try {
    const slot = await ParkingSlot.findById(id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found.'
      });
    }

    const { slotNumber, vehicleTypes, position, status } = req.body;

    if (slotNumber) {
      const normalizedSlot = slotNumber.toUpperCase().trim();
      if (normalizedSlot !== slot.slotNumber) {
        const conflict = await ParkingSlot.findOne({
          locationId: slot.locationId,
          floorId: slot.floorId,
          unitId: slot.unitId,
          slotNumber: normalizedSlot,
          _id: { $ne: slot._id }
        });
        if (conflict) {
          return res.status(400).json({
            success: false,
            message: `Slot '${normalizedSlot}' already exists in this unit.`
          });
        }
        slot.slotNumber = normalizedSlot;
      }
    }

    if (vehicleTypes && Array.isArray(vehicleTypes)) {
      slot.vehicleTypes = vehicleTypes.map((v) => v.toUpperCase());
    }

    if (position) {
      if (position.x !== undefined) slot.position.x = position.x;
      if (position.y !== undefined) slot.position.y = position.y;
    }

    if (status && ['AVAILABLE', 'DISABLED', 'MAINTENANCE'].includes(status.toUpperCase())) {
      slot.status = status.toUpperCase();
    }

    await slot.save();

    return res.status(200).json({
      success: true,
      message: 'Parking slot updated successfully.',
      slot
    });
  } catch (error) {
    console.error('[Parking Controller] updateSlot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating parking slot.'
    });
  }
};

// @desc    Disable a parking slot
// @route   DELETE /api/parking/slots/:id
// @access  Private (ADMIN, MANAGER)
export const deleteSlot = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid parking slot ID.'
    });
  }

  try {
    const slot = await ParkingSlot.findById(id);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Parking slot not found.'
      });
    }

    slot.status = 'DISABLED';
    await slot.save();

    return res.status(200).json({
      success: true,
      message: 'Parking slot disabled successfully.'
    });
  } catch (error) {
    console.error('[Parking Controller] deleteSlot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error disabling parking slot.'
    });
  }
};

export default {
  createLocation,
  getLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
  createFloor,
  getFloorsByLocation,
  updateFloor,
  deleteFloor,
  createUnit,
  getUnitsByFloor,
  updateUnit,
  deleteUnit,
  createSlot,
  getSlotsByUnit,
  updateSlot,
  deleteSlot
};
