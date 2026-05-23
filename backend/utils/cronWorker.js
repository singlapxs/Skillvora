const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const mongoose = require('mongoose');
const { processEmailQueue } = require('./emailService');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  try {
    console.log("[Cron Worker] Starting email queue processing...");
    await connectDB();
    await processEmailQueue();
    console.log("[Cron Worker] Email queue processing completed.");
  } catch (error) {
    console.error("[Cron Worker] Error during execution:", error);
  } finally {
    try {
      await mongoose.connection.close();
      console.log("[Cron Worker] Database connection closed.");
    } catch (closeErr) {
      console.error("[Cron Worker] Error closing database connection:", closeErr);
    }
    process.exit(0);
  }
};

run();
