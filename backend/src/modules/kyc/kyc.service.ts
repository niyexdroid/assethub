import { pool } from '../../config/database';
import { encrypt } from '../../utils/crypto';
import { verifyBvn } from './providers/paystack-identity.provider';
import { verifyNin } from './providers/nimc.provider';
import { generateOtp, verifyOtp } from '../auth/strategies/otp.strategy';

export class KycService {
  async submitBvn(userId: string, bvn: string) {
    const result = await verifyBvn(bvn);

    const encryptedBvn = encrypt(bvn);
    await pool.query(
      `INSERT INTO kyc_verifications (user_id, bvn, bvn_verified, id_doc_type, verification_status)
       VALUES ($1, $2, $3, 'bvn', $4)
       ON CONFLICT (user_id) DO UPDATE
         SET bvn = $2, bvn_verified = $3, verification_status = $4, id_doc_type = 'bvn'`,
      [userId, encryptedBvn, result.verified, result.verified ? 'approved' : 'pending']
    );
    return { verified: result.verified };
  }

  async submitNin(userId: string, nin: string) {
    // NIMC API not yet live — store encrypted, mark pending for manual review
    await verifyNin(nin);
    const encryptedNin = encrypt(nin);
    await pool.query(
      `INSERT INTO kyc_verifications (user_id, nin, nin_verified, id_doc_type, verification_status)
       VALUES ($1, $2, false, 'nin', 'pending')
       ON CONFLICT (user_id) DO UPDATE
         SET nin = $2, nin_verified = false, id_doc_type = 'nin', verification_status = 'pending'`,
      [userId, encryptedNin]
    );
    return { status: 'pending', message: 'NIN submitted for review' };
  }

  async submitStudentId(userId: string, studentIdUrl: string, schoolName: string, schoolEmail?: string) {
    await pool.query(
      `INSERT INTO kyc_verifications (user_id, student_id_url, school_name, school_email, id_doc_type, verification_status)
       VALUES ($1, $2, $3, $4, 'student_id', 'pending')
       ON CONFLICT (user_id) DO UPDATE
         SET student_id_url = $2, school_name = $3, school_email = $4,
             id_doc_type = 'student_id', verification_status = 'pending'`,
      [userId, studentIdUrl, schoolName, schoolEmail ?? null]
    );

    if (schoolEmail) {
      const otp = await generateOtp(schoolEmail);
      return { status: 'pending', otp }; // otp passed to notification service to send to school email
    }
    return { status: 'pending' };
  }

  async verifySchoolEmail(userId: string, otp: string) {
    const { rows } = await pool.query(
      'SELECT school_email FROM kyc_verifications WHERE user_id = $1',
      [userId]
    );
    if (!rows[0]?.school_email) throw Object.assign(new Error('No school email on record'), { status: 400 });

    const valid = await verifyOtp(rows[0].school_email, otp);
    if (!valid) throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });

    await pool.query(
      'UPDATE kyc_verifications SET school_email_verified = true WHERE user_id = $1',
      [userId]
    );
    return { verified: true };
  }

  async getStatus(userId: string) {
    const { rows } = await pool.query(
      'SELECT bvn_verified, nin_verified, student_id_url, school_email_verified, verification_status, rejection_reason FROM kyc_verifications WHERE user_id = $1',
      [userId]
    );
    return rows[0] ?? { verification_status: 'not_started' };
  }
}
