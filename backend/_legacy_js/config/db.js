const mongoose = require('mongoose');

/**
 * Connects to MongoDB using Mongoose.
 * Exits the process on failure so the app never runs against a dead DB.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in the environment (.env)');
    }

    const options = {};
    if (uri.includes('.mongodb.net')) {
      // Atlas requires TLS when using an explicit host list.
      options.tls = true;
    }

    const conn = await mongoose.connect(uri, options);

    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
