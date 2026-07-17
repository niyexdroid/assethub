import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { pool } from '../../config/database';
import { uploadFile } from '../../services/upload.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  CreateReportInput, AddItemInput, UpdateItemInput,
  SignReportInput, DisputeReportInput,
} from './inspections.validator';

const notifSvc = new NotificationsService();

export class InspectionsService {
  async createReport(createdBy: string, input: CreateReportInput) {
    const { rows: tenancyRows } = await pool.query(
      `SELECT t.id, t.landlord_id, t.tenant_id, p.title AS property_title
       FROM tenancies t
       JOIN properties p ON p.id = t.property_id
       WHERE t.id = $1 AND t.tenant_id = $2 AND t.status = 'active'`,
      [input.tenancy_id, createdBy],
    );
    if (!tenancyRows[0]) {
      throw Object.assign(new Error('Active tenancy not found for this tenant'), { status: 404 });
    }

    const tenancy = tenancyRows[0];
    const { rows } = await pool.query(
      `INSERT INTO inspection_reports (tenancy_id, created_by)
       VALUES ($1, $2) RETURNING *`,
      [input.tenancy_id, createdBy],
    );

    await notifSvc.send({
      userId:   tenancy.landlord_id,
      type:     'inspection_update',
      title:    'New Inspection Started',
      body:     `Tenant started an inspection for ${tenancy.property_title}`,
      channels: ['push'],
      data:     { report_id: rows[0].id, tenancy_id: input.tenancy_id },
    });

    return rows[0];
  }

  async getById(reportId: string, userId: string) {
    const { rows } = await pool.query(
      `SELECT r.*,
              p.title AS property_title,
              tu.first_name || ' ' || tu.last_name AS tenant_name,
              lu.first_name || ' ' || lu.last_name AS landlord_name
       FROM inspection_reports r
       JOIN tenancies t ON t.id = r.tenancy_id
       JOIN properties p ON p.id = t.property_id
       JOIN users tu ON tu.id = t.tenant_id
       JOIN users lu ON lu.id = t.landlord_id
       WHERE r.id = $1 AND (t.tenant_id = $2 OR t.landlord_id = $2)`,
      [reportId, userId],
    );
    if (!rows[0]) throw Object.assign(new Error('Inspection not found'), { status: 404 });

    const { rows: items } = await pool.query(
      `SELECT * FROM inspection_items
       WHERE report_id = $1 ORDER BY sort_order, created_at`,
      [reportId],
    );

    return { ...rows[0], items };
  }

  async list(userId: string) {
    const { rows } = await pool.query(
      `SELECT r.id, r.tenancy_id, r.status, r.created_at, r.updated_at,
              r.tenant_signed_at, r.landlord_signed_at,
              p.title AS property_title
       FROM inspection_reports r
       JOIN tenancies t ON t.id = r.tenancy_id
       JOIN properties p ON p.id = t.property_id
       WHERE t.tenant_id = $1 OR t.landlord_id = $1
       ORDER BY r.created_at DESC`,
      [userId],
    );
    return rows;
  }

  async addItem(reportId: string, userId: string, input: AddItemInput) {
    const report = await this.verifyDraftOwner(reportId, userId);

    const { rows } = await pool.query(
      `INSERT INTO inspection_items
         (report_id, item_name, description, condition, photo_urls,
          capture_source, captured_at, notes, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
         (SELECT COALESCE(MAX(sort_order),0)+1 FROM inspection_items WHERE report_id = $1))
       RETURNING *`,
      [
        reportId, input.item_name, input.description ?? null, input.condition,
        JSON.stringify(input.photo_urls), input.capture_source,
        input.captured_at ?? null, input.notes ?? null,
      ],
    );

    await pool.query(
      `UPDATE inspection_reports SET updated_at = NOW() WHERE id = $1`,
      [reportId],
    );

    return rows[0];
  }

