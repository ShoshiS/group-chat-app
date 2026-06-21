import dotenv from 'dotenv';
import type { StringValue } from 'ms';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
// override: true ensures .env changes apply on tsx hot reload (dotenv skips existing keys by default)
dotenv.config({ path: envPath, override: true });

/**
 * Central, typed access to environment variables. Reading them in one place
 * keeps the rest of the codebase free of `process.env` lookups and makes the
 * required configuration explicit.
 */
export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: process.env.MONGO_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as StringValue,
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:4200',
  googleClientId: (process.env.GOOGLE_CLIENT_ID ?? '').trim(),
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  cloudinary: {
    cloudName: (process.env.CLOUDINARY_CLOUD_NAME ?? '').trim(),
    apiKey: (process.env.CLOUDINARY_API_KEY ?? '').trim(),
    apiSecret: (process.env.CLOUDINARY_API_SECRET ?? '').trim(),
  },
  upload: {
    maxFileSizeBytes: Number(process.env.MAX_FILE_SIZE_MB ?? 10) * 1024 * 1024,
  },
} as const;

export const isProduction = env.nodeEnv === 'production';
