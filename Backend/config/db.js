const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function connectDatabase() {
  const connectionString = process.env.MONGODB_URI;

  if (connectionString) {
    try {
      await mongoose.connect(connectionString);
      console.log('Connected to MongoDB Atlas.');
      return;
    } catch (error) {
      console.warn(
        `Atlas connection failed (${error.message}). Falling back to in-memory MongoDB for local development.`,
      );
    }
  } else {
    console.warn('MONGODB_URI not configured. Using in-memory MongoDB.');
  }

  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log(`Connected to in-memory MongoDB at ${uri}.`);
}

module.exports = connectDatabase;