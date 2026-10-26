import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ParkingLocation from '../models/ParkingLocation.js';
import { autoSeed } from './seedHelper.js';

dotenv.config();

let memServer = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const mongoURI = process.env.MONGO_URI;
  const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

  // 1. In Serverless / Production: ONLY connect to MongoDB Atlas
  if (isServerless) {
    if (!mongoURI || mongoURI === 'memory') {
      const msg = '[Database Error] MONGO_URI is missing in Vercel Environment Variables. Please set MONGO_URI in Vercel Settings -> Environment Variables.';
      console.error(msg);
      throw new Error(msg);
    }

    try {
      const conn = await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        bufferCommands: false
      });
      console.log(`[Database] MongoDB Atlas connected: ${conn.connection.host}`);

      // Seed if empty
      try {
        const locCount = await ParkingLocation.countDocuments();
        if (locCount === 0) {
          await autoSeed();
        }
      } catch (seedErr) {
        console.warn('[Database] Seeding check skipped:', seedErr.message);
      }

      return conn;
    } catch (error) {
      console.error(`[Database Error] Could not connect to MongoDB Atlas: ${error.message}`);
      throw error;
    }
  }

  // 2. In Local Development: Try MongoDB Atlas first, fallback to MongoMemoryServer
  try {
    if (!mongoURI || mongoURI === 'memory') {
      throw new Error('No valid MONGO_URI in local environment');
    }

    const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 3000 });
    console.log(`[Database] MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database] Notice: ${error.message}. Initializing local in-memory MongoDB...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'smart_parking',
          launchTimeout: 60000
        }
      });
      const localUri = memServer.getUri();
      const conn = await mongoose.connect(localUri);
      console.log(`[Database] In-memory MongoDB running and connected at: ${localUri}`);
    } catch (memErr) {
      console.error(`[Database] Failed to initialize in-memory MongoDB: ${memErr.message}`);
      throw memErr;
    }
  }

  // Check if initial seeding is needed
  try {
    const locCount = await ParkingLocation.countDocuments();
    if (locCount === 0) {
      await autoSeed();
    }
  } catch (err) {
    console.warn('[Database] Seeding check failed:', err.message);
  }
};

export default connectDB;
