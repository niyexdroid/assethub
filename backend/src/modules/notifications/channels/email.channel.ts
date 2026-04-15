import { transporter, FROM_EMAIL, FROM_NAME } from '../../../config/mailer';
import { logger } from '../../../utils/logger';
import type { ChannelResult } from '../../../types/notification.types';

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<ChannelResult> {
  try {
    await transporter.sendMail({
      from:    `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    return { channel: 'email', success: true };
  } catch (err: any) {
    logger.warn('Email notification failed', { to, error: err.message });
    return { channel: 'email', success: false, error: err.message };
  }
}
