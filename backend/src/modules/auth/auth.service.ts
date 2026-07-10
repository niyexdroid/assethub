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
import { generateOtp, verifyOtp } from './strategies/otp.strategy';
import type { RegisterInput, LoginInput, ResetPasswordInput, GoogleCompleteInput } from './auth.validators';
import type { UserRole } from '../../types/user.types';
import { NotificationsService } from '../notifications/notifications.service';

const notificationsService = new NotificationsService();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

const LOGIN_OTP_TTL = 600; // 10 minutes

export class AuthService {
  async register(input: RegisterInput) {
    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [input.email]
    );
    if (existing.length > 0) {
      throw Object.assign(new Error('This email is already registered. Please sign in instead.'), { status: 409 });
    }

    const password_hash = await bcrypt.hash(input.password, 12);
    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, package_type, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6,false)`,
      [input.email, password_hash, input.first_name, input.last_name, input.role, input.package_type ?? input.package ?? 'standard']
    );

    const otp = await generateOtp(input.email);

    // Look up newly created user to send OTP notification
    const { rows: newUser } = await pool.query(
      'SELECT id FROM users WHERE email = $1', [input.email]
    );
    if (newUser[0]) {
      notificationsService.sendOtp(newUser[0].id, input.email, otp).catch(() => {});
    }

    return { email: input.email };
  }

  async verifyEmail(email: string, otp: string) {
    const valid = await verifyOtp(email, otp);
    if (!valid) throw Object.assign(new Error('Invalid or expired code'), { status: 400 });

    const { rows } = await pool.query(
      `UPDATE users SET is_verified = true, updated_at = NOW()
       WHERE email = $1
       RETURNING id, email, first_name, last_name, role, package_type, is_verified`,
      [email]
    );
    if (!rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });

    const user = rows[0];
    const tokenPayload = { sub: user.id, role: user.role };
    const tokens = await this._issueTokenPair(tokenPayload);
    return { tokens, user };
  }

  async resendVerification(email: string) {
    const { rows } = await pool.query(
      'SELECT id, is_verified FROM users WHERE email = $1',
      [email]
    );
    if (!rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });
    if (rows[0].is_verified) throw Object.assign(new Error('Email already verified'), { status: 400 });

    const otp = await generateOtp(email);
    notificationsService.sendOtp(rows[0].id, email, otp).catch(() => {});
    return { message: 'Verification code resent.' as const };
  }

  async login(input: LoginInput) {
    const { rows } = await pool.query(
      `SELECT id, email, first_name, last_name, password_hash, role, package_type, is_active, is_verified
       FROM users WHERE email = $1`,
      [input.email]
    );

    const user = rows[0];
    if (!user || !user.password_hash) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    if (!user.is_active) throw Object.assign(new Error('Account deactivated'), { status: 403 });
    if (!user.is_verified) throw Object.assign(new Error('EMAIL_NOT_VERIFIED'), { status: 403 });

    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    // Generate login OTP — store in Redis, send via notification channel only
    const login_token = randomUUID();
    const otp = randomInt(100000, 1000000).toString();
    await redis.set(
      `login:${login_token}`,
      JSON.stringify({ userId: user.id, role: user.role, email: user.email, otp }),
      'EX', LOGIN_OTP_TTL
    );

    // Fire-and-forget — don't block the response waiting for notification delivery
    notificationsService.sendOtp(user.id, user.email, otp).catch(() => {});

    // OTP is never returned to client — sent only via notification channel
    return { requiresOtp: true as const, login_token };
  }

  async resendLoginOtp(login_token: string) {
    const raw = await redis.get(`login:${login_token}`);
    if (!raw) throw Object.assign(new Error('Session expired. Please log in again.'), { status: 400 });

    const pending = JSON.parse(raw) as { userId: string; role: string; email: string; otp: string };
    const newOtp  = randomInt(100000, 1000000).toString();

    await redis.set(
      `login:${login_token}`,
      JSON.stringify({ ...pending, otp: newOtp }),
      'EX', LOGIN_OTP_TTL
    );

    await notificationsService.sendOtp(pending.userId, pending.email, newOtp);
    return { message: 'OTP resent' };
  }

  async verifyLoginOtp(login_token: string, otp: string) {
    const raw = await redis.get(`login:${login_token}`);
    if (!raw) throw Object.assign(new Error('Session expired. Please log in again.'), { status: 400 });

    const pending = JSON.parse(raw) as { userId: string; role: string; email: string; otp: string };
    if (pending.otp !== otp) throw Object.assign(new Error('Invalid or expired code'), { status: 400 });

    await redis.del(`login:${login_token}`);

    const { rows } = await pool.query(
      `SELECT id, email, first_name, last_name, role, package_type, is_verified FROM users WHERE id = $1`,
      [pending.userId]
    );
    const user = rows[0];

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

  async requestPasswordReset(email: string) {
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    );
    if (!rows[0]) {
      // User not found — return gracefully to prevent email enumeration
      return { message: 'If that email is registered, a reset code has been sent.' as const };
    }
    const otp = await generateOtp(email);
    notificationsService.sendOtp(rows[0].id, email, otp).catch(() => {});
    return { message: 'If that email is registered, a reset code has been sent.' as const };
  }

  async resetPassword(input: ResetPasswordInput) {
    const valid = await verifyOtp(input.email, input.otp);
    if (!valid) throw Object.assign(new Error('Invalid or expired code'), { status: 400 });

    const password_hash = await bcrypt.hash(input.new_password, 12);
    const { rows } = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id',
      [password_hash, input.email]
    );
    if (!rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });

    // Invalidate all refresh families on password reset
    await this._revokeAllRefreshFamilies(rows[0].id);

    return { reset: true };
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
