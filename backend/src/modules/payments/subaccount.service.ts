import { pool } from '../../config/database';
import { paystackClient } from '../../config/paystack';
import { encrypt } from '../../utils/crypto';

interface SubaccountInput {
  business_name:  string;
  bank_code:      string;
  account_number: string;
  account_name:   string;
}

export class SubaccountService {
  async create(landlordId: string, input: SubaccountInput) {
    const existing = await pool.query(
      'SELECT subaccount_code FROM paystack_subaccounts WHERE landlord_id = $1',
      [landlordId]
    );
    if (existing.rows[0]) return existing.rows[0]; // already set up

    // Create on Paystack — percentage_charge is landlord's share (100 - platform_fee)
    // Platform fee is deducted automatically based on the split
    const { data } = await paystackClient.post('/subaccount', {
      business_name:    input.business_name,
      bank_code:        input.bank_code,
      account_number:   input.account_number,
      percentage_charge: 100, // landlord receives 100%; our fee is added on top as total_charged
    });

    const subaccount = data.data;
    await pool.query(
      `INSERT INTO paystack_subaccounts
         (landlord_id, subaccount_code, business_name, bank_code,
          account_number, account_name, settlement_bank, percentage_charge)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        landlordId,
        subaccount.subaccount_code,
        input.business_name,
        input.bank_code,
        encrypt(input.account_number),
        input.account_name,
        subaccount.settlement_bank,
        100,
      ]
    );

    return { subaccount_code: subaccount.subaccount_code };
  }

  async get(landlordId: string) {
    const { rows } = await pool.query(
      `SELECT subaccount_code, business_name, account_name, settlement_bank, is_active
       FROM paystack_subaccounts WHERE landlord_id = $1`,
      [landlordId]
    );
    if (!rows[0]) throw Object.assign(new Error('Subaccount not set up'), { status: 404 });
    return rows[0];
  }

  async listBanks() {
    const { data } = await paystackClient.get('/bank?currency=NGN&country=nigeria');
    return data.data.map((b: any) => ({ name: b.name, code: b.code }));
  }

  async resolveAccount(accountNumber: string, bankCode: string) {
    const { data } = await paystackClient.get(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );
    return { account_name: data.data.account_name };
  }
}
