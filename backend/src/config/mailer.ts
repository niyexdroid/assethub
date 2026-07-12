import nodemailer from 'nodemailer';
import { env } from './env';

export const FROM_NAME  = 'AssetHub';
export const FROM_EMAIL = env.MAIL_FROM_EMAIL;

/**
 * Custom nodemailer transport that sends via Plunk HTTP API.
 * This avoids Railway's outbound SMTP block on free/hobby plans.
 *
 * Plunk API docs: https://docs.useplunk.com/api-reference/public-api/sendEmail
 * Endpoint: POST /v1/send
 * Auth: Bearer <api-key>
 */
export const transporter = nodemailer.createTransport({
  name:    'Plunk',
  version: '1.0.0',
  send(mail: any, callback: any) {
    const payload = {
      to:      mail.data.to,
      subject: mail.data.subject,
      body:    mail.data.html || mail.data.text || '',
      from:    `${FROM_NAME} <${FROM_EMAIL}>`,
    };

    fetch(`${env.PLUNK_API_URL}/v1/send`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${env.PLUNK_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errBody = (await res.text()).slice(0, 500);
          return callback(new Error(`Plunk API ${res.status}: ${errBody}`));
        }
        const data: any = await res.json();
        callback(null, {
          messageId: data.id ?? data.email_id ?? `plunk-${Date.now()}`,
          response:  JSON.stringify(data),
        });
      })
      .catch((err: any) => callback(err));
  },
} as any);
