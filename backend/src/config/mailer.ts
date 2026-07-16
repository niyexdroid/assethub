import { Resend } from 'resend';
import { env } from './env';

// ── Minimal transporter type (replaces nodemailer) ────────────────────────────
// ponytail: nodemailer had 8 CVEs (SMTP injection, TLS validation, etc).
// We only use createTransport({send}) as abstraction — no SMTP code paths.
// A 4-line interface replaces 200KB of dependency.

interface MailData {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{ filename?: string; content: string | Buffer }>;
}

interface SendMailResult {
  messageId: string;
  envelope: { from: string; to: string[] };
  accepted: string[];
  rejected: string[];
  response: string;
}

type SendCallback = (err: Error | null, info?: SendMailResult) => void;

interface TransportConfig {
  name: string;
  version: string;
  send: (mail: { data: MailData; message: { getEnvelope(): { from: string; to: string[] } } }, done: SendCallback) => void;
}

interface Transporter {
  sendMail(mail: MailData): Promise<SendMailResult>;
}

function createTransport(config: TransportConfig): Transporter {
  return {
    sendMail(mail: MailData): Promise<SendMailResult> {
      return new Promise((resolve, reject) => {
        config.send(
          {
            data: mail,
            message: {
              getEnvelope: () => ({
                from: mail.from,
                to: Array.isArray(mail.to) ? mail.to : [mail.to],
              }),
            },
          },
          (err: Error | null, info?: SendMailResult) => {
            if (err) reject(err);
            else resolve(info!);
          },
        );
      });
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^"?([^"]*)"?\s*<\s*(\S+?@\S+?)\s*>$/);
  if (match) return { name: match[1].trim() || '', email: match[2].trim() };
  return { name: '', email: from };
}

function parseToList(
  addresses: string | string[],
): Array<{ name: string; email: string }> {
  const list = Array.isArray(addresses) ? addresses : [addresses];
  return list.map((addr) => {
    const parsed = parseFrom(addr);
    // Brevo requires a non-empty name — default to the email local part
    if (!parsed.name) parsed.name = parsed.email.split('@')[0] ?? parsed.email;
    return parsed;
  });
}

/**
 * Brevo transport (primary).
 *
 * Brevo (formerly Sendinblue) has a 300 emails/day free tier and only
 * requires individual sender email verification — no domain needed.
 *
 * Setup:
 *   1. Sign up at https://brevo.com
 *   2. Get API key from SMTP & API → API Keys
 *   3. Verify propmanager.admin@gmail.com as a sender
 *   4. Set BREVO_API_KEY in env
 *
 * API docs: https://developers.brevo.com/reference/sendtransacemail
 */

function createBrevoTransport(): Transporter {
  return createTransport({
    name: 'brevo',
    version: '1.0.0',

    async send(mail: any, done: (err: Error | null, info?: any) => void) {
      const envelope = mail.data.envelope || mail.message.getEnvelope();
      const data = mail.data;

      try {
        const payload: Record<string, unknown> = {
          sender:       parseFrom(data.from),
          to:           parseToList(envelope.to),
          subject:      data.subject,
        };

        if (data.html)  payload.htmlContent  = data.html;
        if (data.text)  payload.textContent  = data.text;
        if (data.replyTo) {
          payload.replyTo = parseFrom(
            typeof data.replyTo === 'string' ? data.replyTo : data.replyTo,
          );
        }

        if (envelope.cc  && envelope.cc.length  > 0) {
          payload.cc = parseToList(envelope.cc);
        }
        if (envelope.bcc && envelope.bcc.length > 0) {
          payload.bcc = parseToList(envelope.bcc);
        }

        if (data.attachments && data.attachments.length > 0) {
          payload.attachment = data.attachments.map((att: any) => ({
            name:    att.filename ?? 'attachment',
            content: Buffer.isBuffer(att.content)
              ? att.content.toString('base64')
              : att.content,
          }));
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key':      env.BREVO_API_KEY,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`Brevo API ${response.status}${body ? ': ' + body : ''}`);
        }

        const result: Record<string, any> = await response.json().catch(() => ({})) as Record<string, any>;
        done(null, {
          messageId: result.messageId ?? `brevo-${Date.now()}`,
          envelope,
          accepted:  envelope.to,
          rejected:  [],
          response:  JSON.stringify(result),
        });
      } catch (err: any) {
        done(err);
      }
    },
  });
}

/**
 * Resend transport (secondary fallback).
 *
 * Free tier: 100 emails/day. Works on Railway without SMTP.
 * Requires domain verification to send beyond test mode.
 */

function createResendTransport(): Transporter {
  const resend = new Resend(env.RESEND_API_KEY);

  return createTransport({
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

        if (data.attachments && data.attachments.length > 0) {
          payload.attachments = data.attachments.map((att: any) => ({
            filename: att.filename,
            content:  att.content,
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
  });
}

/**
 * Generic HTTP transport — Plunk, Posta, Hyvor Relay, Wildduck, etc.
 *
 * Configure via env:
 *   MAIL_API_URL    — full send endpoint
 *   MAIL_API_KEY    — Bearer token
 */

function createHttpTransport(): Transporter {
  return createTransport({
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
  });
}

// ── Auto-select ─────────────────────────────────────────────────────────────────
// Brevo     → createBrevoTransport()
// Resend    → createResendTransport()
// HTTP/Plunk → createHttpTransport()
// Fallback  → Brevo (throws a clear "no API key" error on first send)

export const transporter: Transporter = env.BREVO_API_KEY
  ? createBrevoTransport()
  : env.RESEND_API_KEY
    ? createResendTransport()
    : env.MAIL_API_URL
      ? createHttpTransport()
      : createBrevoTransport();

export const FROM_EMAIL = env.MAIL_FROM_EMAIL;
export const FROM_NAME  = env.MAIL_FROM_NAME;
