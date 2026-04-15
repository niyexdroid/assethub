/**
 * Unit tests for fee calculator.
 * DB is mocked — these test the tier logic only.
 */
import { pool } from '../../src/config/database';
import { calculateFee } from '../../src/modules/payments/fee.calculator';

jest.mock('../../src/config/database', () => ({
  pool: { query: jest.fn() },
}));

const mockSettings = [
  { key: 'fee_tier_1_percent',   value: '2.00'   },
  { key: 'fee_tier_2_percent',   value: '1.50'   },
  { key: 'fee_tier_3_percent',   value: '1.00'   },
  { key: 'fee_tier_1_threshold', value: '100000' },
  { key: 'fee_tier_2_threshold', value: '500000' },
];

beforeEach(() => {
  (pool.query as jest.Mock).mockResolvedValue({ rows: mockSettings });
});

describe('calculateFee', () => {
  it('applies 2% for rent below ₦100,000', async () => {
    const fee = await calculateFee(50000);
    expect(fee.fee_percent).toBe(2);
    expect(fee.platform_fee).toBe(1000);
    expect(fee.total_charged).toBe(51000);
  });

  it('applies 1.5% for rent between ₦100,000 and ₦500,000', async () => {
    const fee = await calculateFee(200000);
    expect(fee.fee_percent).toBe(1.5);
    expect(fee.platform_fee).toBe(3000);
    expect(fee.total_charged).toBe(203000);
  });

  it('applies 1% for rent above ₦500,000', async () => {
    const fee = await calculateFee(800000);
    expect(fee.fee_percent).toBe(1);
    expect(fee.platform_fee).toBe(8000);
    expect(fee.total_charged).toBe(808000);
  });

  it('applies 2% exactly at ₦99,999', async () => {
    const fee = await calculateFee(99999);
    expect(fee.fee_percent).toBe(2);
  });

  it('applies 1.5% exactly at ₦100,000', async () => {
    const fee = await calculateFee(100000);
    expect(fee.fee_percent).toBe(1.5);
  });

  it('applies 1% exactly at ₦500,000', async () => {
    const fee = await calculateFee(500000);
    expect(fee.fee_percent).toBe(1);
  });
});
