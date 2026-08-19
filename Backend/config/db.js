const mongoose = require('mongoose');

async function connectDatabase() {
  const connectionString = process.env.MONGODB_URI;

  if (!connectionString) {
    console.warn('MONGODB_URI is not configured. Database connection was skipped.');
    return;
  }

  await mongoose.connect(connectionString);
}

module.exports = connectDatabase;
