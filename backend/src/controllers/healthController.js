import mongoose from 'mongoose';
import os from 'os';
import ParkingLocation from '../models/ParkingLocation.js';
import Floor from '../models/Floor.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
};

const formatMemory = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * @desc    Comprehensive backend health, telemetry and services status
 * @route   GET /health and GET /api/health
 * @access  Public
 */
export const getHealthStatus = async (req, res) => {
  const startPing = Date.now();
  let dbStatus = 'disconnected';
  let dbLatency = null;
  let counts = null;
  let isDbHealthy = false;

  const readyState = mongoose.connection.readyState;
  // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  dbStatus = stateMap[readyState] || 'unknown';

  if (readyState === 1 && mongoose.connection.db) {
    try {
      await mongoose.connection.db.admin().ping();
      dbLatency = `${Date.now() - startPing} ms`;
      isDbHealthy = true;

      // Parallel quick count collection statistics with safe promise handling
      const [locationsCount, floorsCount, slotsCount, activeBookingsCount, usersCount] = await Promise.allSettled([
        ParkingLocation.countDocuments({ status: 'ACTIVE' }),
        Floor.countDocuments(),
        ParkingSlot.countDocuments(),
        Booking.countDocuments({ bookingStatus: { $in: ['CONFIRMED', 'CHECKED_IN'] } }),
        User.countDocuments()
      ]);

      counts = {
        activeFacilities: locationsCount.status === 'fulfilled' ? locationsCount.value : 0,
        floors: floorsCount.status === 'fulfilled' ? floorsCount.value : 0,
        parkingSlots: slotsCount.status === 'fulfilled' ? slotsCount.value : 0,
        activeBookings: activeBookingsCount.status === 'fulfilled' ? activeBookingsCount.value : 0,
        registeredUsers: usersCount.status === 'fulfilled' ? usersCount.value : 0
      };
    } catch (err) {
      dbStatus = 'degraded';
      dbLatency = 'timeout / error';
    }
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  // Overall system health status
  let overallStatus = 'healthy';
  let statusCode = 200;

  if (!isDbHealthy) {
    overallStatus = 'degraded';
    statusCode = 503;
  }

  const payload = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: formatUptime(uptimeSeconds),
    uptimeSeconds,
    environment: process.env.NODE_ENV || 'development',
    server: {
      nodeVersion: process.version,
      platform: `${process.platform} (${process.arch})`,
      memory: {
        rss: formatMemory(memoryUsage.rss),
        heapTotal: formatMemory(memoryUsage.heapTotal),
        heapUsed: formatMemory(memoryUsage.heapUsed),
        external: formatMemory(memoryUsage.external)
      },
      systemLoad: os.loadavg ? os.loadavg().map((l) => Number(l.toFixed(2))) : []
    },
    services: {
      database: {
        status: dbStatus,
        provider: 'MongoDB',
        host: mongoose.connection.host || 'unknown',
        databaseName: mongoose.connection.name || 'unknown',
        latency: dbLatency,
        statistics: counts
      },
      authentication: {
        status: process.env.JWT_SECRET ? 'operational' : 'configuration_warning',
        tokenMechanism: 'JWT (HMAC-SHA256)',
        expiresIn: '24h'
      },
      paymentGateway: {
        status: 'operational',
        gateway: 'SSLCommerz Simulator / Sandbox',
        currency: 'BDT (৳)',
        methods: ['BKASH', 'NAGAD', 'ROCKET', 'CREDIT_CARD', 'CASH']
      },
      emailNotification: {
        status: process.env.SMTP_HOST ? 'operational' : 'development_mock',
        provider: process.env.SMTP_HOST ? 'SMTP Relay' : 'Console / Mock Logger'
      },
      holdExpiryScheduler: {
        status: 'operational',
        description: 'Auto-expiration of unfulfilled booking holds (60s interval)'
      }
    }
  };

  return res.status(statusCode).json(payload);
};
