import { pool } from '../../config/database';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateComplaintInput } from './complaints.validators';

const notifSvc = new NotificationsService();

export class ComplaintsService {
  async create(raisedBy: string, input: CreateComplaintInput) {
    // Verify the user is part of this tenancy
    const { rows: tenancyRows } = await pool.query(
      `SELECT t.id, t.landlord_id, t.tenant_id, p.title AS property_title
       FROM tenancies t
       JOIN properties p ON p.id = t.property_id
       WHERE t.id = $1 AND (t.landlord_id = $2 OR t.tenant_id = $2)`,
      [input.tenancy_id, raisedBy]
    );
    if (!tenancyRows[0]) throw Object.assign(new Error('Tenancy not found or not yours'), { status: 404 });

    const tenancy  = tenancyRows[0];
    const againstId = raisedBy === tenancy.tenant_id ? tenancy.landlord_id : tenancy.tenant_id;

    const { rows } = await pool.query(
      `INSERT INTO complaints
         (tenancy_id, raised_by, against, category, title, description, priority)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [input.tenancy_id, raisedBy, againstId, input.category, input.title, input.description, input.priority]
    );

    // Notify the other party
    await notifSvc.send({
      userId:   againstId,
      type:     'complaint_update',
      title:    'New Complaint Raised',
      body:     `A complaint has been raised regarding ${tenancy.property_title}`,
      channels: ['whatsapp', 'push'],
      data:     { property: tenancy.property_title },
    });

    return rows[0];
  }

  async list(userId: string) {
    const { rows } = await pool.query(
      `SELECT c.id, c.category, c.title, c.status, c.priority,
              c.escalation_level, c.created_at, c.updated_at,
              p.title AS property_title
       FROM complaints c
       JOIN tenancies t  ON t.id = c.tenancy_id
       JOIN properties p ON p.id = t.property_id
       WHERE c.raised_by = $1 OR c.against = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return rows;
  }

  async getById(id: string, userId: string) {
    const { rows } = await pool.query(
      `SELECT c.*,
              p.title AS property_title,
              ru.first_name AS raised_by_first, ru.last_name AS raised_by_last,
              au.first_name AS against_first,   au.last_name  AS against_last
       FROM complaints c
       JOIN tenancies t  ON t.id = c.tenancy_id
       JOIN properties p ON p.id = t.property_id
       JOIN users ru ON ru.id = c.raised_by
       JOIN users au ON au.id = c.against
       WHERE c.id = $1 AND (c.raised_by = $2 OR c.against = $2)`,
      [id, userId]
    );
    if (!rows[0]) throw Object.assign(new Error('Complaint not found'), { status: 404 });

    // Get messages
    const { rows: messages } = await pool.query(
      `SELECT cm.*, u.first_name, u.last_name, u.profile_photo_url
       FROM complaint_messages cm
       JOIN users u ON u.id = cm.sender_id
       WHERE cm.complaint_id = $1 AND cm.is_internal_note = false
       ORDER BY cm.created_at ASC`,
      [id]
    );

    return { ...rows[0], messages };
  }

  async addMessage(complaintId: string, senderId: string, message: string, attachments: string[]) {
    // Verify sender is part of this complaint
    const { rows: compRows } = await pool.query(
      'SELECT raised_by, against, title FROM complaints WHERE id = $1',
      [complaintId]
    );
    if (!compRows[0]) throw Object.assign(new Error('Complaint not found'), { status: 404 });
    const c = compRows[0];
    if (c.raised_by !== senderId && c.against !== senderId) {
      throw Object.assign(new Error('Not authorised'), { status: 403 });
    }

    const { rows } = await pool.query(
      `INSERT INTO complaint_messages (complaint_id, sender_id, message, attachments)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [complaintId, senderId, message, JSON.stringify(attachments)]
    );

    // Notify the other party
    const otherId = senderId === c.raised_by ? c.against : c.raised_by;
    await notifSvc.send({
      userId:   otherId,
      type:     'complaint_update',
      title:    'New message on your complaint',
      body:     c.title,
      channels: ['push', 'whatsapp'],
    });

    // Update complaint status to in_review
    await pool.query(
      `UPDATE complaints SET status = 'in_review', updated_at = NOW() WHERE id = $1 AND status = 'open'`,
      [complaintId]
    );

    return rows[0];
  }

  async escalate(complaintId: string, userId: string) {
    const { rows } = await pool.query(
      `UPDATE complaints
       SET status = 'escalated',
           escalation_level = escalation_level + 1,
           escalated_at = NOW(),
           escalation_notes = CONCAT(COALESCE(escalation_notes,''), ' | Manually escalated by user'),
           updated_at = NOW()
       WHERE id = $1 AND raised_by = $2 AND status NOT IN ('resolved','closed')
       RETURNING *`,
      [complaintId, userId]
    );
    if (!rows[0]) throw Object.assign(new Error('Cannot escalate this complaint'), { status: 404 });

    // Notify admin (send to all admins)
    const { rows: admins } = await pool.query(
      `SELECT id FROM users WHERE role = 'admin' AND is_active = true`
    );
    for (const admin of admins) {
      await notifSvc.send({
        userId:   admin.id,
        type:     'complaint_update',
        title:    'Complaint Escalated',
        body:     `Complaint #${complaintId.slice(0, 8)} has been escalated`,
        channels: ['push'],
      });
    }

    return rows[0];
  }

  async resolve(complaintId: string, resolverId: string, resolutionNotes: string) {
    const { rows } = await pool.query(
      `UPDATE complaints
       SET status = 'resolved', resolved_by = $1,
           resolution_notes = $2, resolved_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND status NOT IN ('resolved','closed')
       RETURNING *`,
      [resolverId, resolutionNotes, complaintId]
    );
    if (!rows[0]) throw Object.assign(new Error('Complaint not found or already resolved'), { status: 404 });

    // Notify both parties
    for (const uid of [rows[0].raised_by, rows[0].against]) {
      await notifSvc.send({
        userId:   uid,
        type:     'complaint_update',
        title:    'Complaint Resolved',
        body:     `Your complaint has been resolved`,
        channels: ['whatsapp', 'push'],
      });
    }

    return rows[0];
  }
}
