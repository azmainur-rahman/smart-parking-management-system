import 'dotenv/config';
import mongoose from 'mongoose';
import ParkingLocation from '../models/ParkingLocation.js';
import Floor from '../models/Floor.js';
import Unit from '../models/Unit.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Booking from '../models/Booking.js';

const DEMO_LOCATIONS = [
  {
    name: 'Bashundhara City Parking',
    address: {
      addressLine: 'Panthapath',
      city: 'Dhaka',
      area: 'Panthapath',
      latitude: 23.7509,
      longitude: 90.3879
    },
    description: 'Multi-level covered parking facility in Central Dhaka with EV chargers and high-bay spots.',
    facilities: ['CCTV Surveillance', '24/7 Security Guard', 'EV Charging Station', 'Covered Parking'],
    images: ['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'],
    status: 'ACTIVE'
  },
  {
    name: 'Gulshan Avenue Parking',
    address: {
      addressLine: 'Road 11, Gulshan Avenue',
      city: 'Dhaka',
      area: 'Gulshan 2',
      latitude: 23.7925,
      longitude: 90.4152
    },
    description: 'Executive parking deck with automated barrier control and round-the-clock patrol in Gulshan commercial district.',
    facilities: ['CCTV Surveillance', 'Valet Parking', 'Automated Gates', '24/7 Security'],
    images: ['https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80'],
    status: 'ACTIVE'
  },
  {
    name: 'Dhanmondi Lake Parking',
    address: {
      addressLine: 'Road 32',
      city: 'Dhaka',
      area: 'Dhanmondi',
      latitude: 23.7525,
      longitude: 90.3776
    },
    description: 'Spacious lakeside parking convenient for recreation, hospitals, schools, and business dining.',
    facilities: ['CCTV Surveillance', 'Well-Lit Parking Bays', 'Security Guards'],
    images: ['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80'],
    status: 'ACTIVE'
  }
];

const seedDemoData = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('[Demo Seed Error] MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    console.log('[Demo Seed] Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('[Demo Seed] Connected.');

    for (const locData of DEMO_LOCATIONS) {
      // 1. Upsert Location
      const location = await ParkingLocation.findOneAndUpdate(
        { name: locData.name },
        locData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[Demo Seed] Location ready: ${location.name} (ID: ${location._id})`);

      // 2. Each Location has 2 Floors
      const floorsData = [
        { name: 'Floor 1', floorNumber: 1, status: 'ACTIVE' },
        { name: 'Floor 2', floorNumber: 2, status: 'ACTIVE' }
      ];

      for (const fData of floorsData) {
        const floor = await Floor.findOneAndUpdate(
          { parkingLocationId: location._id, floorNumber: fData.floorNumber },
          { ...fData, parkingLocationId: location._id },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 3. Each Floor has 2 Units (Unit A, Unit B)
        const unitsData = [
          { name: `Unit A`, code: 'A', status: 'ACTIVE' },
          { name: `Unit B`, code: 'B', status: 'ACTIVE' }
        ];

        for (const uData of unitsData) {
          const unit = await Unit.findOneAndUpdate(
            { floorId: floor._id, code: uData.code },
            { ...uData, floorId: floor._id },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          // 4. Each Unit has 10 Slots (Mix of CAR, SUV, MOTORCYCLE + 1 DISABLED)
          for (let i = 1; i <= 10; i++) {
            const slotNumber = `${floor.floorNumber}${unit.code}-${String(i).padStart(2, '0')}`;
            let vehicleTypes = ['CAR', 'SUV'];
            let status = 'AVAILABLE';

            if (i >= 7 && i <= 8) {
              vehicleTypes = ['MOTORCYCLE'];
            } else if (i === 9) {
              vehicleTypes = ['CAR', 'SUV', 'MICROBUS', 'VAN'];
            } else if (i === 10) {
              // 1 disabled / maintenance slot per unit
              status = 'DISABLED';
              vehicleTypes = ['CAR', 'SUV'];
            }

            await ParkingSlot.findOneAndUpdate(
              {
                locationId: location._id,
                floorId: floor._id,
                unitId: unit._id,
                slotNumber
              },
              {
                locationId: location._id,
                floorId: floor._id,
                unitId: unit._id,
                slotNumber,
                vehicleTypes,
                status,
                position: { x: (i - 1) * 10, y: floor.floorNumber * 10 }
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }
        }
      }
    }

    // Migration: Backfill qrCode = bookingNumber for all existing CONFIRMED bookings per spec section 24
    const confirmedBookings = await Booking.find({ bookingStatus: 'CONFIRMED' });
    let backfilledCount = 0;
    for (const b of confirmedBookings) {
      if (b.qrCode !== b.bookingNumber) {
        b.qrCode = b.bookingNumber;
        await b.save();
        backfilledCount++;
      }
    }
    if (backfilledCount > 0) {
      console.log(`[Demo Seed] Backfilled qrCode for ${backfilledCount} confirmed bookings.`);
    }

    console.log('[Demo Seed] All 3 locations, 6 floors, 12 units, and 120 slots seeded successfully!');
    await mongoose.connection.close();
    console.log('[Demo Seed] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error(`[Demo Seed Error] Failed: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedDemoData();
