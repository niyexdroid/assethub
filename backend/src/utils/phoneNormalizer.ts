/**
 * Normalize Nigerian phone numbers to +234 format.
 * Accepts: 08012345678, 8012345678, +2348012345678, 2348012345678
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234')) return `+${digits}`;
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  throw new Error(`Invalid Nigerian phone number: ${phone}`);
}

export function stripCountryCode(phone: string): string {
  const normalized = normalizePhone(phone);
  return `0${normalized.slice(4)}`; // +2348012345678 → 08012345678
}
