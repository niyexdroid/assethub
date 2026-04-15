CREATE TABLE paystack_subaccounts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id       UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  subaccount_code   VARCHAR UNIQUE NOT NULL,
  business_name     VARCHAR(255) NOT NULL,
  bank_code         VARCHAR(10) NOT NULL,
  account_number    VARCHAR NOT NULL,
  account_name      VARCHAR(255) NOT NULL,
  settlement_bank   VARCHAR(100) NOT NULL,
  percentage_charge DECIMAL(5,2) NOT NULL DEFAULT 1.50,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
