require('dotenv').config();

const { connectDB } = require('./config/database');

connectDB()
  .then((connection) => {
    console.log(`MongoDB connected successfully (${connection.host} / ${connection.name})`);
    return connection.close();
  })
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
