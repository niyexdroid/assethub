CREATE TABLE tenancy_applications (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id        UUID        NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  landlord_id      UUID        NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  tenancy_type     VARCHAR(20) NOT NULL CHECK (tenancy_type IN ('monthly', 'yearly')),
  move_in_date     DATE        NOT NULL,
  message          TEXT,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, tenant_id)
);

CREATE INDEX idx_tenancy_applications_landlord ON tenancy_applications (landlord_id, status);
CREATE INDEX idx_tenancy_applications_tenant   ON tenancy_applications (tenant_id);
