import ParkingLocation from '../models/ParkingLocation.js';
import Floor from '../models/Floor.js';
import Unit from '../models/Unit.js';
import ParkingSlot from '../models/ParkingSlot.js';
import User from '../models/User.js';

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

export const autoSeed = async () => {
  try {
    console.log('[AutoSeed] Checking initial seed data...');

    // 1. Seed Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartparking.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      });
      console.log(`[AutoSeed] Admin created: ${adminEmail}`);
    }

    // 2. Seed Manager
    const managerEmail = process.env.MANAGER_EMAIL || 'manager@smartparking.local';
    const managerPassword = process.env.MANAGER_PASSWORD || 'manager123456';
    let manager = await User.findOne({ email: managerEmail });
    if (!manager) {
      manager = await User.create({
        name: 'Facility Manager',
        email: managerEmail,
        password: managerPassword,
        role: 'MANAGER',
        status: 'ACTIVE',
        phone: '+8801700000001'
      });
      console.log(`[AutoSeed] Manager created: ${managerEmail}`);
    }

    // 3. Seed Demo Customer
    let customer = await User.findOne({ email: 'user@smartparking.local' });
    if (!customer) {
      customer = await User.create({
        name: 'Demo Customer',
        email: 'user@smartparking.local',
        password: 'user123456',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        phone: '+8801800000001'
      });
      console.log('[AutoSeed] Demo customer created: user@smartparking.local');
    }

    // 4. Seed Locations, Floors, Units, Slots
    for (const locData of DEMO_LOCATIONS) {
      const location = await ParkingLocation.findOneAndUpdate(
        { name: locData.name },
        locData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Assign manager to first location
      if (manager && location.name === (process.env.MANAGER_LOCATION_NAME || 'Bashundhara City Parking')) {
        if (!location.managerIds.some(id => id.toString() === manager._id.toString())) {
          location.managerIds.push(manager._id);
          await location.save();
        }
      }

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

        const unitsData = [
          { name: 'Unit A', code: 'A', status: 'ACTIVE' },
          { name: 'Unit B', code: 'B', status: 'ACTIVE' }
        ];

        for (const uData of unitsData) {
          const unit = await Unit.findOneAndUpdate(
            { floorId: floor._id, code: uData.code },
            { ...uData, floorId: floor._id },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          for (let i = 1; i <= 10; i++) {
            const slotNumber = `${floor.floorNumber}${unit.code}-${String(i).padStart(2, '0')}`;
            let vehicleTypes = ['CAR', 'SUV'];
            let status = 'AVAILABLE';

            if (i >= 7 && i <= 8) {
              vehicleTypes = ['MOTORCYCLE'];
            } else if (i === 9) {
              vehicleTypes = ['CAR', 'SUV', 'MICROBUS', 'VAN'];
            } else if (i === 10) {
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

    console.log('[AutoSeed] Sample facilities, floors, units, slots and users seeded successfully!');
  } catch (err) {
    console.error('[AutoSeed Error]', err.message);
  }
};
