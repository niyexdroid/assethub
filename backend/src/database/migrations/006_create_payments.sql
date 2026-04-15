CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'failed', 'waived');
CREATE TYPE transaction_status AS ENUM ('initiated', 'pending', 'success', 'failed', 'reversed');
CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'ussd', 'qr');

CREATE TABLE payment_schedules (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenancy_id          UUID NOT NULL REFERENCES tenancies(id),
  tenant_id           UUID NOT NULL REFERENCES users(id),
  landlord_id         UUID NOT NULL REFERENCES users(id),
  amount              DECIMAL(12,2) NOT NULL,
  platform_fee        DECIMAL(12,2) NOT NULL,
  total_charged       DECIMAL(12,2) NOT NULL,
  due_date            DATE NOT NULL,
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  status              payment_status NOT NULL DEFAULT 'pending',
  reminder_sent_count INTEGER NOT NULL DEFAULT 0,
  last_reminder_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id         UUID NOT NULL REFERENCES payment_schedules(id),
  tenant_id           UUID NOT NULL REFERENCES users(id),
  landlord_id         UUID NOT NULL REFERENCES users(id),
  paystack_reference  VARCHAR UNIQUE NOT NULL,
  paystack_access_code VARCHAR,
  amount              DECIMAL(12,2) NOT NULL,
  platform_fee        DECIMAL(12,2) NOT NULL,
  currency            VARCHAR(3) NOT NULL DEFAULT 'NGN',
  payment_method      payment_method,
  status              transaction_status NOT NULL DEFAULT 'initiated',
  subaccount_code     VARCHAR NOT NULL,
  gateway_response    TEXT,
  paid_at             TIMESTAMPTZ,
  receipt_sent        BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedules_tenancy  ON payment_schedules(tenancy_id);
CREATE INDEX idx_schedules_due      ON payment_schedules(due_date, status);
CREATE INDEX idx_transactions_ref   ON payment_transactions(paystack_reference);
CREATE INDEX idx_transactions_tenant ON payment_transactions(tenant_id);
