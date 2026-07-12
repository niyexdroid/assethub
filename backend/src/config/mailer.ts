import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { env } from './env';

/**
 * Resend transport (primary).
 *
 * Resend has a generous free tier (100 emails/day) and works on Railway
 * without SMTP restrictions. Uses the official resend SDK.
 *
 * For testing:     from "AssetHub <onboarding@resend.dev>"
 * For production:  verify your domain at https://resend.com/domains and
 *                  update MAIL_FROM_EMAIL accordingly.
 */

function createResendTransport(): Transporter {
  const resend = new Resend(env.RESEND_API_KEY);

  return nodemailer.createTransport({
    name: 'resend',
    version: '1.0.0',

    async send(mail: any, done: (err: Error | null, info?: any) => void) {
      const envelope = mail.data.envelope || mail.message.getEnvelope();
      const data = mail.data;

      try {
        const payload: Record<string, unknown> = {
          from:    data.from,
          to:      envelope.to,
          subject: data.subject,
        };

        if (data.html)  payload.html  = data.html;
        if (data.text)  payload.text  = data.text;
        if (envelope.cc  && envelope.cc.length  > 0) payload.cc  = envelope.cc;
        if (envelope.bcc && envelope.bcc.length > 0) payload.bcc = envelope.bcc;
        if (data.replyTo) payload.reply_to = data.replyTo;

        // Map nodemailer attachments to Resend format
        if (data.attachments && data.attachments.length > 0) {
          payload.attachments = data.attachments.map((att: any) => ({
            filename: att.filename,
            content:  att.content,   // Buffer or base64 string — Resend accepts both
          }));
        }

        const result = await resend.emails.send(payload as any);

        if (result.error) {
          return done(new Error(`Resend API error: ${result.error.message}`));
        }

        done(null, {
          messageId: result.data?.id ?? `resend-${Date.now()}`,
          envelope,
          accepted:  envelope.to,
          rejected:  [],
          response:  JSON.stringify(result.data),
        });
      } catch (err: any) {
        done(err);
      }
    },
  } as any);
}

/**
 * Generic HTTP transport — Plunk, Posta, Hyvor Relay, Wildduck, etc.
 * Used when RESEND_API_KEY is not configured.
 *
 * Configure via env:
 *   MAIL_API_URL    — full send endpoint
 *   MAIL_API_KEY    — Bearer token
 *
 * Plunk example:
 *   MAIL_API_URL=https://next-api.useplunk.com/v1/send
 *   MAIL_API_KEY=sk_...
 */

function createHttpTransport(): Transporter {
  return nodemailer.createTransport({
    name: 'generic-http',
    version: '1.0.0',

    async send(mail: any, done: (err: Error | null, info?: any) => void) {
      const envelope = mail.data.envelope || mail.message.getEnvelope();
      const data = mail.data;

      const payload: Record<string, unknown> = {
        from:    data.from,
        to:      envelope.to,
        subject: data.subject,
        html:    data.html,
        text:    data.text,
      };

      if (envelope.cc  && envelope.cc.length  > 0) payload.cc  = envelope.cc;
      if (envelope.bcc && envelope.bcc.length > 0) payload.bcc = envelope.bcc;

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
          method:  'POST',
          headers,
          body:    JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`Email API returned ${response.status}${body ? ': ' + body : ''}`);
        }

        const result: Record<string, any> = await response.json().catch(() => ({})) as Record<string, any>;
        done(null, {
          messageId: result.id || result.messageId || result.message_id || `http-${Date.now()}`,
          envelope,
          accepted:  envelope.to,
          rejected:  [],
          response:  JSON.stringify(result),
        });
      } catch (err: any) {
        done(err);
      }
    },
  } as any);
}

// ── Auto-select ─────────────────────────────────────────────────────────────────
// Resend (RESEND_API_KEY set) → Resend transport
// Generic HTTP (MAIL_API_URL set) → HTTP transport (Plunk, etc.)
// Neither → Resend transport (will fail fast with a clear error)

export const transporter: Transporter = env.RESEND_API_KEY
  ? createResendTransport()
  : env.MAIL_API_URL
    ? createHttpTransport()
    : createResendTransport();   // no API key → Resend will throw on first send

export const FROM_EMAIL = env.MAIL_FROM_EMAIL;
export const FROM_NAME  = env.MAIL_FROM_NAME;
