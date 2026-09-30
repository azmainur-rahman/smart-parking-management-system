import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const seedAdmin = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('[Seed Error] MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('[Seed] Connected.');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartparking.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`[Seed] Admin user already exists with email: ${adminEmail}`);
      console.log(`[Seed] Current Role: ${existingAdmin.role}, Status: ${existingAdmin.status}`);
    } else {
      console.log(`[Seed] Creating admin user: ${adminEmail}...`);
      const admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      });

      console.log('[Seed] Admin user created successfully!');
      console.log(`[Seed] ID: ${admin._id}`);
      console.log(`[Seed] Email: ${admin.email}`);
      console.log(`[Seed] Role: ${admin.role}`);
    }

    await mongoose.connection.close();
    console.log('[Seed] Database connection closed. Done.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] Failed to seed admin user: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedAdmin();
