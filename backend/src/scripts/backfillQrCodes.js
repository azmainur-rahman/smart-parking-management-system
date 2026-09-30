import 'dotenv/config';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';

const backfillQrCodes = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error('[Backfill Error] MONGO_URI is not set in environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('[Backfill] Connected to MongoDB.');

    // Find all CONFIRMED bookings where qrCode is missing or not equal to bookingNumber
    const bookings = await Booking.find({
      bookingStatus: 'CONFIRMED'
    });

    let updatedCount = 0;
    for (const b of bookings) {
      if (b.qrCode !== b.bookingNumber) {
        b.qrCode = b.bookingNumber;
        await b.save();
        updatedCount++;
      }
    }

    console.log(`[Backfill] Successfully backfilled qrCode for ${updatedCount} confirmed bookings (Total checked: ${bookings.length}).`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Backfill Error] Failed:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

backfillQrCodes();
