import { pool } from '../../config/database';
import type { SubmitVerificationInput, RejectVerificationInput } from './verifications.validator';

export class VerificationsService {
  async submit(landlordId: string, input: SubmitVerificationInput) {
    // Prevent duplicate pending submissions of the same type
    const { rows: existing } = await pool.query(
      `SELECT 1 FROM landlord_verifications
       WHERE landlord_id = $1 AND verification_type = $2 AND status = 'pending'`,
      [landlordId, input.verification_type],
    );
    if (existing[0]) {
      throw Object.assign(
        new Error(`You already have a pending ${input.verification_type} verification`),
        { status: 409 },
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO landlord_verifications (landlord_id, verification_type, document_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [landlordId, input.verification_type, input.document_url],
    );
    return rows[0];
  }

  async listByLandlord(landlordId: string) {
    const { rows } = await pool.query(
      `SELECT * FROM landlord_verifications
       WHERE landlord_id = $1
       ORDER BY created_at DESC`,
      [landlordId],
    );
    return rows;
  }

  async listPending() {
    const { rows } = await pool.query(
      `SELECT v.*, u.first_name || ' ' || u.last_name AS landlord_name, u.email AS landlord_email
       FROM landlord_verifications v
       JOIN users u ON u.id = v.landlord_id
       WHERE v.status = 'pending'
       ORDER BY v.created_at ASC`,
    );
    return rows;
  }

  async approve(verificationId: string, reviewerId: string) {
    const { rows: current } = await pool.query(
      `SELECT status FROM landlord_verifications WHERE id = $1`,
      [verificationId],
    );
    if (!current[0]) {
      throw Object.assign(new Error('Verification not found'), { status: 404 });
    }
    if (current[0].status !== 'pending') {
      throw Object.assign(new Error(`Verification already ${current[0].status}`), { status: 409 });
    }

    const { rows } = await pool.query(
      `UPDATE landlord_verifications
       SET status = 'approved', reviewed_by = $1, verified_at = NOW()
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [reviewerId, verificationId],
    );
    if (!rows[0]) {
      throw Object.assign(new Error('Verification not found or already reviewed'), { status: 404 });
    }
    // Badge recomputation handled by DB trigger
    return rows[0];
  }

  async reject(verificationId: string, reviewerId: string, input: RejectVerificationInput) {
    const { rows: current } = await pool.query(
      `SELECT status FROM landlord_verifications WHERE id = $1`,
      [verificationId],
    );
    if (!current[0]) {
      throw Object.assign(new Error('Verification not found'), { status: 404 });
    }
    if (current[0].status !== 'pending') {
      throw Object.assign(new Error(`Verification already ${current[0].status}`), { status: 409 });
    }

    const { rows } = await pool.query(
      `UPDATE landlord_verifications
       SET status = 'rejected', reviewed_by = $1, rejection_reason = $2, verified_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [reviewerId, input.reason, verificationId],
    );
    if (!rows[0]) {
      throw Object.assign(new Error('Verification not found or already reviewed'), { status: 404 });
    }
    return rows[0];
  }
}
