const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't exit process, allow app to run without DB for demo purposes
    console.log('⚠️  App will continue without database (messages won\'t persist)');
  }
};

module.exports = connectDB;
