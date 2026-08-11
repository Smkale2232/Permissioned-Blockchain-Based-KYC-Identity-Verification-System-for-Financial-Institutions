const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/docchain';

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    logger.info(`MongoDB connected → ${uri}`);
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    // Fail fast — a running API against no database hides real errors later.
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected.');
  });
}

module.exports = connectDB;
