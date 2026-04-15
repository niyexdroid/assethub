import { pool } from '../config/database';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { logger } from '../utils/logger';

const notifSvc = new NotificationsService();

/**
 * Run every hour. Auto-escalates complaints where landlord hasn't responded
 * within the SLA window (default 72hrs, stored in platform_settings).
 */
export async function runEscalationCheck() {
  const { rows: settings } = await pool.query(
    `SELECT value FROM platform_settings WHERE key = 'complaint_sla_hours'`
  );
  const slaHours = parseInt(settings[0]?.value ?? '72');

  const { rows: complaints } = await pool.query(`
    SELECT c.id, c.raised_by, c.against, c.title,
           u.phone_number, u.fcm_token, u.whatsapp_opt_in
    FROM complaints c
    JOIN users u ON u.id = c.raised_by
    WHERE c.status = 'open'
      AND c.escalation_level = 1
      AND c.created_at < NOW() - INTERVAL '${slaHours} hours'
  `);

  for (const c of complaints) {
    await pool.query(
      `UPDATE complaints
       SET status = 'escalated', escalation_level = 2, escalated_at = NOW(),
           escalation_notes = 'Auto-escalated: landlord did not respond within SLA'
       WHERE id = $1`,
      [c.id]
    );

    await notifSvc.send({
      userId:   c.raised_by,
      type:     'complaint_update',
      title:    'Complaint Escalated',
      body:     `Your complaint "${c.title}" has been escalated to our support team.`,
      channels: c.whatsapp_opt_in ? ['whatsapp', 'push'] : ['sms', 'push'],
      phone:    c.phone_number,
      fcmToken: c.fcm_token,
    });
  }

  if (complaints.length > 0) {
    logger.info(`Escalation check: ${complaints.length} complaints auto-escalated`);
  }
}
