import { pool } from '../config/database';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { logger } from '../utils/logger';

const notifSvc = new NotificationsService();

/**
 * Run daily via cron (e.g. 8am Lagos time).
 * Finds payment schedules due in 7, 3, or 1 day and sends reminders.
 * Also marks overdue schedules.
 */
export async function runPaymentReminders() {
  logger.info('Running payment reminder job');

  // Upcoming reminders: due in 1, 3, or 7 days
  const { rows: upcoming } = await pool.query(`
    SELECT ps.id, ps.tenant_id, ps.amount, ps.due_date,
           u.phone_number, u.fcm_token, u.whatsapp_opt_in,
           p.title AS property_title
    FROM payment_schedules ps
    JOIN users u       ON u.id = ps.tenant_id
    JOIN tenancies t   ON t.id = ps.tenancy_id
    JOIN properties p  ON p.id = t.property_id
    WHERE ps.status = 'pending'
      AND ps.due_date IN (
        CURRENT_DATE + INTERVAL '7 days',
        CURRENT_DATE + INTERVAL '3 days',
        CURRENT_DATE + INTERVAL '1 day'
      )
  `);

  for (const row of upcoming) {
    const daysUntilDue = Math.round(
      (new Date(row.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    await notifSvc.send({
      userId:   row.tenant_id,
      type:     'payment_due',
      title:    `Rent due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
      body:     `₦${row.amount} due for ${row.property_title}`,
      channels: row.whatsapp_opt_in ? ['whatsapp', 'push'] : ['sms', 'push'],
      phone:    row.phone_number,
      fcmToken: row.fcm_token,
      data: {
        amount:       row.amount,
        property:     row.property_title,
        daysUntilDue,
        dueDate:      row.due_date,
      },
    });

    await pool.query(
      `UPDATE payment_schedules
       SET reminder_sent_count = reminder_sent_count + 1, last_reminder_at = NOW()
       WHERE id = $1`,
      [row.id]
    );
  }

  // Mark overdue
  const { rowCount } = await pool.query(`
    UPDATE payment_schedules
    SET status = 'overdue'
    WHERE status = 'pending' AND due_date < CURRENT_DATE
  `);

  logger.info(`Payment reminders: ${upcoming.length} sent, ${rowCount} marked overdue`);
}
