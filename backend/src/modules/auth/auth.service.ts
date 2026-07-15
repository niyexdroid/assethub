import bcrypt from 'bcryptjs';
import { randomUUID, randomInt } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../../config/database';
import { redis } from '../../config/redis';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  accessTokenTtlSeconds,
} from './strategies/jwt.strategy';
import type { LoginInput, CompleteProfileInput, GoogleCompleteInput } from './auth.validators';
import type { UserRole } from '../../types/user.types';
import { NotificationsService } from '../notifications/notifications.service';

const notificationsService = new NotificationsService();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

const LOGIN_OTP_TTL = 600; // 10 minutes
const PROFILE_TOKEN_TTL = 600; // 10 minutes

export class AuthService {
  /**
   * Passwordless login — initiate.
   * Sends OTP unconditionally whether the email is registered or not,
   * preventing account enumeration.
   */
  async login(input: LoginInput) {
    const { rows } = await pool.query(
      `SELECT id, email, first_name, last_name, role, is_active, is_verified
       FROM users WHERE email = $1`,
      [input.email]
    );

    const user = rows[0];

    // Existing user: check account status
    if (user) {
      if (!user.is_active) throw Object.assign(new Error('Account deactivated'), { status: 403 });
    }

    // Generate login OTP — unconditionally
    const login_token = randomUUID();
    const otp = randomInt(100000, 1000000).toString();

    const sessionData = user
      ? { userId: user.id, role: user.role, email: user.email, otp }
      : { email: input.email, otp, isNew: true };

    await redis.set(
      `login:${login_token}`,
      JSON.stringify(sessionData),
      'EX', LOGIN_OTP_TTL
    );

    // Send OTP email — fire-and-forget
    notificationsService.sendOtp(user?.id, input.email, otp).catch((err) => {
      console.error('[auth] Failed to send login OTP:', err.message ?? err);
    });

    return { login_token };
  }

  async resendLoginOtp(login_token: string) {
    const raw = await redis.get(`login:${login_token}`);
    if (!raw) throw Object.assign(new Error('Session expired. Please log in again.'), { status: 400 });

    const pending = JSON.parse(raw) as { userId?: string; role?: string; email: string; otp: string; isNew?: boolean };
    const newOtp  = randomInt(100000, 1000000).toString();

    const updatedData = pending.userId
      ? { ...pending, otp: newOtp }
      : { ...pending, otp: newOtp };

    await redis.set(
      `login:${login_token}`,
      JSON.stringify(updatedData),
      'EX', LOGIN_OTP_TTL
    );

    await notificationsService.sendOtp(pending.userId, pending.email, newOtp);
    return { message: 'OTP resent' as const };
  }

  /**
   * Verify login OTP.
   * Existing user → returns tokens.
   * New user → returns profile_token for account completion.
   */
  async verifyLoginOtp(login_token: string, otp: string) {
    const raw = await redis.get(`login:${login_token}`);
    if (!raw) throw Object.assign(new Error('Session expired. Please log in again.'), { status: 400 });

    const pending = JSON.parse(raw) as { userId?: string; role?: string; email: string; otp: string; isNew?: boolean };
    if (pending.otp !== otp) throw Object.assign(new Error('Invalid or expired code'), { status: 400 });

    await redis.del(`login:${login_token}`);

    // New user — issue profile token so they can complete registration
    if (pending.isNew) {
      const profile_token = randomUUID();
      await redis.set(
        `profile:${profile_token}`,
        JSON.stringify({ email: pending.email }),
        'EX', PROFILE_TOKEN_TTL
      );
      return { isNewUser: true as const, profile_token };
    }

    // Existing user — issue tokens
    const { rows } = await pool.query(
      `SELECT id, email, first_name, last_name, role, package_type, is_verified FROM users WHERE id = $1`,
      [pending.userId!]
    );
    const user = rows[0];

    // Auto-verify email on first OTP login (for legacy unverified accounts)
    if (user && !user.is_verified) {
      await pool.query('UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = $1', [user.id]);
      user.is_verified = true;
    }

    const tokenPayload = { sub: user.id, role: user.role };
    const tokens = await this._issueTokenPair(tokenPayload);
    return {
      tokens,
      user: {
        id:           user.id,
        email:        user.email,
        first_name:   user.first_name,
        last_name:    user.last_name,
        role:         user.role,
        package_type: user.package_type,
        is_verified:  user.is_verified,
      },
    };
  }

