import axios from 'axios';
import { env } from '../../../config/env';

const BASE = 'https://api.paystack.co';
const headers = { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` };

export async function verifyBvn(bvn: string): Promise<{ verified: boolean; first_name?: string; last_name?: string }> {
  const { data } = await axios.get(`${BASE}/bank/resolve_bvn/${bvn}`, { headers });
  return {
    verified:   data.status === true,
    first_name: data.data?.first_name,
    last_name:  data.data?.last_name,
  };
}

export async function resolveBankAccount(accountNumber: string, bankCode: string) {
  const { data } = await axios.get(`${BASE}/bank/resolve`, {
    headers,
    params: { account_number: accountNumber, bank_code: bankCode },
  });
  return { account_name: data.data?.account_name };
}
