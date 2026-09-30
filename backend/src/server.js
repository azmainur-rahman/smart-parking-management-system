import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/database.js';

import Booking from './models/Booking.js';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start HTTP Server
    app.listen(PORT, () => {
      console.log(`[Server] Server running on port ${PORT} in ${NODE_ENV} mode`);
    });

    // Sweep: Run every 60 seconds to expire unpaid holds
    setInterval(async () => {
      try {
        const now = new Date();
        const result = await Booking.updateMany(
          {
            bookingStatus: 'PENDING_PAYMENT',
            holdExpiresAt: { $lt: now }
          },
          {
            $set: { bookingStatus: 'EXPIRED' }
          }
        );
        if (result.modifiedCount > 0) {
          console.log(`[Hold Sweep] Expired ${result.modifiedCount} unpaid booking hold(s).`);
        }
      } catch (err) {
        console.error('[Hold Sweep Error]', err.message);
      }
    }, 60000);
  } catch (error) {
    console.error(`[Server] Startup error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
