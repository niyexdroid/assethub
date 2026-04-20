import { pool } from '../../config/database';
import { generateAgreementPdf } from './agreement/agreement.generator';
import { generateSchedule } from '../payments/schedule.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateTenancyInput, ApplyInput } from './tenancies.validators';
import { formatDate } from '../../utils/dateHelpers';

const notifSvc = new NotificationsService();

export class TenanciesService {
  async create(landlordId: string, input: CreateTenancyInput) {
    // Verify property belongs to landlord
    const { rows: propRows } = await pool.query(
      'SELECT id, title, address, rules FROM properties WHERE id = $1 AND landlord_id = $2',
      [input.property_id, landlordId]
    );
    if (!propRows[0]) throw Object.assign(new Error('Property not found or not yours'), { status: 404 });

    const { rows } = await pool.query(
      `INSERT INTO tenancies
         (property_id, landlord_id, tenant_id, tenancy_type, start_date, end_date,
          monthly_amount, yearly_amount, caution_fee_paid, agency_fee_paid, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')
       RETURNING *`,
      [
        input.property_id, landlordId, input.tenant_id,
        input.tenancy_type, input.start_date, input.end_date,
        input.monthly_amount ?? null, input.yearly_amount ?? null,
        input.caution_fee_paid, input.agency_fee_paid,
      ]
    );
    const tenancy = rows[0];

    // Notify tenant
    const { rows: tenantRows } = await pool.query(
      'SELECT first_name FROM users WHERE id = $1', [input.tenant_id]
    );
    await notifSvc.send({
      userId:   input.tenant_id,
      type:     'agreement_ready',
      title:    'Tenancy Agreement Ready',
      body:     `Review and sign your agreement for ${propRows[0].title}`,
      channels: ['whatsapp', 'push', 'email'],
      data:     { property: propRows[0].title, name: tenantRows[0]?.first_name },
    });

    return tenancy;
  }

  async getById(id: string, userId: string) {
    const { rows } = await pool.query(
      `SELECT t.*,
              p.title AS property_title, p.address AS property_address, p.photos,
              lu.first_name AS landlord_first_name, lu.last_name AS landlord_last_name,
              tu.first_name AS tenant_first_name,   tu.last_name  AS tenant_last_name
       FROM tenancies t
       JOIN properties p ON p.id = t.property_id
       JOIN users lu ON lu.id = t.landlord_id
       JOIN users tu ON tu.id = t.tenant_id
       WHERE t.id = $1 AND (t.landlord_id = $2 OR t.tenant_id = $2)`,
      [id, userId]
    );
    if (!rows[0]) throw Object.assign(new Error('Tenancy not found'), { status: 404 });
    return rows[0];
  }

  async getTenantTenancies(tenantId: string) {
    const { rows } = await pool.query(
      `SELECT t.id, t.status, t.tenancy_type, t.start_date, t.end_date,
              t.monthly_amount, t.yearly_amount,
              p.title AS property_title, p.address, p.photos
       FROM tenancies t
       JOIN properties p ON p.id = t.property_id
       WHERE t.tenant_id = $1 ORDER BY t.created_at DESC`,
      [tenantId]
    );
    return rows;
  }

  async getLandlordTenancies(landlordId: string) {
    const { rows } = await pool.query(
      `SELECT t.id, t.status, t.tenancy_type, t.start_date, t.end_date,
              t.monthly_amount, t.yearly_amount,
              p.title AS property_title,
              tu.first_name AS tenant_first_name, tu.last_name AS tenant_last_name,
              tu.phone_number AS tenant_phone
       FROM tenancies t
       JOIN properties p ON p.id = t.property_id
       JOIN users tu ON tu.id = t.tenant_id
       WHERE t.landlord_id = $1 ORDER BY t.created_at DESC`,
      [landlordId]
    );
    return rows;
  }

