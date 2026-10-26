import express from 'express';
import {
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
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce authentication & ADMIN role guard across all routes
router.use(requireAuth);
router.use(requireRole('ADMIN'));

// Dashboard Overview
router.get('/dashboard', getAdminDashboard);

// User Management
router.get('/users', getAdminUsers);
router.post('/users', createAdminUser);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);

// Manager Assignment
router.get('/managers', getAdminManagers);
router.put('/locations/:id/managers', updateLocationManagers);

// Global Bookings & Payments
router.get('/bookings', getAdminBookings);
router.get('/payments', getAdminPayments);

// Dynamic Pricing
router.get('/pricing', getAdminPricing);
router.put('/pricing', updateAdminPricing);

export default router;