  async updateItem(itemId: string, reportId: string, userId: string, input: UpdateItemInput) {
    await this.verifyDraftOwner(reportId, userId);

    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined) {
        sets.push(`${k} = $${idx++}`);
        vals.push(v);
      }
    }
    if (!sets.length) throw Object.assign(new Error('No fields to update'), { status: 400 });

    vals.push(itemId, reportId);
    const { rows } = await pool.query(
      `UPDATE inspection_items SET ${sets.join(', ')}
       WHERE id = $${idx++} AND report_id = $${idx++} RETURNING *`,
      vals,
    );
    if (!rows[0]) throw Object.assign(new Error('Item not found'), { status: 404 });

    await pool.query(
      `UPDATE inspection_reports SET updated_at = NOW() WHERE id = $1`,
      [reportId],
    );

    return rows[0];
  }

  async deleteItem(itemId: string, reportId: string, userId: string) {
    await this.verifyDraftOwner(reportId, userId);

    const { rowCount } = await pool.query(
      `DELETE FROM inspection_items WHERE id = $1 AND report_id = $2`,
      [itemId, reportId],
    );
    if (!rowCount) throw Object.assign(new Error('Item not found'), { status: 404 });

    await pool.query(
      `UPDATE inspection_reports SET updated_at = NOW() WHERE id = $1`,
      [reportId],
    );
  }

  async submitForReview(reportId: string, userId: string) {
    await this.verifyDraftOwner(reportId, userId);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT 1 FROM inspection_reports WHERE id = $1 FOR UPDATE', [reportId]);

      const { rows: items } = await client.query(
        `SELECT id, item_name, description, condition, photo_urls,
                capture_source, captured_at, notes, sort_order
         FROM inspection_items
         WHERE report_id = $1 ORDER BY sort_order, created_at`,
        [reportId],
      );
      if (!items.length) {
        throw Object.assign(new Error('Add at least one item before submitting'), { status: 400 });
      }

      const contentHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(items))
        .digest('hex');

      const { rows } = await client.query(
        `UPDATE inspection_reports
         SET status = 'pending_review', content_hash = $1, updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [contentHash, reportId],
      );

      await client.query('COMMIT');

      // Notify landlord
      const { rows: tenancyRows } = await pool.query(
        `SELECT t.landlord_id, p.title AS property_title
         FROM tenancies t
         JOIN properties p ON p.id = t.property_id
         JOIN inspection_reports r ON r.tenancy_id = t.id
         WHERE r.id = $1`,
        [reportId],
      );
      if (tenancyRows[0]) {
        await notifSvc.send({
          userId:   tenancyRows[0].landlord_id,
          type:     'inspection_update',
          title:    'Inspection Ready for Review',
          body:     `Tenant submitted inspection for ${tenancyRows[0].property_title}`,
          channels: ['push'],
          data:     { report_id: reportId },
        });
      }

      return rows[0];
    } finally {
      client.release();
    }
  }

  async sign(reportId: string, userId: string, input: SignReportInput) {
    const { rows } = await pool.query(
      `SELECT r.*, t.tenant_id, t.landlord_id
       FROM inspection_reports r
       JOIN tenancies t ON t.id = r.tenancy_id
       WHERE r.id = $1`,
      [reportId],
    );
    if (!rows[0]) throw Object.assign(new Error('Inspection not found'), { status: 404 });

    const report = rows[0];
    if (!['pending_review', 'disputed'].includes(report.status)) {
      throw Object.assign(new Error(`Cannot sign — report is ${report.status}`), { status: 400 });
    }

    // Verify content_hash matches
    if (input.content_hash !== report.content_hash) {
      throw Object.assign(new Error('Content hash mismatch — items may have changed'), { status: 409 });
    }

    const isTenant = userId === report.tenant_id;
    const isLandlord = userId === report.landlord_id;
    if (!isTenant && !isLandlord) {
      throw Object.assign(new Error('Not a party to this inspection'), { status: 403 });
    }

    const signField = isTenant ? 'tenant_signed_at' : 'landlord_signed_at';

    if (report[signField]) {
      throw Object.assign(new Error('You have already signed this report'), { status: 400 });
    }

    // Use a transaction so a PDF generation failure rolls back the
    // signature UPDATE — no inconsistent state where both signatures
    // are present but status != 'signed'.
    const signClient = await pool.connect();
    try {
      await signClient.query('BEGIN');

      const gpsSets: string[] = [];
      const gpsVals: any[] = [];
      let gIdx = 1;
      if (input.gps_lat !== undefined) {
        gpsSets.push(`gps_lat = $${gIdx++}`);
        gpsVals.push(input.gps_lat);
      }
      if (input.gps_lng !== undefined) {
        gpsSets.push(`gps_lng = $${gIdx++}`);
        gpsVals.push(input.gps_lng);
      }
      if (input.gps_captured_at !== undefined) {
        gpsSets.push(`gps_captured_at = $${gIdx++}`);
        gpsVals.push(input.gps_captured_at);
      }

      const gpsClause = gpsSets.length ? `, ${gpsSets.join(', ')}` : '';
      gpsVals.push(reportId);
      const { rows: updated } = await signClient.query(
        `UPDATE inspection_reports
         SET ${signField} = NOW()${gpsClause}, updated_at = NOW()
         WHERE id = $${gIdx} AND status IN ('pending_review', 'disputed') RETURNING *`,
        gpsVals,
      );

      if (!updated[0]) {
        throw Object.assign(new Error('Report status changed — please refresh and try again'), { status: 409 });
      }

      const finalReport = updated[0];

      if (finalReport.tenant_signed_at && finalReport.landlord_signed_at) {
        const pdfUrl = await this.generatePdf(finalReport.id);
        await signClient.query(
          `UPDATE inspection_reports SET status = 'signed', pdf_url = $1, updated_at = NOW()
           WHERE id = $2`,
          [pdfUrl, reportId],
        );
        await signClient.query('COMMIT');

        // Notify both parties
        for (const uid of [report.tenant_id, report.landlord_id]) {
          await notifSvc.send({
            userId:   uid,
            type:     'inspection_update',
            title:    'Inspection Signed',
            body:     'Both parties have signed the inspection report',
            channels: ['push'],
            data:     { report_id: reportId },
          });
        }

        return { ...finalReport, status: 'signed', pdf_url: pdfUrl };
      }

      await signClient.query('COMMIT');

      // Notify other party
      const otherId = isTenant ? report.landlord_id : report.tenant_id;
      await notifSvc.send({
        userId:   otherId,
        type:     'inspection_update',
        title:    'Inspection Signed',
        body:     `${isTenant ? 'Tenant' : 'Landlord'} signed the inspection`,
        channels: ['push'],
        data:     { report_id: reportId },
      });

      return updated[0];
    } catch (err) {
      await signClient.query('ROLLBACK');
      throw err;
    } finally {
      signClient.release();
    }
  }

  async dispute(reportId: string, userId: string, input: DisputeReportInput) {
    const { rows } = await pool.query(
      `SELECT r.*, t.tenant_id, t.landlord_id
       FROM inspection_reports r
       JOIN tenancies t ON t.id = r.tenancy_id
       WHERE r.id = $1`,
      [reportId],
    );
    if (!rows[0]) throw Object.assign(new Error('Inspection not found'), { status: 404 });

    const report = rows[0];
    if (report.status !== 'signed') {
      throw Object.assign(new Error(`Cannot dispute — report is ${report.status}`), { status: 400 });
    }
    if (userId !== report.tenant_id && userId !== report.landlord_id) {
      throw Object.assign(new Error('Not a party to this inspection'), { status: 403 });
    }

    // Reset to draft, clear signatures, clear content_hash
    const { rows: updated } = await pool.query(
      `UPDATE inspection_reports
       SET status = 'disputed',
           tenant_signed_at = NULL, landlord_signed_at = NULL,
           content_hash = NULL,
           disputed_at = NOW(), disputed_by = $1,
           dispute_reason = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [userId, input.reason, reportId],
    );

    // Notify other party
    const otherId = userId === report.tenant_id ? report.landlord_id : report.tenant_id;
    await notifSvc.send({
      userId:   otherId,
      type:     'inspection_update',
      title:    'Inspection Disputed',
      body:     `The inspection has been disputed. Reason: ${input.reason.slice(0, 100)}`,
      channels: ['push'],
      data:     { report_id: reportId },
    });

    return updated[0];
  }

  async deleteReport(reportId: string, userId: string) {
    const report = await this.verifyDraftOwner(reportId, userId);
    if (!['draft', 'disputed'].includes(report.status)) {
      throw Object.assign(new Error(`Cannot delete — report is ${report.status}`), { status: 400 });
    }

    await pool.query('DELETE FROM inspection_reports WHERE id = $1', [reportId]);
  }

  // ── Private helpers ──────────────────────────────────────────

  private async verifyDraftOwner(reportId: string, userId: string) {
    const { rows } = await pool.query(
      `SELECT r.*, t.tenant_id
       FROM inspection_reports r
       JOIN tenancies t ON t.id = r.tenancy_id
       WHERE r.id = $1`,
      [reportId],
    );
    if (!rows[0]) throw Object.assign(new Error('Inspection not found'), { status: 404 });
    if (rows[0].created_by !== userId) {
      throw Object.assign(new Error('Only the report creator can modify it'), { status: 403 });
    }
    if (!['draft', 'disputed'].includes(rows[0].status)) {
      throw Object.assign(new Error(`Cannot modify — report is ${rows[0].status}`), { status: 400 });
    }
    return rows[0];
  }

  private async generatePdf(reportId: string): Promise<string> {
    const report = await this.getReportFull(reportId);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const result = await uploadFile(buffer, `inspection-${reportId}.pdf`, 'documents');
          resolve(result.url);
        } catch (err) {
          reject(err);
        }
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Inspection Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Property: ${report.property_title}`, { align: 'center' });
      doc.text(`Report ID: ${reportId}`, { align: 'center' });
      doc.text(`Date: ${new Date(report.created_at).toLocaleDateString('en-NG')}`, { align: 'center' });
      doc.moveDown();

      // Parties
      doc.fontSize(12).font('Helvetica-Bold').text('Parties');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(`Tenant: ${report.tenant_name}`);
      doc.text(`Landlord: ${report.landlord_name}`);
      doc.text(`Signed — Tenant: ${report.tenant_signed_at ? new Date(report.tenant_signed_at).toLocaleString('en-NG') : 'Not signed'}  |  Landlord: ${report.landlord_signed_at ? new Date(report.landlord_signed_at).toLocaleString('en-NG') : 'Not signed'}`);
      doc.moveDown();

      // Items
      doc.fontSize(12).font('Helvetica-Bold').text('Items');
      doc.moveDown(0.3);

      for (let i = 0; i < report.items.length; i++) {
        const item = report.items[i];
        doc.fontSize(10).font('Helvetica-Bold').text(`${i + 1}. ${item.item_name}`);
        doc.font('Helvetica')
          .text(`   Condition: ${item.condition}`);
        if (item.description) doc.text(`   Description: ${item.description}`);
        if (item.notes) doc.text(`   Notes: ${item.notes}`);
        if (item.photo_urls?.length) {
          doc.text(`   Photos: ${item.photo_urls.length} attached`);
        }
        doc.text(`   Captured: ${item.captured_at ? new Date(item.captured_at).toLocaleString('en-NG') : 'N/A'}  |  Source: ${item.capture_source}`);
        doc.moveDown(0.3);
      }

      doc.moveDown();
      doc.fontSize(8).font('Helvetica')
        .text(`Content Hash: ${report.content_hash}`, { align: 'center' });
      doc.text('Generated by AssetHub — Digital Inventory Inspection', { align: 'center' });

      doc.end();
    });
  }

  private async getReportFull(reportId: string) {
    const { rows } = await pool.query(
      `SELECT r.*,
              p.title AS property_title,
              tu.first_name || ' ' || tu.last_name AS tenant_name,
              lu.first_name || ' ' || lu.last_name AS landlord_name
       FROM inspection_reports r
       JOIN tenancies t ON t.id = r.tenancy_id
       JOIN properties p ON p.id = t.property_id
       JOIN users tu ON tu.id = t.tenant_id
       JOIN users lu ON lu.id = t.landlord_id
       WHERE r.id = $1`,
      [reportId],
    );
    if (!rows[0]) throw Object.assign(new Error('Inspection not found'), { status: 404 });

    const { rows: items } = await pool.query(
      `SELECT * FROM inspection_items
       WHERE report_id = $1 ORDER BY sort_order, created_at`,
      [reportId],
    );

    return { ...rows[0], items };
  }
}
