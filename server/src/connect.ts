import 'dotenv/config';

import { connectDB } from './config/database';

try {
  const connection = await connectDB();
  console.log(`MongoDB connected successfully (${connection.host} / ${connection.name})`);
  await connection.close();
  process.exit(0);
} catch (error) {
  console.error('MongoDB connection failed:', (error as Error).message);
  process.exit(1);
}
