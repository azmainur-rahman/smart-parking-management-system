import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/database.js';

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
  } catch (error) {
    console.error(`[Server] Startup error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
