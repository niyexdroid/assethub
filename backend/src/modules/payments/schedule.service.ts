import { pool } from '../../config/database';
import { calculateFee } from './fee.calculator';
import { addMonths, addYears, addDays } from '../../utils/dateHelpers';

/**
 * Generates payment schedule rows for a tenancy immediately after it goes active.
 * Monthly  → one row per month for the tenancy duration
 * Yearly   → one row per year
 * Semester → one row per 6 months
 */
export async function generateSchedule(tenancyId: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT t.id, t.tenancy_type, t.start_date, t.end_date,
            t.monthly_amount, t.yearly_amount,
            t.tenant_id, t.landlord_id
     FROM tenancies t WHERE t.id = $1`,
    [tenancyId]
  );
  const tenancy = rows[0];
  if (!tenancy) throw new Error(`Tenancy ${tenancyId} not found`);

  const schedules: any[] = [];
  let cursor = new Date(tenancy.start_date);
  const end  = new Date(tenancy.end_date);

  while (cursor < end) {
    let periodEnd: Date;
    let amount: number;

    if (tenancy.tenancy_type === 'monthly') {
      periodEnd = addMonths(cursor, 1);
      amount    = parseFloat(tenancy.monthly_amount);
    } else if (tenancy.tenancy_type === 'yearly') {
      periodEnd = addYears(cursor, 1);
      amount    = parseFloat(tenancy.yearly_amount);
    } else {
      // semester
      periodEnd = addMonths(cursor, 6);
      amount    = parseFloat(tenancy.monthly_amount) * 6;
    }

    if (periodEnd > end) periodEnd = end;

    const fee        = await calculateFee(amount);
    const due_date   = addDays(cursor, -7); // Due 7 days before period start for monthly, same day for first

    schedules.push([
      tenancyId,
      tenancy.tenant_id,
      tenancy.landlord_id,
      fee.rent,
      fee.platform_fee,
      fee.total_charged,
      due_date < new Date() ? cursor : due_date, // first payment due now if already past
      cursor,
      periodEnd,
    ]);

    cursor = periodEnd;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const s of schedules) {
      await client.query(
        `INSERT INTO payment_schedules
           (tenancy_id, tenant_id, landlord_id, amount, platform_fee, total_charged, due_date, period_start, period_end)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        s
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
