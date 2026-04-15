import bcrypt from 'bcryptjs';
import { pool } from '../../config/database';
import { normalizePhone } from '../../utils/phoneNormalizer';
import { generateOtp, verifyOtp } from '../auth/strategies/otp.strategy';
import type { UpdateProfileInput, ChangePasswordInput, ChangePhoneRequestInput, ChangePhoneVerifyInput } from './users.validators';

export class UsersService {

  async getProfile(userId: string) {
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, phone_number, email, role, package_type, is_verified, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    if (!rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });
    return rows[0];
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const fields: string[] = [];
    const values: any[]    = [];
    let   idx = 1;

    if (input.first_name !== undefined) { fields.push(`first_name  = $${idx++}`); values.push(input.first_name);  }
    if (input.last_name  !== undefined) { fields.push(`last_name   = $${idx++}`); values.push(input.last_name);   }
    if (input.email      !== undefined) { fields.push(`email       = $${idx++}`); values.push(input.email);       }
    if ((input as any).avatar_url !== undefined) { fields.push(`avatar_url  = $${idx++}`); values.push((input as any).avatar_url); }

    if (!fields.length) throw Object.assign(new Error('Nothing to update'), { status: 400 });

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, first_name, last_name, phone_number, email, role, package_type, is_verified`,
      values
    );
    return rows[0];
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    if (!rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });

    const valid = await bcrypt.compare(input.current_password, rows[0].password_hash);
    if (!valid) throw Object.assign(new Error('Current password is incorrect'), { status: 400 });

    const hash = await bcrypt.hash(input.new_password, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hash, userId]
    );
    return { success: true };
  }

  async requestPhoneChange(userId: string, input: ChangePhoneRequestInput) {
    const phone = normalizePhone(input.new_phone);

    // Check not already taken
    const { rows } = await pool.query(
      'SELECT id FROM users WHERE phone_number = $1 AND id != $2',
      [phone, userId]
    );
    if (rows.length) throw Object.assign(new Error('Phone number already in use'), { status: 409 });

    const otp = await generateOtp(phone);
    return { otp, phone }; // caller sends OTP via notification service
  }

  async saveFcmToken(userId: string, token: string) {
    await pool.query(
      'UPDATE users SET fcm_token = $1, updated_at = NOW() WHERE id = $2',
      [token, userId]
    );
  }

  async verifyPhoneChange(userId: string, input: ChangePhoneVerifyInput) {
    const phone = normalizePhone(input.new_phone);
    const valid = await verifyOtp(phone, input.otp);
    if (!valid) throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });

    const { rows } = await pool.query(
      `UPDATE users SET phone_number = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, first_name, last_name, phone_number, email, role, package_type, is_verified`,
      [phone, userId]
    );
    return rows[0];
  }
}
