import 'dotenv/config';

import mongoose from 'mongoose';
import { connectDB } from './config/database';
import { Group } from './models/group-model.js';
import { Message } from './models/message-model.js';

async function seedTemp(): Promise<void> {
  const connection = await connectDB();
  console.log(`MongoDB connected (${connection.host} / ${connection.name})`);

  const placeholderUserId = new mongoose.Types.ObjectId();

  const group = await Group.create({
    name: 'Test Group',
    description: 'Temporary seed group',
    adminId: placeholderUserId,
  });
  console.log('Created group:', group.id, '→ collection: groups');

  const message = await Message.create({
    groupId: group._id,
    senderId: placeholderUserId,
    text: 'Hello from seed!',
  });
  console.log('Created message:', message.id, '→ collection: messages');

  await Group.deleteOne({ _id: group._id });
  await Message.deleteOne({ _id: message._id });
  console.log('Seed documents cleaned up.');

  await connection.close();
}

try {
  await seedTemp();
} catch (error) {
  console.error('Seed failed:', (error as Error).message);
  process.exit(1);
}
