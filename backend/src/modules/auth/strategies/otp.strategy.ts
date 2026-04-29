import { redis } from '../../../config/redis';

const OTP_TTL = 600; // 10 minutes

export async function generateOtp(identifier: string): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:${identifier}`, otp, 'EX', OTP_TTL);
  return otp;
}

export async function verifyOtp(identifier: string, otp: string): Promise<boolean> {
  const stored = await redis.get(`otp:${identifier}`);
  if (stored && stored === otp) {
    await redis.del(`otp:${identifier}`);
    return true;
  }
  return false;
}
