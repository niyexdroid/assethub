import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from './env';

/**
 * Custom nodemailer transport that sends email via an HTTP API
 * (e.g. Posta, Hyvor Relay, Wildduck) instead of direct SMTP.
 *
 * This works on Railway's free/hobby plans where outbound SMTP is blocked.
 *
 * Configure via env:
 *   MAIL_API_URL   — HTTP endpoint (e.g. https://mail.yourdomain.com/api/v1/emails/send)
 *   MAIL_API_KEY   — Bearer token for the API
 *   MAIL_FROM_EMAIL — Sender email address
 *   MAIL_FROM_NAME  — Sender display name (default: "AssetHub")
 */

function createHttpTransport(): Transporter {
  return nodemailer.createTransport({
    name: 'asset-hub-http',
    version: '1.0.0',

    async send(mail: any, done: (err: Error | null, info?: any) => void) {
      const envelope = mail.data.envelope || mail.message.getEnvelope();
      const data = mail.data;

      const payload: Record<string, unknown> = {
        from: data.from,
        to: envelope.to,
        subject: data.subject,
        html: data.html,
        text: data.text,
      };

      // Include cc/bcc if present
      if (envelope.cc && envelope.cc.length > 0) payload.cc = envelope.cc;
      if (envelope.bcc && envelope.bcc.length > 0) payload.bcc = envelope.bcc;

      // Include attachments if present
      if (data.attachments && data.attachments.length > 0) {
        payload.attachments = data.attachments;
      }

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (env.MAIL_API_KEY) {
          headers['Authorization'] = `Bearer ${env.MAIL_API_KEY}`;
        }

        const response = await fetch(env.MAIL_API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`Email API returned ${response.status}${body ? ': ' + body : ''}`);
        }

        const result: Record<string, any> = await response.json().catch(() => ({})) as Record<string, any>;
        done(null, {
          messageId: result.id || result.messageId || result.message_id || '',
          envelope,
          accepted: envelope.to,
          rejected: [],
          response: JSON.stringify(result),
        });
      } catch (err: any) {
        done(err);
      }
    },
  } as any);
}

export const transporter = createHttpTransport();

export const FROM_EMAIL = env.MAIL_FROM_EMAIL;
export const FROM_NAME  = env.MAIL_FROM_NAME;
