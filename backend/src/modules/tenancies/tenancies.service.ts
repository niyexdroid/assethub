import { pool } from '../../config/database';
import { generateAgreementPdf } from './agreement/agreement.generator';
import { generateSchedule } from '../payments/schedule.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateTenancyInput } from './tenancies.validators';
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
