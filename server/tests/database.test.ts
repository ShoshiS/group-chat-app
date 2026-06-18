import { jest } from '@jest/globals';

await jest.unstable_mockModule('../src/config/env.js', () => ({
  env: {
    mongoUri: '',
  },
}));

const { connectDB } = await import('../src/config/database.js');

describe('connectDB', () => {
  it('throws a clear error when MONGO_URI is not defined', async () => {
    await expect(connectDB()).rejects.toThrow('MONGO_URI is not defined');
  });
});
