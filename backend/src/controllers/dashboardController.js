import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';

// @desc    Get dashboard metrics for authenticated user
// @route   GET /api/dashboard/summary
// @access  Private
export const getSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const [upcoming, completed, vehicles, cancelled] = await Promise.all([
      Booking.countDocuments({
        userId,
        bookingStatus: { $in: ['CONFIRMED', 'ACTIVE'] },
        endTime: { $gte: now }
      }),
      Booking.countDocuments({
        userId,
        bookingStatus: 'COMPLETED'
      }),
      Vehicle.countDocuments({
        userId,
        status: 'ACTIVE'
      }),
      Booking.countDocuments({
        userId,
        bookingStatus: 'CANCELLED'
      })
    ]);

    return res.status(200).json({
      success: true,
      summary: {
        upcoming,
        completed,
        vehicles,
        cancelled
      }
    });
  } catch (error) {
    console.error('[Dashboard Controller] getSummary error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard summary.'
    });
  }
};

export default {
  getSummary
};
