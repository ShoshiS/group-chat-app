import mongoose, { type Connection } from 'mongoose';

import { env } from './env.js';

export async function connectDB(): Promise<Connection> {
  const uri = env.mongoUri;

  if (!uri) {
    throw new Error(
      'MONGO_URI is not defined. Copy .env.example to .env and set your Atlas connection string.',
    );
  }

  await mongoose.connect(uri);
  return mongoose.connection;
}
