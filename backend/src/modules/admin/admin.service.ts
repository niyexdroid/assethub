import { pool } from '../../config/database';
import { NotificationsService } from '../notifications/notifications.service';

const notifSvc = new NotificationsService();

export class AdminService {
  // ── Users ──────────────────────────────────────────────────────────────────

  async listUsers(page = 1, limit = 30, role?: string) {
    const offset = (page - 1) * limit;
    const where  = role ? `WHERE role = '${role}'` : '';
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, phone_number, email, role,
              package_type, is_verified, is_active, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  }

  async getUser(userId: string) {
    const { rows } = await pool.query(
      `SELECT u.*, k.bvn_verified, k.nin_verified, k.student_id_url,
              k.verification_status AS kyc_status, k.rejection_reason AS kyc_rejection
       FROM users u
       LEFT JOIN kyc_verifications k ON k.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    if (!rows[0]) throw Object.assign(new Error('User not found'), { status: 404 });
    return rows[0];
  }

  // ── KYC ────────────────────────────────────────────────────────────────────

  async listPendingKyc() {
    const { rows } = await pool.query(
      `SELECT k.*, u.first_name, u.last_name, u.phone_number, u.role, u.package_type
       FROM kyc_verifications k
       JOIN users u ON u.id = k.user_id
       WHERE k.verification_status = 'pending'
       ORDER BY k.created_at ASC`
    );
    return rows;
  }

  async approveKyc(userId: string, adminId: string) {
    await pool.query(
      `UPDATE kyc_verifications
       SET verification_status = 'approved', verified_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
    await pool.query(
      'UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = $1',
      [userId]
    );
    await this._auditLog(adminId, 'kyc.approved', 'kyc_verifications', userId);

    await notifSvc.send({
      userId, type: 'kyc_approved',
      title: 'Identity Verified',
      body:  'Your identity has been verified. You now have full access.',
      channels: ['whatsapp', 'push', 'email'],
    });
  }

  async rejectKyc(userId: string, adminId: string, reason: string) {
    await pool.query(
      `UPDATE kyc_verifications
       SET verification_status = 'rejected', rejection_reason = $1
       WHERE user_id = $2`,
      [reason, userId]
    );
    await this._auditLog(adminId, 'kyc.rejected', 'kyc_verifications', userId, { reason });

    await notifSvc.send({
      userId, type: 'kyc_rejected',
      title: 'Verification Failed',
      body:  `Your KYC was rejected: ${reason}`,
      channels: ['whatsapp', 'push', 'email'],
      data:  { reason },
    });
  }

  // ── Properties ─────────────────────────────────────────────────────────────

  async listPendingProperties() {
    const { rows } = await pool.query(
      `SELECT p.*, u.first_name AS landlord_first, u.last_name AS landlord_last, u.phone_number
       FROM properties p
       JOIN users u ON u.id = p.landlord_id
       WHERE p.approval_status = 'pending'
       ORDER BY p.created_at ASC`
    );
    return rows;
  }

  async approveProperty(propertyId: string, adminId: string) {
    const { rows } = await pool.query(
      `UPDATE properties SET approval_status = 'approved', updated_at = NOW()
       WHERE id = $1 RETURNING landlord_id, title`,
      [propertyId]
    );
    if (!rows[0]) throw Object.assign(new Error('Property not found'), { status: 404 });
    await this._auditLog(adminId, 'property.approved', 'properties', propertyId);

    await notifSvc.send({
      userId: rows[0].landlord_id, type: 'listing_approved',
      title: 'Listing Approved',
      body:  `Your property "${rows[0].title}" is now live`,
      channels: ['whatsapp', 'push'],
      data:  { property: rows[0].title },
    });
  }

  async rejectProperty(propertyId: string, adminId: string, reason: string) {
    const { rows } = await pool.query(
      `UPDATE properties
       SET approval_status = 'rejected', rejection_reason = $1, updated_at = NOW()
       WHERE id = $2 RETURNING landlord_id, title`,
      [reason, propertyId]
    );
    if (!rows[0]) throw Object.assign(new Error('Property not found'), { status: 404 });
    await this._auditLog(adminId, 'property.rejected', 'properties', propertyId, { reason });

    await notifSvc.send({
      userId: rows[0].landlord_id, type: 'listing_rejected',
      title: 'Listing Rejected',
      body:  `Your property "${rows[0].title}" was rejected: ${reason}`,
      channels: ['whatsapp', 'push'],
      data:  { property: rows[0].title, reason },
    });
  }

  async suspendProperty(propertyId: string, adminId: string) {
    await pool.query(
      `UPDATE properties SET approval_status = 'suspended', is_available = false, updated_at = NOW()
       WHERE id = $1`,
      [propertyId]
    );
    await this._auditLog(adminId, 'property.suspended', 'properties', propertyId);
  }

  // ── Complaints ─────────────────────────────────────────────────────────────

  async listEscalatedComplaints() {
    const { rows } = await pool.query(
      `SELECT c.*, p.title AS property_title,
              ru.first_name AS raised_first, ru.last_name AS raised_last,
              au.first_name AS against_first, au.last_name AS against_last
       FROM complaints c
       JOIN tenancies t  ON t.id  = c.tenancy_id
       JOIN properties p ON p.id  = t.property_id
       JOIN users ru ON ru.id = c.raised_by
       JOIN users au ON au.id = c.against
       WHERE c.status IN ('escalated','in_review')
       ORDER BY c.priority DESC, c.escalated_at ASC`
    );
    return rows;
  }

  async adminResolveComplaint(complaintId: string, adminId: string, notes: string) {
    const { rows } = await pool.query(
      `UPDATE complaints
       SET status = 'resolved', resolved_by = $1,
           resolution_notes = $2, resolved_at = NOW(), updated_at = NOW()
       WHERE id = $3 RETURNING raised_by, against`,
      [adminId, notes, complaintId]
    );
    if (!rows[0]) throw Object.assign(new Error('Complaint not found'), { status: 404 });
    await this._auditLog(adminId, 'complaint.resolved', 'complaints', complaintId);

    for (const uid of [rows[0].raised_by, rows[0].against]) {
      await notifSvc.send({
        userId: uid, type: 'complaint_update',
        title: 'Complaint Resolved by Admin',
        body:  'Your complaint has been resolved by the PropMan support team.',
        channels: ['whatsapp', 'push'],
      });
    }
  }

  // ── Transactions ───────────────────────────────────────────────────────────

  async listTransactions(page = 1, limit = 50, status?: string) {
    const offset = (page - 1) * limit;
    const where  = status ? `WHERE pt.status = '${status}'` : '';
    const { rows } = await pool.query(
      `SELECT pt.*, ps.due_date, ps.period_start, ps.period_end,
              tu.first_name AS tenant_first, tu.last_name AS tenant_last,
              lu.first_name AS landlord_first, lu.last_name AS landlord_last
       FROM payment_transactions pt
       JOIN payment_schedules ps ON ps.id = pt.schedule_id
       JOIN users tu ON tu.id = pt.tenant_id
       JOIN users lu ON lu.id = pt.landlord_id
       ${where}
       ORDER BY pt.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  }

  async revenueReport(from: string, to: string) {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*)                                        AS total_transactions,
         SUM(amount)                                     AS total_rent_processed,
         SUM(platform_fee)                               AS total_platform_revenue,
         DATE_TRUNC('month', paid_at)                   AS month
       FROM payment_transactions
       WHERE status = 'success' AND paid_at BETWEEN $1 AND $2
       GROUP BY month ORDER BY month DESC`,
      [from, to]
    );
    return rows;
  }

  // ── Platform Settings ──────────────────────────────────────────────────────

  async getSettings() {
    const { rows } = await pool.query('SELECT key, value, description FROM platform_settings ORDER BY key');
    return rows;
  }

  async updateSetting(key: string, value: string, adminId: string) {
    const { rows: old } = await pool.query(
      'SELECT value FROM platform_settings WHERE key = $1', [key]
    );
    await pool.query(
      `UPDATE platform_settings SET value = $1, updated_by = $2, updated_at = NOW() WHERE key = $3`,
      [value, adminId, key]
    );
    await this._auditLog(adminId, 'settings.updated', 'platform_settings', key,
      { old: old[0]?.value }, { new: value }
    );
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────

  async getAuditLogs(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT al.*, u.first_name, u.last_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_id
       ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  }

  private async _auditLog(
    actorId: string, action: string,
    entityType: string, entityId: string,
    oldValue?: Record<string, any>, newValue?: Record<string, any>
  ) {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [actorId, action, entityType, entityId,
       oldValue ? JSON.stringify(oldValue) : null,
       newValue ? JSON.stringify(newValue) : null]
    );
  }
}
