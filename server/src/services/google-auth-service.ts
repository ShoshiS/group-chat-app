import { OAuth2Client } from 'google-auth-library';

import { env } from '../config/env.js';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}

let client: OAuth2Client | undefined;

function getClient(): OAuth2Client {
  if (!env.googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  client ??= new OAuth2Client(env.googleClientId);
  return client;
}

/** Verifies a Google Identity Services ID token and returns normalized profile fields. */
export async function verifyGoogleIdToken(credential: string): Promise<GoogleProfile> {
  const ticket = await getClient().verifyIdToken({
    idToken: credential,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) {
    throw new Error('Invalid Google token');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name,
    picture: payload.picture,
  };
}

export function isGoogleAuthConfigured(): boolean {
  return env.googleClientId.length > 0;
}

/** Public OAuth client ID for the Google Identity Services button (safe to expose). */
export function getGoogleClientId(): string {
  return env.googleClientId;
}
