import express from 'express';
import {
  getManagerDashboard,
  getManagerLocations,
  getManagerBookings,
  getManagerSlots,
  updateSlotStatus,
  verifyBookingQR,
  recordEntry,
  recordExit,
  getManagerReportsSummary
} from '../controllers/managerController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireManagerOrAdmin } from '../middleware/managerScopeMiddleware.js';

const router = express.Router();

// Enforce authentication & Manager/Admin role guard across all routes
router.use(requireAuth);
router.use(requireManagerOrAdmin);

// Dashboard
router.get('/dashboard', getManagerDashboard);

// Locations
router.get('/locations', getManagerLocations);

// Bookings
router.get('/bookings', getManagerBookings);

// Slots inventory & Status update
router.get('/slots', getManagerSlots);
router.put('/slots/:id', updateSlotStatus);

// QR verification and gate Entry / Exit controls
router.post('/verify-qr', verifyBookingQR);
router.post('/entry', recordEntry);
router.post('/exit', recordExit);

// Analytical Reports
router.get('/reports/summary', getManagerReportsSummary);

export default router;