  async accept(id: string, tenantId: string) {
    const { rows } = await pool.query(
      `UPDATE tenancies SET status = 'active', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, tenantId]
    );
    if (!rows[0]) throw Object.assign(new Error('Tenancy not found or cannot accept'), { status: 404 });
    return rows[0];
  }

  async decline(id: string, tenantId: string) {
    await pool.query(
      `UPDATE tenancies SET status = 'terminated', termination_reason = 'Declined by tenant',
       terminated_by = $2, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND status = 'pending'`,
      [id, tenantId]
    );
  }

  async terminate(id: string, userId: string, reason: string) {
    const { rows } = await pool.query(
      `UPDATE tenancies SET status = 'terminated', termination_reason = $1,
       terminated_by = $2, updated_at = NOW()
       WHERE id = $3 AND (landlord_id = $2 OR tenant_id = $2) AND status = 'active'
       RETURNING *`,
      [reason, userId, id]
    );
    if (!rows[0]) throw Object.assign(new Error('Tenancy not found or cannot terminate'), { status: 404 });
    return rows[0];
  }

  async getAgreementPdf(id: string, userId: string): Promise<Buffer> {
    const tenancy = await this.getById(id, userId);

    const pdf = await generateAgreementPdf({
      landlordName:    `${tenancy.landlord_first_name} ${tenancy.landlord_last_name}`,
      tenantName:      `${tenancy.tenant_first_name} ${tenancy.tenant_last_name}`,
      propertyAddress: tenancy.property_address,
      propertyTitle:   tenancy.property_title,
      startDate:       formatDate(new Date(tenancy.start_date)),
      endDate:         formatDate(new Date(tenancy.end_date)),
      rentAmount:      (tenancy.monthly_amount ?? tenancy.yearly_amount ?? 0).toLocaleString(),
      tenancyType:     tenancy.tenancy_type,
      cautionFee:      (tenancy.caution_fee_paid ?? 0).toLocaleString(),
      agencyFee:       (tenancy.agency_fee_paid  ?? 0).toLocaleString(),
      generatedAt:     new Date().toLocaleDateString('en-NG'),
    });

    return pdf;
  }

  // ── Applications ────────────────────────────────────────────────────────────

  async apply(tenantId: string, input: ApplyInput) {
    const { rows: propRows } = await pool.query(
      `SELECT id, title, landlord_id, monthly_rent, yearly_rent, caution_fee, agency_fee, approval_status
       FROM properties WHERE id = $1`,
      [input.property_id]
    );
    const prop = propRows[0];
    if (!prop) throw Object.assign(new Error('Property not found'), { status: 404 });
    if (prop.approval_status !== 'approved') throw Object.assign(new Error('Property is not available'), { status: 400 });

    const { rows } = await pool.query(
      `INSERT INTO tenancy_applications
         (property_id, tenant_id, landlord_id, tenancy_type, move_in_date, message)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (property_id, tenant_id) DO UPDATE
         SET tenancy_type = EXCLUDED.tenancy_type,
             move_in_date = EXCLUDED.move_in_date,
             message      = EXCLUDED.message,
             status       = 'pending',
             updated_at   = NOW()
       RETURNING *`,
      [input.property_id, tenantId, prop.landlord_id, input.tenancy_type, input.move_in_date, input.message ?? null]
    );

    await notifSvc.send({
      userId:   prop.landlord_id,
      type:     'new_application',
      title:    'New Rental Application',
      body:     `A tenant has applied for ${prop.title}`,
      channels: ['push', 'whatsapp'],
      data:     { property: prop.title },
    });

    return rows[0];
  }

  async getApplicationsForTenant(tenantId: string) {
    const { rows } = await pool.query(
      `SELECT a.*, p.title AS property_title, p.address, p.photos,
              p.monthly_rent, p.yearly_rent,
              u.first_name AS landlord_first_name, u.last_name AS landlord_last_name
       FROM tenancy_applications a
       JOIN properties p ON p.id = a.property_id
       JOIN users u ON u.id = a.landlord_id
       WHERE a.tenant_id = $1
       ORDER BY a.created_at DESC`,
      [tenantId]
    );
    return rows;
  }

  async getApplicationsForLandlord(landlordId: string, propertyId?: string) {
    const where = propertyId
      ? 'WHERE a.landlord_id = $1 AND a.property_id = $2'
      : 'WHERE a.landlord_id = $1';
    const params: any[] = propertyId ? [landlordId, propertyId] : [landlordId];
    const { rows } = await pool.query(
      `SELECT a.*,
              p.title AS property_title, p.address,
              u.first_name AS tenant_first_name, u.last_name AS tenant_last_name,
              u.phone_number AS tenant_phone, u.email AS tenant_email
       FROM tenancy_applications a
       JOIN properties p ON p.id = a.property_id
       JOIN users u ON u.id = a.tenant_id
       ${where}
       ORDER BY a.created_at DESC`,
      params
    );
    return rows;
  }

  async approveApplication(applicationId: string, landlordId: string) {
    const { rows: appRows } = await pool.query(
      `SELECT a.*, p.title, p.address, p.rules,
              p.monthly_rent, p.yearly_rent, p.caution_fee, p.agency_fee
       FROM tenancy_applications a
       JOIN properties p ON p.id = a.property_id
       WHERE a.id = $1 AND a.landlord_id = $2 AND a.status = 'pending'`,
      [applicationId, landlordId]
    );
    const app = appRows[0];
    if (!app) throw Object.assign(new Error('Application not found'), { status: 404 });

    const moveIn  = new Date(app.move_in_date);
    const endDate = new Date(moveIn);
    if (app.tenancy_type === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const toDateStr = (d: Date) => d.toISOString().split('T')[0];

    const { rows: tenancyRows } = await pool.query(
      `INSERT INTO tenancies
         (property_id, landlord_id, tenant_id, tenancy_type, start_date, end_date,
          monthly_amount, yearly_amount, caution_fee_paid, agency_fee_paid, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')
       RETURNING *`,
      [
        app.property_id, landlordId, app.tenant_id, app.tenancy_type,
        toDateStr(moveIn), toDateStr(endDate),
        app.tenancy_type === 'monthly' ? app.monthly_rent : null,
        app.tenancy_type === 'yearly'  ? app.yearly_rent  : null,
        app.caution_fee ?? 0,
        app.agency_fee  ?? 0,
      ]
    );

    await pool.query(
      `UPDATE tenancy_applications SET status = 'approved', updated_at = NOW() WHERE id = $1`,
      [applicationId]
    );

    await notifSvc.send({
      userId:   app.tenant_id,
      type:     'agreement_ready',
      title:    'Application Approved!',
      body:     `Your application for ${app.title} has been approved. Review and sign your agreement.`,
      channels: ['push', 'whatsapp'],
      data:     { property: app.title },
    });

    return tenancyRows[0];
  }

  async rejectApplication(applicationId: string, landlordId: string, reason: string) {
    const { rows } = await pool.query(
      `UPDATE tenancy_applications
       SET status = 'rejected', rejection_reason = $1, updated_at = NOW()
       WHERE id = $2 AND landlord_id = $3 AND status = 'pending'
       RETURNING tenant_id, property_id`,
      [reason, applicationId, landlordId]
    );
    if (!rows[0]) throw Object.assign(new Error('Application not found'), { status: 404 });

    const { rows: propRows } = await pool.query('SELECT title FROM properties WHERE id = $1', [rows[0].property_id]);

    await notifSvc.send({
      userId:   rows[0].tenant_id,
      type:     'application_rejected',
      title:    'Application Update',
      body:     `Your application for ${propRows[0]?.title} was not successful.`,
      channels: ['push', 'whatsapp'],
    });
  }

  async sign(id: string, userId: string, role: 'tenant' | 'landlord') {
    const col   = role === 'tenant' ? 'tenant_signed_at' : 'landlord_signed_at';
    const { rows } = await pool.query(
      `UPDATE tenancies SET ${col} = NOW(), updated_at = NOW()
       WHERE id = $1 AND ${role}_id = $2 RETURNING *`,
      [id, userId]
    );
    if (!rows[0]) throw Object.assign(new Error('Tenancy not found'), { status: 404 });

    // If both parties signed, generate payment schedule
    const t = rows[0];
    if (t.tenant_signed_at && t.landlord_signed_at && t.status === 'active') {
      await generateSchedule(id);
    }

    return rows[0];
  }
}
