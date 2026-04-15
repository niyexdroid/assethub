import { pool } from '../../config/database';
import { paystackClient } from '../../config/paystack';
import { generateReference } from '../../utils/generateReference';
import type { InitPaymentInput } from './payments.validators';
import type { PaystackInitResponse } from '../../types/payment.types';

export class PaymentsService {
  async initializePayment(tenantId: string, input: InitPaymentInput): Promise<PaystackInitResponse> {
    // Fetch schedule + landlord subaccount in one query
    const { rows } = await pool.query(
      `SELECT ps.id, ps.total_charged, ps.platform_fee, ps.status,
              ps.landlord_id, ps.tenancy_id,
              u.email AS tenant_email,
              u.phone_number,
              sub.subaccount_code,
              sub.percentage_charge
       FROM payment_schedules ps
       JOIN users u   ON u.id   = ps.tenant_id
       JOIN paystack_subaccounts sub ON sub.landlord_id = ps.landlord_id
       WHERE ps.id = $1 AND ps.tenant_id = $2`,
      [input.schedule_id, tenantId]
    );

    const schedule = rows[0];
    if (!schedule) throw Object.assign(new Error('Payment schedule not found'), { status: 404 });
    if (schedule.status === 'paid') throw Object.assign(new Error('Already paid'), { status: 409 });

    const reference = generateReference('PAY');
    const amountKobo = Math.round(schedule.total_charged * 100); // Paystack uses kobo

    const { data } = await paystackClient.post('/transaction/initialize', {
      email:       schedule.tenant_email,
      amount:      amountKobo,
      reference,
      callback_url: input.callback_url,
      subaccount:  schedule.subaccount_code,
      // platform share is (100 - landlord_share)%
      // percentage_charge on subaccount is already set to landlord's 100% share
      // bearer tells Paystack the transaction fees come from the subaccount
      bearer: 'subaccount',
      metadata: {
        schedule_id: input.schedule_id,
        tenancy_id:  schedule.tenancy_id,
        tenant_id:   tenantId,
      },
    });

    // Record initiated transaction
    await pool.query(
      `INSERT INTO payment_transactions
         (schedule_id, tenant_id, landlord_id, paystack_reference, paystack_access_code,
          amount, platform_fee, subaccount_code, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'initiated')`,
      [
        input.schedule_id, tenantId, schedule.landlord_id,
        reference, data.data.access_code,
        schedule.total_charged - schedule.platform_fee,
        schedule.platform_fee,
        schedule.subaccount_code,
      ]
    );

    return {
      authorization_url: data.data.authorization_url,
      access_code:       data.data.access_code,
      reference,
    };
  }

  async verifyPayment(reference: string) {
    const { data } = await paystackClient.get(`/transaction/verify/${reference}`);
    const tx = data.data;

    if (tx.status !== 'success') {
      await pool.query(
        `UPDATE payment_transactions SET status = 'failed', gateway_response = $1
         WHERE paystack_reference = $2`,
        [tx.gateway_response, reference]
      );
      throw Object.assign(new Error(`Payment not successful: ${tx.gateway_response}`), { status: 402 });
    }

    await this._markPaid(reference, tx);
    return { status: 'success', reference };
  }

  /** Called by webhook — idempotent */
  async handleSuccessfulPayment(reference: string, gatewayData: any) {
    const { rows } = await pool.query(
      `SELECT status FROM payment_transactions WHERE paystack_reference = $1`,
      [reference]
    );
    if (!rows[0] || rows[0].status === 'success') return; // already processed
    await this._markPaid(reference, gatewayData);
  }

  private async _markPaid(reference: string, tx: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update transaction
      await client.query(
        `UPDATE payment_transactions
         SET status = 'success', gateway_response = $1, payment_method = $2, paid_at = $3
         WHERE paystack_reference = $4`,
        [tx.gateway_response, tx.channel, tx.paid_at, reference]
      );

      // Update schedule
      await client.query(
        `UPDATE payment_schedules ps
         SET status = 'paid'
         FROM payment_transactions pt
         WHERE pt.paystack_reference = $1
           AND pt.schedule_id = ps.id`,
        [reference]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getSchedule(tenancyId: string, userId: string) {
    const { rows } = await pool.query(
      `SELECT ps.*, pt.paystack_reference, pt.paid_at, pt.payment_method
       FROM payment_schedules ps
       LEFT JOIN payment_transactions pt
         ON pt.schedule_id = ps.id AND pt.status = 'success'
       JOIN tenancies t ON t.id = ps.tenancy_id
       WHERE ps.tenancy_id = $1
         AND (t.tenant_id = $2 OR t.landlord_id = $2)
       ORDER BY ps.due_date ASC`,
      [tenancyId, userId]
    );
    return rows;
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT pt.*, ps.period_start, ps.period_end, ps.due_date
       FROM payment_transactions pt
       JOIN payment_schedules ps ON ps.id = pt.schedule_id
       WHERE pt.tenant_id = $1 OR pt.landlord_id = $1
       ORDER BY pt.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows;
  }

  async getTransaction(transactionId: string, userId: string) {
    const { rows } = await pool.query(
      `SELECT pt.*, ps.period_start, ps.period_end
       FROM payment_transactions pt
       JOIN payment_schedules ps ON ps.id = pt.schedule_id
       WHERE pt.id = $1 AND (pt.tenant_id = $2 OR pt.landlord_id = $2)`,
      [transactionId, userId]
    );
    if (!rows[0]) throw Object.assign(new Error('Transaction not found'), { status: 404 });
    return rows[0];
  }
}
