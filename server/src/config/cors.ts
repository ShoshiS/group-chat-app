import { env, isProduction } from './env';

/**
 * In development, ng serve may pick a random port when 4200 is busy.
 * Allow any localhost origin so the client connection check works without
 * updating CLIENT_ORIGIN on every restart.
 */
export const corsOptions = {
  origin: isProduction ? env.clientOrigin : /^http:\/\/localhost:\d+$/,
  credentials: true,
} as const;
