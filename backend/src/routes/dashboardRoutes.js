import express from 'express';
import { getSummary } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get user dashboard summary counts (upcoming, completed, vehicles, cancelled)
 * @access  Private
 */
router.get('/summary', requireAuth, getSummary);

export default router;