  /**
   * Complete profile for a new user after OTP verification.
   * The profile_token proves the email was verified via OTP.
   */
  async completeProfile(input: CompleteProfileInput) {
    const raw = await redis.get(`profile:${input.profile_token}`);
    if (!raw) throw Object.assign(new Error('Session expired. Please start again.'), { status: 400 });

    const { email } = JSON.parse(raw) as { email: string };

    // Race condition guard: check email not already taken
    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.length > 0) {
      // Email already registered — just sign them in
      await redis.del(`profile:${input.profile_token}`);
      const user = existing[0];
      const { rows: fullUser } = await pool.query(
        'SELECT id, email, first_name, last_name, role, package_type, is_verified FROM users WHERE id = $1',
        [user.id]
      );
      const u = fullUser[0];
      const tokenPayload = { sub: u.id, role: u.role };
      const tokens = await this._issueTokenPair(tokenPayload);
      return {
        tokens,
        user: {
          id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name,
          role: u.role, package_type: u.package_type, is_verified: u.is_verified,
        },
      };
    }

    // Create the user — already verified via OTP
    const { rows } = await pool.query(
      `INSERT INTO users (email, first_name, last_name, role, package_type, is_verified)
       VALUES ($1,$2,$3,$4,$5,true)
       RETURNING id, email, first_name, last_name, role, package_type, is_verified`,
      [email, input.first_name, input.last_name, input.role, input.package_type ?? input.package ?? 'standard']
    );

    await redis.del(`profile:${input.profile_token}`);

