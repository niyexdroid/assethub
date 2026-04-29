import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../../config/database';
import { redis } from '../../config/redis';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './strategies/jwt.strategy';
import { generateOtp, verifyOtp } from './strategies/otp.strategy';
import type { RegisterInput, LoginInput, ResetPasswordInput, GoogleCompleteInput } from './auth.validators';
import { NotificationsService } from '../notifications/notifications.service';

const notificationsService = new NotificationsService();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    return { email: input.email, otp };
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
    return {
      tokens: {
        access_token:  signAccessToken(tokenPayload),
        refresh_token: signRefreshToken(tokenPayload),
      },
      user,
    };
  }

  async resendVerification(email: string) {
    const { rows } = await pool.query(
      'SELECT id, is_verified FROM users WHERE email = $1',
      [email]
    );
    if (!rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });
    if (rows[0].is_verified) throw Object.assign(new Error('Email already verified'), { status: 400 });

    const otp = await generateOtp(email);
    return { email, otp, userId: rows[0].id };
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

    // Generate login OTP and a short-lived token that ties this login attempt to the OTP
    const login_token = randomUUID();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(
      `login:${login_token}`,
      JSON.stringify({ userId: user.id, role: user.role, email: user.email, otp }),
      'EX', LOGIN_OTP_TTL
    );

    return { requiresOtp: true as const, login_token, email: user.email, userId: user.id, otp };
  }

  async resendLoginOtp(login_token: string) {
    const raw = await redis.get(`login:${login_token}`);
    if (!raw) throw Object.assign(new Error('Session expired. Please log in again.'), { status: 400 });

    const pending = JSON.parse(raw) as { userId: string; role: string; email: string; otp: string };
    const newOtp  = Math.floor(100000 + Math.random() * 900000).toString();

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
    return {
      tokens: {
        access_token:  signAccessToken(tokenPayload),
        refresh_token: signRefreshToken(tokenPayload),
      },
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

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
    }
    const tokenPayload = { sub: payload.sub, role: payload.role };
    return {
      access_token:  signAccessToken(tokenPayload),
      refresh_token: signRefreshToken(tokenPayload),
    };
  }

  async googleAuth(idToken: string) {
    const validAudiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
    ].filter(Boolean) as string[];
    const ticket  = await googleClient.verifyIdToken({ idToken, audience: validAudiences });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw Object.assign(new Error('Invalid Google token'), { status: 400 });

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Check for existing account by google_id first, then fall back to email
    const { rows } = await pool.query(
      `SELECT id, email, first_name, last_name, role, package_type, is_verified
       FROM users WHERE google_id = $1 OR (email IS NOT NULL AND email = $2)
       LIMIT 1`,
      [googleId, email ?? null]
    );

    if (rows[0]) {
      const user = rows[0];
      // Link google_id if signing in by email match for the first time
      await pool.query(
        'UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2 AND google_id IS NULL',
        [googleId, user.id]
      );
      const tokenPayload = { sub: user.id, role: user.role };
      return {
        isNewUser: false as const,
        tokens: { access_token: signAccessToken(tokenPayload), refresh_token: signRefreshToken(tokenPayload) },
        user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role, package_type: user.package_type, is_verified: user.is_verified },
      };
    }

    // New user — return profile so the app can ask for role
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
    // Guard against duplicate registration
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
    return {
      tokens: { access_token: signAccessToken(tokenPayload), refresh_token: signRefreshToken(tokenPayload) },
      user,
    };
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
    return {
      tokens: {
        access_token:  signAccessToken(tokenPayload),
        refresh_token: signRefreshToken(tokenPayload),
      },
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role },
    };
  }

  async requestPasswordReset(email: string) {
    const otp = await generateOtp(email);
    return { email, otp };
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
    return { reset: true };
  }
}
