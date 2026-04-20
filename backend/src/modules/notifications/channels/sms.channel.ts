import { sendchampClient } from '../../../config/sendchamp';
import { logger } from '../../../utils/logger';
import type { ChannelResult } from '../../../types/notification.types';

/**
 * Send a plain SMS (non-OTP) via SendChamp.
 * Requires an approved sender ID — use only after AssetHub sender is approved.
 */
export async function sendSms(phone: string, body: string): Promise<ChannelResult> {
  const to = phone.replace(/^\+/, '');
  try {
    await sendchampClient.post('/sms/send', {
      to:          [to],
      message:     body,
      sender_name: 'Sendchamp',   // default sender until AssetHub is approved
      route:       'non_dnd',
    });
    return { channel: 'sms', success: true };
  } catch (err: any) {
    logger.warn('SMS send failed', { phone, error: err?.response?.data ?? err.message });
    return { channel: 'sms', success: false, error: err.message };
  }
}

/**
 * Send OTP via SendChamp's Verification API.
 * SendChamp generates + delivers the OTP — returns the token and reference.
 * Use confirmOtp() to verify what the user enters.
 */
export async function sendOtpViaSendchamp(
  phone: string,
  channel: 'sms' | 'whatsapp' = 'sms',
): Promise<{ success: boolean; token?: string; reference?: string; error?: string }> {
  const mobile = phone.replace(/^\+/, '');
  try {
    const { data: res } = await sendchampClient.post('/verification/create', {
      channel,
      sender:                  'Sendchamp',
      token_type:              'numeric',
      token_length:            6,
      expiration_time:         10,
      customer_mobile_number:  mobile,
      meta_data:               { app: 'AssetHub' },
    });

    if (res.status !== 'success') {
      return { success: false, error: res.message };
    }

    return {
      success:   true,
      token:     res.data.token,      // the OTP (for logging in dev only)
      reference: res.data.reference,  // store this to verify later
    };
  } catch (err: any) {
    const detail = err?.response?.data ?? err.message;
    logger.warn('SendChamp OTP send failed', { phone, error: detail });
    return { success: false, error: JSON.stringify(detail) };
  }
}

/**
 * Verify OTP entered by user against SendChamp's reference.
 */
export async function confirmOtpViaSendchamp(
  reference: string,
  otp: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: res } = await sendchampClient.post('/verification/confirm', {
      verification_reference: reference,
      verification_code:      otp,
    });

    if (res.status !== 'success') {
      return { success: false, error: res.message };
    }
    return { success: true };
  } catch (err: any) {
    const detail = err?.response?.data ?? err.message;
    logger.warn('SendChamp OTP verify failed', { error: detail });
    return { success: false, error: JSON.stringify(detail) };
  }
}

/** Legacy helper kept for compatibility */
export async function sendOtpSms(phone: string, otp: string): Promise<ChannelResult> {
  const result = await sendOtpViaSendchamp(phone, 'sms');
  return { channel: 'sms', success: result.success, error: result.error };
}
