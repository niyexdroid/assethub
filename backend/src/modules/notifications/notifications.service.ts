import { pool } from '../../config/database';
import { logger } from '../../utils/logger';
import { sendPush } from './channels/push.channel';
import { sendWhatsApp } from './channels/whatsapp.channel';
import { sendSms, sendOtpViaSendchamp } from './channels/sms.channel';
import { sendEmail } from './channels/email.channel';
import { redis } from '../../config/redis';
import { getTemplate } from './templates';
import type { NotificationPayload, ChannelResult } from '../../types/notification.types';

export class NotificationsService {
  /**
   * Main dispatch method.
   * Fetches user contact details if not provided, then fans out to all
   * requested channels. Fallback chain: WhatsApp → SMS → Push → Email.
   * A failure on one channel does NOT block others.
   */
  async send(payload: NotificationPayload): Promise<void> {
    // Fetch user contact details if not already provided
    let { phone, email, fcmToken } = payload;
    if (!phone || !email || !fcmToken) {
      const { rows } = await pool.query(
        'SELECT phone_number, email, fcm_token, whatsapp_opt_in FROM users WHERE id = $1',
        [payload.userId]
      );
      const user = rows[0];
      if (!user) { logger.warn(`Notification skipped — user ${payload.userId} not found`); return; }
      phone    = phone    ?? user.phone_number;
      email    = email    ?? user.email;
      fcmToken = fcmToken ?? user.fcm_token;

      // Respect WhatsApp opt-in
      if (!user.whatsapp_opt_in) {
        payload.channels = payload.channels.filter(c => c !== 'whatsapp');
      }
    }

    const template = getTemplate(payload.type, {
      name:   payload.data?.name,
      amount: payload.data?.amount,
      property: payload.data?.property,
      daysUntilDue: payload.data?.daysUntilDue,
      dueDate: payload.data?.dueDate,
      reference: payload.data?.reference,
      otp:    payload.data?.otp,
      reason: payload.data?.reason,
    });

    const results: ChannelResult[] = [];

    // Fan out to all requested channels concurrently
    const tasks = payload.channels.map(async (channel) => {
      switch (channel) {
        case 'whatsapp':
          if (phone) results.push(await sendWhatsApp(phone, template.whatsapp));
          break;
        case 'sms':
          if (phone) results.push(await sendSms(phone, template.sms));
          break;
        case 'push':
          if (fcmToken) results.push(await sendPush(fcmToken, template.title, payload.body, payload.data));
          break;
        case 'email':
          if (email) results.push(await sendEmail(email, template.emailSubject, template.emailHtml));
          break;
      }
    });

    await Promise.allSettled(tasks);

    // Persist notification record + delivery status
    await this._persist(payload, results);
  }

  /**
   * Send OTP using SendChamp's Verification API.
   * Tries WhatsApp first, falls back to SMS.
   * Stores the SendChamp reference in Redis so the auth service can verify it.
   */
  async sendOtp(userId: string, email: string, otp: string): Promise<void> {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#12A376 0%,#0A6E4E 100%);padding:32px 40px;text-align:center">
            <div style="font-size:26px;font-weight:700;color:#ffffff;letter-spacing:1px">🏠 AssetHub</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px">Property Management Platform</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1a1a1a">Verification Code</p>
            <p style="margin:0 0 28px;font-size:15px;color:#555">Use the code below to complete your login. It expires in <strong>10 minutes</strong>.</p>

            <!-- OTP Box -->
            <div style="background:#f0faf6;border:2px dashed #12A376;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px">
              <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#0A6E4E;font-family:'Courier New',monospace">${otp}</div>
            </div>

            <p style="margin:0;font-size:13px;color:#888;line-height:1.6">
              🔒 Never share this code with anyone.<br>
              AssetHub staff will <strong>never</strong> ask for your verification code.
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px"><div style="border-top:1px solid #eee"></div></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;text-align:center">
            <p style="margin:0;font-size:12px;color:#bbb">If you didn't request this code, you can safely ignore this email.</p>
            <p style="margin:8px 0 0;font-size:12px;color:#ccc">© ${new Date().getFullYear()} AssetHub · Nigerian Property Management</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const result = await sendEmail(email, 'Your AssetHub verification code', html);

    try {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, data, channels, email_sent)
         VALUES ($1,'otp','Verification Code',$2,$3,'["email"]',$4)`,
        [userId, `OTP sent to ${email}`, JSON.stringify({ otp }), result.success]
      );
    } catch (err) {
      logger.error('Failed to persist OTP notification record', err);
    }
  }

  private async _persist(payload: NotificationPayload, results: ChannelResult[]) {
    const delivered = Object.fromEntries(results.map(r => [`${r.channel}_sent`, r.success]));
    try {
      await pool.query(
        `INSERT INTO notifications
           (user_id, type, title, body, data, channels, push_sent, whatsapp_sent, sms_sent, email_sent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          payload.userId,
          payload.type,
          payload.title,
          payload.body,
          JSON.stringify(payload.data ?? {}),
          JSON.stringify(payload.channels),
          delivered.push_sent     ?? false,
          delivered.whatsapp_sent ?? false,
          delivered.sms_sent      ?? false,
          delivered.email_sent    ?? false,
        ]
      );
    } catch (err) {
      logger.error('Failed to persist notification record', err);
    }
  }

  async list(userId: string, page = 1, limit = 30) {
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT id, type, title, body, data, read_at, created_at
       FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows;
  }

  async markRead(notificationId: string, userId: string) {
    await pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
  }

  async markAllRead(userId: string) {
    await pool.query(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );
  }

  async updatePreferences(userId: string, whatsappOptIn: boolean, fcmToken?: string) {
    await pool.query(
      `UPDATE users SET whatsapp_opt_in = $1, fcm_token = COALESCE($2, fcm_token), updated_at = NOW()
       WHERE id = $3`,
      [whatsappOptIn, fcmToken ?? null, userId]
    );
  }
}
