require('dotenv').config();

const { connectDB } = require('./config/database');

async function seedTemp() {
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

seedTemp().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
