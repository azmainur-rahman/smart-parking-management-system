import express from 'express';
import { body } from 'express-validator';
import {
  createVehicle,
  getUserVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicleController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation Rules for Vehicle Creation
const vehicleValidation = [
  body('vehicleType')
    .trim()
    .toUpperCase()
    .isIn(['CAR', 'MOTORCYCLE', 'SUV', 'MICROBUS', 'PICKUP', 'VAN'])
    .withMessage('Supported vehicle types: CAR, MOTORCYCLE, SUV, MICROBUS, PICKUP, VAN'),
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Vehicle brand is required'),
  body('model')
    .trim()
    .notEmpty()
    .withMessage('Vehicle model is required'),
  body('color')
    .trim()
    .notEmpty()
    .withMessage('Vehicle color is required'),
  body('registrationNumber')
    .trim()
    .notEmpty()
    .withMessage('Registration number is required')
];

// Validation Rules for Vehicle Update
const vehicleUpdateValidation = [
  body('vehicleType')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(['CAR', 'MOTORCYCLE', 'SUV', 'MICROBUS', 'PICKUP', 'VAN'])
    .withMessage('Supported vehicle types: CAR, MOTORCYCLE, SUV, MICROBUS, PICKUP, VAN'),
  body('brand').optional().trim().notEmpty().withMessage('Brand cannot be empty'),
  body('model').optional().trim().notEmpty().withMessage('Model cannot be empty'),
  body('color').optional().trim().notEmpty().withMessage('Color cannot be empty'),
  body('registrationNumber').optional().trim().notEmpty().withMessage('Registration number cannot be empty')
];

// All vehicle routes require authentication
router.use(requireAuth);

router.post('/', vehicleValidation, createVehicle);
router.get('/', getUserVehicles);
router.get('/:id', getVehicleById);
router.put('/:id', vehicleUpdateValidation, updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