    const user = rows[0];
    const tokenPayload = { sub: user.id, role: user.role };
    const tokens = await this._issueTokenPair(tokenPayload);
    return { tokens, user };
  }

  /**
   * Refresh token rotation:
   * - Verify the token, check it hasn't been used before (reuse = theft).
   * - If reused, revoke the entire family (all tokens for that user/session).
   * - Issue a fresh pair with the same family so the chain continues.
   */
  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
    }

    const family = payload.family;
    const jti = payload.jti;
    const userId = payload.sub;

    if (family) {
      // Check family state in Redis
      const storedJti = await redis.get(`refresh_family:${userId}:${family}`);

      if (!storedJti) {
        // Family missing: either expired or already revoked — reject
        // Revoke all families for this user to be safe (possible token theft)
        await this._revokeAllRefreshFamilies(userId);
        throw Object.assign(new Error('Token family revoked. Please re-authenticate.'), { status: 401 });
      }

      if (storedJti !== jti) {
        // Reuse detected! The token presented was already used (stored JTI is different).
        // This is a strong signal of token theft — revoke everything.
        await this._revokeAllRefreshFamilies(userId);
        throw Object.assign(new Error('Token reuse detected. All sessions revoked.'), { status: 401 });
      }

      // Valid rotation: mark old jti as used, issue new tokens in same family
      const newTokenPayload = { sub: payload.sub, role: payload.role as UserRole };
      const newAccessToken  = signAccessToken(newTokenPayload);
      const newRefreshToken = signRefreshToken(newTokenPayload, family);

      // Update family to point to the NEW jti (extract from new refresh token)
      const newPayload = verifyRefreshToken(newRefreshToken);
      const refreshTtl = await this._refreshTokenTtlSeconds();
      await redis.set(`refresh_family:${userId}:${family}`, newPayload.jti, 'EX', refreshTtl);

      return { access_token: newAccessToken, refresh_token: newRefreshToken };
    }

    // Legacy path: token has no family (shouldn't happen after migration, but handle gracefully)
    const tokenPayload = { sub: payload.sub, role: payload.role };
    const tokens = await this._issueTokenPair(tokenPayload);
    return tokens;
  }

  /**
   * Logout: blocklist the access token by jti and revoke the refresh family.
   */
  async logout(accessToken: string, refreshToken?: string) {
    // Blocklist the access token for its remaining lifetime
    try {
      const atPayload = verifyAccessToken(accessToken);
      await redis.set(`blocklist:${atPayload.jti}`, '1', 'EX', accessTokenTtlSeconds());
    } catch {
      // Access token invalid/expired — nothing to blocklist
    }

    // Revoke refresh token family
    if (refreshToken) {
      try {
        const rtPayload = verifyRefreshToken(refreshToken);
        if (rtPayload.family) {
          await this._revokeRefreshFamily(rtPayload.sub, rtPayload.family);
        }
      } catch {
        // Refresh token already invalid — fine
      }
    }
  }

  async googleAuth(idToken?: string, code?: string, redirectUri?: string) {
    const validAudiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
    ].filter(Boolean) as string[];

    // If auth code provided, exchange it for tokens first
    if (code) {
      const tokenOpts: any = { code };
      if (redirectUri) tokenOpts.redirect_uri = redirectUri;
      const { tokens } = await googleClient.getToken(tokenOpts);
      if (!tokens.id_token) {
        throw Object.assign(new Error('Failed to get ID token from auth code'), { status: 400 });
      }
      idToken = tokens.id_token;
    }

    if (!idToken) {
      throw Object.assign(new Error('No ID token provided'), { status: 400 });
    }

    const ticket  = await googleClient.verifyIdToken({ idToken, audience: validAudiences });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw Object.assign(new Error('Invalid Google token'), { status: 400 });

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    const { rows } = await pool.query(
      `SELECT id, email, first_name, last_name, role, package_type, is_verified
       FROM users WHERE google_id = $1 OR (email IS NOT NULL AND email = $2)
       LIMIT 1`,
      [googleId, email ?? null]
    );

    if (rows[0]) {
      const user = rows[0];
      await pool.query(
        'UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2 AND google_id IS NULL',
        [googleId, user.id]
      );
      const tokenPayload = { sub: user.id, role: user.role };
      const tokens = await this._issueTokenPair(tokenPayload);
      return {
        isNewUser: false as const,
        tokens,
        user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role, package_type: user.package_type, is_verified: user.is_verified },
      };
    }

    return {
      isNewUser: true as const,
      profile: {
        googleId,
        email:      email ?? '',
        first_name: given_name ?? '',
        last_name:  family_name ?? '',
        avatar_url: picture,
      },
    };
  }

  async googleComplete(input: GoogleCompleteInput) {
    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE google_id = $1 OR email = $2',
      [input.googleId, input.email]
    );
    if (existing.length > 0) throw Object.assign(new Error('Account already exists. Please sign in.'), { status: 409 });

    const { rows } = await pool.query(
      `INSERT INTO users (google_id, email, first_name, last_name, role, package_type, is_verified, avatar_url)
       VALUES ($1,$2,$3,$4,$5,$6,true,$7)
       RETURNING id, email, first_name, last_name, role, package_type, is_verified`,
      [input.googleId, input.email, input.first_name, input.last_name, input.role, input.package ?? 'standard', input.avatar_url ?? null]
    );
    const user = rows[0];
    const tokenPayload = { sub: user.id, role: user.role };
    const tokens = await this._issueTokenPair(tokenPayload);
    return { tokens, user };
  }

  async adminLogin(email: string, password: string) {
    const { rows } = await pool.query(
      `SELECT id, email, first_name, last_name, password_hash, role, is_active
       FROM users WHERE email = $1 AND role = 'admin'`,
      [email]
    );
    const user = rows[0];
    if (!user || !user.password_hash) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    if (!user.is_active) throw Object.assign(new Error('Account deactivated'), { status: 403 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const tokenPayload = { sub: user.id, role: user.role };
    const tokens = await this._issueTokenPair(tokenPayload);
    return {
      tokens,
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role },
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Issues a new access + refresh token pair with rotation tracking.
   * Creates a fresh refresh token family in Redis.
   */
  private async _issueTokenPair(payload: { sub: string; role: UserRole }) {
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload); // creates new family

    const rtPayload = verifyRefreshToken(refreshToken);
    const refreshTtl = await this._refreshTokenTtlSeconds();
    await redis.set(
      `refresh_family:${payload.sub}:${rtPayload.family}`,
      rtPayload.jti,
      'EX', refreshTtl,
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  private async _revokeRefreshFamily(userId: string, family: string) {
    await redis.del(`refresh_family:${userId}:${family}`);
  }

  private async _revokeAllRefreshFamilies(userId: string) {
    const keys = await redis.keys(`refresh_family:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  private async _refreshTokenTtlSeconds(): Promise<number> {
    const raw = process.env.JWT_REFRESH_EXPIRES || '30d';
    const m = raw.match(/^(\d+)([smhd])$/);
    if (!m) return 2592000; // default 30 days
    const v = Number(m[1]);
    switch (m[2]) {
      case 's': return v;
      case 'm': return v * 60;
      case 'h': return v * 3600;
      case 'd': return v * 86400;
      default:  return 2592000;
    }
  }
}
