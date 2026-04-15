CREATE TYPE tenancy_type AS ENUM ('monthly', 'yearly', 'semester');
CREATE TYPE tenancy_status AS ENUM ('pending', 'active', 'expired', 'terminated', 'disputed');

CREATE TABLE tenancies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id         UUID NOT NULL REFERENCES properties(id),
  landlord_id         UUID NOT NULL REFERENCES users(id),
  tenant_id           UUID NOT NULL REFERENCES users(id),
  tenancy_type        tenancy_type NOT NULL,
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  monthly_amount      DECIMAL(12,2),
  yearly_amount       DECIMAL(12,2),
  caution_fee_paid    DECIMAL(12,2) NOT NULL DEFAULT 0,
  agency_fee_paid     DECIMAL(12,2) NOT NULL DEFAULT 0,
  status              tenancy_status NOT NULL DEFAULT 'pending',
  agreement_url       VARCHAR,
  tenant_signed_at    TIMESTAMPTZ,
  landlord_signed_at  TIMESTAMPTZ,
  termination_reason  TEXT,
  terminated_by       UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenancies_tenant   ON tenancies(tenant_id);
CREATE INDEX idx_tenancies_landlord ON tenancies(landlord_id);
CREATE INDEX idx_tenancies_property ON tenancies(property_id);
CREATE INDEX idx_tenancies_status   ON tenancies(status);
