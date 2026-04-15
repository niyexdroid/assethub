CREATE TYPE notification_type AS ENUM (
  'payment_due','payment_received','payment_failed',
  'lease_expiry','new_match','complaint_update',
  'agreement_ready','kyc_approved','kyc_rejected',
  'listing_approved','listing_rejected'
);

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           VARCHAR(255) NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB NOT NULL DEFAULT '{}',
  channels        JSONB NOT NULL DEFAULT '["push"]',
  push_sent       BOOLEAN NOT NULL DEFAULT false,
  whatsapp_sent   BOOLEAN NOT NULL DEFAULT false,
  sms_sent        BOOLEAN NOT NULL DEFAULT false,
  email_sent      BOOLEAN NOT NULL DEFAULT false,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user   ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
