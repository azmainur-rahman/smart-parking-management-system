import express from 'express';
import { body } from 'express-validator';
import {
  createLocation,
  getLocations,
  getLocationById,
  getLocationLayout,
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
} from '../controllers/parkingController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation Rules
const locationValidation = [
  body('name').trim().notEmpty().withMessage('Location name is required'),
  body('address.addressLine').trim().notEmpty().withMessage('Address line is required'),
  body('address.area').trim().notEmpty().withMessage('Area is required')
];

const floorValidation = [
  body('name').trim().notEmpty().withMessage('Floor name is required'),
  body('floorNumber').isNumeric().withMessage('Floor number must be a number')
];

const unitValidation = [
  body('name').trim().notEmpty().withMessage('Unit name is required'),
  body('code').trim().notEmpty().withMessage('Unit code is required')
];

const slotValidation = [
  body('slotNumber').trim().notEmpty().withMessage('Slot number is required')
];

// ============================================================================
// LOCATIONS
// ============================================================================
router.get('/locations', getLocations);
router.post('/locations', requireAuth, requireRole('ADMIN', 'MANAGER'), locationValidation, createLocation);

router.get('/locations/:id', getLocationById);
router.get('/locations/:id/layout', requireAuth, requireRole('ADMIN', 'MANAGER'), getLocationLayout);
router.put('/locations/:id', requireAuth, requireRole('ADMIN', 'MANAGER'), updateLocation);
router.delete('/locations/:id', requireAuth, requireRole('ADMIN'), deleteLocation);

// ============================================================================
// FLOORS
// ============================================================================
router.get('/locations/:id/floors', getFloorsByLocation);
router.post('/locations/:id/floors', requireAuth, requireRole('ADMIN', 'MANAGER'), floorValidation, createFloor);

router.put('/floors/:id', requireAuth, requireRole('ADMIN', 'MANAGER'), updateFloor);
router.delete('/floors/:id', requireAuth, requireRole('ADMIN', 'MANAGER'), deleteFloor);

// ============================================================================
// UNITS
// ============================================================================
router.get('/floors/:id/units', getUnitsByFloor);
router.post('/floors/:id/units', requireAuth, requireRole('ADMIN', 'MANAGER'), unitValidation, createUnit);

router.put('/units/:id', requireAuth, requireRole('ADMIN', 'MANAGER'), updateUnit);
router.delete('/units/:id', requireAuth, requireRole('ADMIN', 'MANAGER'), deleteUnit);

// ============================================================================
// SLOTS
// ============================================================================
router.get('/units/:id/slots', getSlotsByUnit);
router.post('/units/:id/slots', requireAuth, requireRole('ADMIN', 'MANAGER'), slotValidation, createSlot);

router.put('/slots/:id', requireAuth, requireRole('ADMIN', 'MANAGER'), updateSlot);
router.delete('/slots/:id', requireAuth, requireRole('ADMIN', 'MANAGER'), deleteSlot);

export default router;
