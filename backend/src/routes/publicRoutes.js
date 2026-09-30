import express from 'express';
import {
  getPublicLocations,
  getPublicLocationById,
  getFloorsForLocation,
  getUnitsForFloor,
  getSlotsForUnit
} from '../controllers/publicController.js';

const router = express.Router();

/**
 * @route   GET /api/public/locations
 * @desc    Get all active parking locations with slot count and fromPrice
 * @access  Public
 */
router.get('/locations', getPublicLocations);

/**
 * @route   GET /api/public/locations/:id
 * @desc    Get single active parking location details
 * @access  Public
 */
router.get('/locations/:id', getPublicLocationById);

/**
 * @route   GET /api/public/locations/:id/floors
 * @desc    Get floors for a location with windowed availability counts
 * @access  Public
 */
router.get('/locations/:id/floors', getFloorsForLocation);

/**
 * @route   GET /api/public/floors/:id/units
 * @desc    Get units for a floor with windowed availability counts
 * @access  Public
 */
router.get('/floors/:id/units', getUnitsForFloor);

/**
 * @route   GET /api/public/units/:id/slots
 * @desc    Get slots for a unit with computed availability state
 * @access  Public
 */
router.get('/units/:id/slots', getSlotsForUnit);

export default router;
