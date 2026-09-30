import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import ParkingLocation from '../models/ParkingLocation.js';

const seedManager = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('[Manager Seed Error] MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    console.log('[Manager Seed] Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('[Manager Seed] Connected.');

    const managerEmail = process.env.MANAGER_EMAIL || 'manager@smartparking.local';
    const managerPassword = process.env.MANAGER_PASSWORD || 'change_me';
    const locationName = process.env.MANAGER_LOCATION_NAME || 'Bashundhara City Parking';

    // 1. Create or Find Manager User (Idempotent)
    let manager = await User.findOne({ email: managerEmail });

    if (manager) {
      console.log(`[Manager Seed] Manager user already exists: ${managerEmail} (Role: ${manager.role})`);
      if (manager.role !== 'MANAGER') {
        manager.role = 'MANAGER';
        await manager.save();
        console.log(`[Manager Seed] Updated user role to MANAGER.`);
      }
    } else {
      console.log(`[Manager Seed] Creating new manager user: ${managerEmail}...`);
      manager = await User.create({
        name: 'Facility Manager',
        email: managerEmail,
        password: managerPassword,
        role: 'MANAGER',
        status: 'ACTIVE',
        phone: '+8801700000001'
      });
      console.log(`[Manager Seed] Manager user created successfully with ID: ${manager._id}`);
    }

    // 2. Find Location and Assign Manager (Idempotent)
    const location = await ParkingLocation.findOne({ name: locationName });

    if (!location) {
      console.warn(`[Manager Seed Warning] Parking location "${locationName}" not found. Run "npm run seed:demo" first if you need sample facilities.`);
    } else {
      const alreadyAssigned = location.managerIds.some((id) => id.toString() === manager._id.toString());
      if (alreadyAssigned) {
        console.log(`[Manager Seed] Manager is already assigned to "${location.name}" (Location ID: ${location._id}).`);
      } else {
        location.managerIds.push(manager._id);
        await location.save();
        console.log(`[Manager Seed] Successfully assigned manager ${manager.email} to "${location.name}".`);
      }
    }

    await mongoose.connection.close();
    console.log('[Manager Seed] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`[Manager Seed Error] Failed: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedManager();
