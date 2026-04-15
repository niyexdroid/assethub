import bcrypt from 'bcryptjs';
import { pool } from '../../config/database';
import { normalizePhone } from '../../utils/phoneNormalizer';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './strategies/jwt.strategy';
import { generateOtp, verifyOtp } from './strategies/otp.strategy';
import type { RegisterInput, LoginInput, ResetPasswordInput } from './auth.validators';

export class AuthService {
  async register(input: RegisterInput) {
    const phone = normalizePhone(input.phone_number);
    const { rows: existing } = await pool.query(
      'SELECT id, phone_number, email FROM users WHERE phone_number = $1 OR (email IS NOT NULL AND email = $2)',
      [phone, input.email ?? null]
    );
    if (existing.length > 0) {
      const conflict = existing[0];
      if (conflict.phone_number === phone) {
        throw Object.assign(new Error('This phone number is already registered. Please log in instead.'), { status: 409 });
      }
      throw Object.assign(new Error('This email address is already linked to another account.'), { status: 409 });
    }

    const password_hash = await bcrypt.hash(input.password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (phone_number, email, password_hash, first_name, last_name, role, package_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, phone_number, role, package_type`,
      [phone, input.email ?? null, password_hash, input.first_name, input.last_name, input.role, input.package_type ?? input.package ?? 'standard']
    );
    const user = rows[0];

    // Send OTP to verify phone
    const otp = await generateOtp(phone);
    return { user, otp }; // otp passed to notification service
  }

  async login(input: LoginInput) {
    const isPhone = /^\+?[0-9]/.test(input.identifier);
    const phone   = isPhone ? normalizePhone(input.identifier) : null;

    const { rows } = await pool.query(
      `SELECT id, phone_number, email, first_name, last_name, password_hash, role, package_type, is_active, is_verified
       FROM users WHERE ${isPhone ? 'phone_number' : 'email'} = $1`,
      [isPhone ? phone : input.identifier]
    );

    const user = rows[0];
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    if (!user.is_active) throw Object.assign(new Error('Account deactivated'), { status: 403 });

    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const tokenPayload = { sub: user.id, role: user.role };
    return {
      tokens: {
        access_token:  signAccessToken(tokenPayload),
        refresh_token: signRefreshToken(tokenPayload),
      },
      user: {
        id:           user.id,
        phone_number: user.phone_number,
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

  async requestOtp(phone_number: string) {
    const phone = normalizePhone(phone_number);
    const otp   = await generateOtp(phone);
    return { phone, otp };
  }

  async verifyPhone(phone_number: string, otp: string) {
    const phone = normalizePhone(phone_number);
    const valid = await verifyOtp(phone, otp);
    if (!valid) throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });

    const { rows } = await pool.query(
      `UPDATE users SET is_verified = true, updated_at = NOW()
       WHERE phone_number = $1
       RETURNING id, phone_number, email, first_name, last_name, role, package_type, is_verified`,
      [phone]
    );
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

  async resetPassword(input: ResetPasswordInput) {
    const phone = normalizePhone(input.phone_number);
    const valid = await verifyOtp(phone, input.otp);
    if (!valid) throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });

    const password_hash = await bcrypt.hash(input.new_password, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE phone_number = $2',
      [password_hash, phone]
    );
    return { reset: true };
  }
}
