import mongoose from 'mongoose';
import ParkingLocation from '../models/ParkingLocation.js';

/**
 * Ensures authenticated user has MANAGER or ADMIN role.
 * CUSTOMER accounts are strictly rejected with 403 Forbidden.
 */
export const requireManagerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (!['MANAGER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Manager or Administrator role required.'
    });
  }

  next();
};

/**
 * Returns an array of location ObjectIds that the user is authorized to manage.
 * Returns null for ADMIN (unrestricted access to all locations).
 *
 * @param {Object} user - Authenticated user object (req.user)
 * @returns {Promise<mongoose.Types.ObjectId[] | null>}
 */
export const getManagerAllowedLocationIds = async (user) => {
  if (!user) return [];
  if (user.role === 'ADMIN') return null; // Unrestricted access

  const locations = await ParkingLocation.find({
    managerIds: user._id,
    status: 'ACTIVE'
  }).select('_id');

  return locations.map((loc) => loc._id);
};

/**
 * Helper to check whether a user has authority over a specific location ID.
 *
 * @param {Object} user - Authenticated user object (req.user)
 * @param {string | mongoose.Types.ObjectId} locationId
 * @returns {Promise<boolean>}
 */
export const isLocationAllowed = async (user, locationId) => {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;

  if (!mongoose.isValidObjectId(locationId)) return false;

  const exists = await ParkingLocation.exists({
    _id: locationId,
    managerIds: user._id
  });

  return Boolean(exists);
};

/**
 * Middleware to enforce location access for a specific request parameter or body property.
 * Usage: requireLocationAccess((req) => req.params.locationId || req.query.locationId || req.body.locationId)
 */
export const requireLocationAccess = (locationIdExtractor) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      if (req.user.role === 'ADMIN') {
        return next();
      }

      const locId = typeof locationIdExtractor === 'function'
        ? locationIdExtractor(req)
        : req.params[locationIdExtractor] || req.query[locationIdExtractor] || req.body[locationIdExtractor];

      if (!locId) {
        return res.status(400).json({
          success: false,
          message: 'Location ID is required for access verification.'
        });
      }

      const allowed = await isLocationAllowed(req.user, locId);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to manage this parking facility.'
        });
      }

      next();
    } catch (err) {
      console.error('[ManagerScopeMiddleware] Error verifying location access:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error verifying manager permissions.'
      });
    }
  };
};

export default {
  requireManagerOrAdmin,
  getManagerAllowedLocationIds,
  isLocationAllowed,
  requireLocationAccess
};
