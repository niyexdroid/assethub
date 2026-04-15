import crypto from 'crypto';
import { Request, Response } from 'express';
import { env } from '../../config/env';
import { PaymentsService } from './payments.service';
import { logger } from '../../utils/logger';
import type { PaystackWebhookEvent } from '../../types/payment.types';

const paymentsService = new PaymentsService();

/**
 * Paystack sends a HMAC-SHA512 signature in x-paystack-signature.
 * We MUST verify this before processing — prevents forged webhook calls.
 */
function verifySignature(rawBody: Buffer, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

export async function paystackWebhook(req: Request, res: Response) {
  const signature = req.headers['x-paystack-signature'] as string;

  if (!verifySignature(req.body, signature)) {
    logger.warn('Invalid Paystack webhook signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Respond to Paystack immediately — process async
  res.sendStatus(200);
  return;

  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    logger.error('Failed to parse Paystack webhook body');
    return;
  }

  logger.info(`Paystack webhook: ${event.event}`, { reference: event.data?.reference });

  try {
    switch (event.event) {
      case 'charge.success':
        await paymentsService.handleSuccessfulPayment(event.data.reference, event.data);
        // TODO: trigger receipt notification via NotificationService
        break;

      case 'transfer.failed':
      case 'transfer.reversed':
        logger.warn(`Transfer issue: ${event.event}`, { reference: event.data.reference });
        // TODO: alert admin via NotificationService
        break;

      default:
        logger.debug(`Unhandled Paystack event: ${event.event}`);
    }
  } catch (err) {
    logger.error('Error processing Paystack webhook', err);
  }
}
