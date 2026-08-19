require('dotenv').config();

const app = require('./app');
const connectDatabase = require('./config/db');

const port = process.env.PORT || 5000;

connectDatabase()
  .then(() => app.listen(port, () => console.log(`Server listening on port ${port}`)))
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });
