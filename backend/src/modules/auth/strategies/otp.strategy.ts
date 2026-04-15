import { redis } from '../../../config/redis';
import { normalizePhone } from '../../../utils/phoneNormalizer';

const OTP_TTL = 600; // 10 minutes

/**
 * generateOtp — generates a 6-digit code, stores it in Redis, returns it.
 */
export async function generateOtp(phone: string): Promise<string> {
  const normalised = normalizePhone(phone);
  const otp        = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:${normalised}`, otp, 'EX', OTP_TTL);
  return otp;
}

/**
 * verifyOtp — checks the OTP stored in Redis against what the user entered.
 */
export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const normalised = normalizePhone(phone);
  const stored     = await redis.get(`otp:${normalised}`);

  if (stored && stored === otp) {
    await redis.del(`otp:${normalised}`);
    return true;
  }

  return false;
}
