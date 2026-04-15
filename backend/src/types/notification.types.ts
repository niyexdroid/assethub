export type NotificationChannel = 'push' | 'whatsapp' | 'sms' | 'email';

export type NotificationType =
  | 'payment_due'
  | 'payment_received'
  | 'payment_failed'
  | 'lease_expiry'
  | 'new_match'
  | 'complaint_update'
  | 'agreement_ready'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'listing_approved'
  | 'listing_rejected'
  | 'otp';

export interface NotificationPayload {
  userId:    string;
  type:      NotificationType;
  title:     string;
  body:      string;
  channels:  NotificationChannel[];
  data?:     Record<string, any>;
  // Channel-specific overrides
  phone?:    string;  // pre-fetched to avoid extra DB call
  email?:    string;
  fcmToken?: string;
}

export interface ChannelResult {
  channel: NotificationChannel;
  success: boolean;
  error?:  string;
}
