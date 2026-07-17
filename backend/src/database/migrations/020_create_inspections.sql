CREATE TYPE inspection_status AS ENUM ('draft', 'pending_review', 'signed', 'disputed');

CREATE TABLE inspection_reports (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenancy_id          UUID NOT NULL REFERENCES tenancies(id),
  created_by          UUID NOT NULL REFERENCES users(id),
  status              inspection_status NOT NULL DEFAULT 'draft',
  gps_lat             DECIMAL(10,7),
  gps_lng             DECIMAL(10,7),
  gps_captured_at     TIMESTAMPTZ,
  content_hash        VARCHAR(64),
  tenant_signed_at    TIMESTAMPTZ,
  landlord_signed_at  TIMESTAMPTZ,
  disputed_at         TIMESTAMPTZ,
  disputed_by         UUID REFERENCES users(id),
  dispute_reason      TEXT,
  pdf_url             VARCHAR,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inspection_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id       UUID NOT NULL REFERENCES inspection_reports(id) ON DELETE CASCADE,
  item_name       VARCHAR(255) NOT NULL,
  description     TEXT,
  condition       VARCHAR(50) NOT NULL DEFAULT 'good',
  photo_urls      JSONB NOT NULL DEFAULT '[]',
  capture_source  VARCHAR(20) NOT NULL DEFAULT 'camera',
  captured_at     TIMESTAMPTZ,
  notes           TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inspection_reports_tenancy  ON inspection_reports(tenancy_id);
CREATE INDEX idx_inspection_reports_status   ON inspection_reports(status);
CREATE INDEX idx_inspection_reports_creator  ON inspection_reports(created_by);
CREATE INDEX idx_inspection_items_report     ON inspection_items(report_id);
