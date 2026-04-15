import { pool } from '../../config/database';
import { FeeBreakdown } from '../../types/payment.types';

/**
 * Reads fee tiers from platform_settings (admin-configurable, no hardcoding).
 * Tiers:
 *   rent < tier_1_threshold          → fee_tier_1_percent
 *   tier_1_threshold <= rent < tier_2 → fee_tier_2_percent
 *   rent >= tier_2_threshold          → fee_tier_3_percent
 */
async function getSettings(): Promise<Record<string, number>> {
  const keys = [
    'fee_tier_1_percent',
    'fee_tier_2_percent',
    'fee_tier_3_percent',
    'fee_tier_1_threshold',
    'fee_tier_2_threshold',
  ];
  const { rows } = await pool.query(
    `SELECT key, value FROM platform_settings WHERE key = ANY($1)`,
    [keys]
  );
  return Object.fromEntries(rows.map((r: any) => [r.key, parseFloat(r.value)]));
}

export async function calculateFee(rentAmount: number): Promise<FeeBreakdown> {
  const s = await getSettings();

  let feePercent: number;
  if (rentAmount < s.fee_tier_1_threshold) {
    feePercent = s.fee_tier_1_percent;
  } else if (rentAmount < s.fee_tier_2_threshold) {
    feePercent = s.fee_tier_2_percent;
  } else {
    feePercent = s.fee_tier_3_percent;
  }

  const platform_fee  = parseFloat(((rentAmount * feePercent) / 100).toFixed(2));
  const total_charged = parseFloat((rentAmount + platform_fee).toFixed(2));

  return { rent: rentAmount, platform_fee, total_charged, fee_percent: feePercent };
}
