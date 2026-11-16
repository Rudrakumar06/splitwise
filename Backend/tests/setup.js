const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.DISABLE_RATE_LIMIT = 'true';
// Load .env before anything else so authController can read JWT_SECRET.
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

let mongoServer;

beforeAll(async () => {
  // Use an in-memory MongoDB so tests don't need a live Atlas cluster.
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clean all collections between tests for isolation.
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});