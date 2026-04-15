import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { AuthTokenPayload } from '../../../types/user.types';

export function signAccessToken(payload: Omit<AuthTokenPayload, 'type'>): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as any,
  });
}

export function signRefreshToken(payload: Omit<AuthTokenPayload, 'type'>): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as any,
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthTokenPayload;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenPayload;
}
