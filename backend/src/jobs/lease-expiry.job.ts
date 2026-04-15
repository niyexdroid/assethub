import { pool } from '../config/database';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { logger } from '../utils/logger';

const notifSvc = new NotificationsService();

/**
 * Run daily. Alerts both landlord and tenant when a lease expires in 30, 7, or 1 day.
 */
export async function runLeaseExpiryAlerts() {
  logger.info('Running lease expiry alert job');

  const { rows } = await pool.query(`
    SELECT t.id, t.tenant_id, t.landlord_id, t.end_date,
           tu.phone_number AS tenant_phone, tu.fcm_token AS tenant_fcm, tu.whatsapp_opt_in AS tenant_wa,
           lu.phone_number AS landlord_phone, lu.fcm_token AS landlord_fcm, lu.whatsapp_opt_in AS landlord_wa,
           p.title AS property_title
    FROM tenancies t
    JOIN users tu  ON tu.id = t.tenant_id
    JOIN users lu  ON lu.id = t.landlord_id
    JOIN properties p ON p.id = t.property_id
    WHERE t.status = 'active'
      AND t.end_date IN (
        CURRENT_DATE + INTERVAL '30 days',
        CURRENT_DATE + INTERVAL '7 days',
        CURRENT_DATE + INTERVAL '1 day'
      )
  `);

  for (const row of rows) {
    const daysUntilDue = Math.round(
      (new Date(row.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const data = {
      property:     row.property_title,
      daysUntilDue,
      dueDate:      row.end_date,
    };

    // Notify tenant
    await notifSvc.send({
      userId:   row.tenant_id,
      type:     'lease_expiry',
      title:    `Lease expiring in ${daysUntilDue} days`,
      body:     `Your lease for ${row.property_title} expires on ${row.end_date}`,
      channels: row.tenant_wa ? ['whatsapp', 'push'] : ['sms', 'push'],
      phone:    row.tenant_phone,
      fcmToken: row.tenant_fcm,
      data,
    });

    // Notify landlord
    await notifSvc.send({
      userId:   row.landlord_id,
      type:     'lease_expiry',
      title:    `Lease expiring in ${daysUntilDue} days`,
      body:     `Tenant lease for ${row.property_title} expires on ${row.end_date}`,
      channels: row.landlord_wa ? ['whatsapp', 'push'] : ['sms', 'push'],
      phone:    row.landlord_phone,
      fcmToken: row.landlord_fcm,
      data,
    });
  }

  logger.info(`Lease expiry alerts: ${rows.length * 2} notifications sent`);
}
