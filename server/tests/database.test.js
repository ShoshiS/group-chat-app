const { connectDB } = require('../src/config/database');

describe('connectDB', () => {
  const originalUri = process.env.MONGO_URI;

  afterEach(() => {
    if (originalUri === undefined) {
      delete process.env.MONGO_URI;
    } else {
      process.env.MONGO_URI = originalUri;
    }
  });

  it('throws a clear error when MONGO_URI is not defined', async () => {
    delete process.env.MONGO_URI;
    await expect(connectDB()).rejects.toThrow('MONGO_URI is not defined');
  });
});
