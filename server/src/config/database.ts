import mongoose, { type Connection } from 'mongoose';

export async function connectDB(): Promise<Connection> {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      'MONGO_URI is not defined. Copy .env.example to .env and set your Atlas connection string.',
    );
  }

  await mongoose.connect(uri);
  return mongoose.connection;
}
