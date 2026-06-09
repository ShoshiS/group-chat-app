import 'dotenv/config';

import { connectDB } from './config/database';

async function seedTemp(): Promise<void> {
  const connection = await connectDB();
  const temp = connection.collection('temp');

  const document = {
    message: 'Hello from group-chat-db',
    createdAt: new Date(),
  };

  const result = await temp.insertOne(document);

  console.log(`MongoDB connected (${connection.host} / ${connection.name})`);
  console.log('Inserted into temp:', result.insertedId.toString());
  console.log('Document:', { ...document, _id: result.insertedId });

  await connection.close();
}

try {
  await seedTemp();
} catch (error) {
  console.error('Seed failed:', (error as Error).message);
  process.exit(1);
}
