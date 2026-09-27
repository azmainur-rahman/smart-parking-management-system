import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import Vehicle from '../models/Vehicle.js';

// @desc    Register a new vehicle
// @route   POST /api/vehicles
// @access  Private (requireAuth)
export const createVehicle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }

  const { vehicleType, brand, model, color, registrationNumber, nickname, image } = req.body;
  const normalizedReg = registrationNumber.toUpperCase().trim();

  try {
    const existingVehicle = await Vehicle.findOne({
      userId: req.user._id,
      registrationNumber: normalizedReg
    });

    if (existingVehicle) {
      if (existingVehicle.status === 'INACTIVE') {
        // Reactivate soft-deleted vehicle with updated info
        existingVehicle.vehicleType = vehicleType.toUpperCase();
        existingVehicle.brand = brand.trim();
        existingVehicle.model = model.trim();
        existingVehicle.color = color.trim();
        existingVehicle.nickname = nickname ? nickname.trim() : existingVehicle.nickname;
        existingVehicle.image = image || existingVehicle.image;
        existingVehicle.status = 'ACTIVE';

        await existingVehicle.save();

        return res.status(200).json({
          success: true,
          message: 'Vehicle reactivated successfully.',
          vehicle: existingVehicle
        });
      }

      return res.status(400).json({
        success: false,
        message: 'You have already registered a vehicle with this registration number.'
      });
    }

    const vehicle = await Vehicle.create({
      userId: req.user._id,
      vehicleType: vehicleType.toUpperCase(),
      brand: brand.trim(),
      model: model.trim(),
      color: color.trim(),
      registrationNumber: normalizedReg,
      nickname: nickname ? nickname.trim() : '',
      image: image || '',
      status: 'ACTIVE'
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully.',
      vehicle
    });
  } catch (error) {
    console.error('[Vehicle Controller] createVehicle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating vehicle.'
    });
  }
};

// @desc    Get all vehicles for current user
// @route   GET /api/vehicles
// @access  Private (requireAuth)
export const getUserVehicles = async (req, res) => {
  try {
    const query = { userId: req.user._id };

    if (req.query.status) {
      query.status = req.query.status.toUpperCase();
    } else {
      // By default, return active vehicles unless explicitly requested otherwise
      query.status = 'ACTIVE';
    }

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });
  } catch (error) {
    console.error('[Vehicle Controller] getUserVehicles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching vehicles.'
    });
  }
};

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private (requireAuth)
export const getVehicleById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vehicle ID format.'
    });
  }

  try {
    const vehicle = await Vehicle.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.'
      });
    }

    return res.status(200).json({
      success: true,
      vehicle
    });
  } catch (error) {
    console.error('[Vehicle Controller] getVehicleById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching vehicle details.'
    });
  }
};

// @desc    Update vehicle information
// @route   PUT /api/vehicles/:id
// @access  Private (requireAuth)
export const updateVehicle = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vehicle ID format.'
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }

  try {
    const vehicle = await Vehicle.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.'
      });
    }

    const { vehicleType, brand, model, color, nickname, image, registrationNumber, status } = req.body;

    // Check registration number conflict if changing registration number
    if (registrationNumber) {
      const normalizedReg = registrationNumber.toUpperCase().trim();
      if (normalizedReg !== vehicle.registrationNumber) {
        const conflict = await Vehicle.findOne({
          userId: req.user._id,
          registrationNumber: normalizedReg,
          _id: { $ne: vehicle._id }
        });

        if (conflict) {
          return res.status(400).json({
            success: false,
            message: 'Another vehicle already exists with this registration number.'
          });
        }

        vehicle.registrationNumber = normalizedReg;
      }
    }

    if (vehicleType) vehicle.vehicleType = vehicleType.toUpperCase();
    if (brand !== undefined) vehicle.brand = brand.trim();
    if (model !== undefined) vehicle.model = model.trim();
    if (color !== undefined) vehicle.color = color.trim();
    if (nickname !== undefined) vehicle.nickname = nickname.trim();
    if (image !== undefined) vehicle.image = image;
    if (status && ['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
      vehicle.status = status.toUpperCase();
    }

    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully.',
      vehicle
    });
  } catch (error) {
    console.error('[Vehicle Controller] updateVehicle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating vehicle.'
    });
  }
};

// @desc    Soft-delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (requireAuth)
export const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid vehicle ID format.'
    });
  }

  try {
    const vehicle = await Vehicle.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.'
      });
    }

    // Perform soft-delete to preserve booking consistency
    vehicle.status = 'INACTIVE';
    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: 'Vehicle removed successfully.'
    });
  } catch (error) {
    console.error('[Vehicle Controller] deleteVehicle error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting vehicle.'
    });
  }
};

export default {
  createVehicle,
  getUserVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
};
