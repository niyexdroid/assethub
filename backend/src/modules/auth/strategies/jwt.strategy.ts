import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../../../config/env';
import { AuthTokenPayload } from '../../../types/user.types';

export function signAccessToken(payload: Omit<AuthTokenPayload, 'type' | 'jti'>): string {
  return jwt.sign({ ...payload, type: 'access', jti: randomUUID() }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as any,
  });
}

/**
 * Signs a refresh token with jti and family for rotation tracking.
 * `family` is reused across rotations; a new `jti` is issued each time.
 */
export function signRefreshToken(
  payload: Omit<AuthTokenPayload, 'type' | 'jti'>,
  family?: string,
): string {
  return jwt.sign(
    { ...payload, type: 'refresh', jti: randomUUID(), family: family ?? randomUUID() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES as any },
  );
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthTokenPayload;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenPayload;
}

/** TTL in seconds — how long to keep a blocklisted access token in Redis. */
function accessTokenTtlSeconds(): number {
  const raw = env.JWT_ACCESS_EXPIRES;
  const m = raw.match(/^(\d+)([smhd])$/);
  if (!m) return 900; // default 15 min
  const v = Number(m[1]);
  switch (m[2]) {
    case 's': return v;
    case 'm': return v * 60;
    case 'h': return v * 3600;
    case 'd': return v * 86400;
    default:  return 900;
  }
}

export { accessTokenTtlSeconds };
