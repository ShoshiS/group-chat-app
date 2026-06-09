import 'dotenv/config';

/**
 * Central, typed access to environment variables. Reading them in one place
 * keeps the rest of the codebase free of `process.env` lookups and makes the
 * required configuration explicit.
 */
export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:4200',
} as const;

export const isProduction = env.nodeEnv === 'production';
