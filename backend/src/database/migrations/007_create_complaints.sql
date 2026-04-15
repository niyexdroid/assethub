CREATE TYPE complaint_category AS ENUM ('maintenance','payment_dispute','deposit_dispute','landlord_conduct','noise','listing_misrepresentation','roommate','other');
CREATE TYPE complaint_status AS ENUM ('open','in_review','escalated','resolved','closed');
CREATE TYPE complaint_priority AS ENUM ('low','medium','high','critical');

CREATE TABLE complaints (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenancy_id        UUID NOT NULL REFERENCES tenancies(id),
  raised_by         UUID NOT NULL REFERENCES users(id),
  against           UUID NOT NULL REFERENCES users(id),
  category          complaint_category NOT NULL,
  title             VARCHAR(255) NOT NULL,
  description       TEXT NOT NULL,
  evidence_urls     JSONB NOT NULL DEFAULT '[]',
  priority          complaint_priority NOT NULL DEFAULT 'medium',
  status            complaint_status NOT NULL DEFAULT 'open',
  escalation_level  INTEGER NOT NULL DEFAULT 1,
  escalated_at      TIMESTAMPTZ,
  escalation_notes  TEXT,
  resolved_by       UUID REFERENCES users(id),
  resolution_notes  TEXT,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE complaint_messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id     UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES users(id),
  message          TEXT NOT NULL,
  attachments      JSONB NOT NULL DEFAULT '[]',
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaints_tenancy ON complaints(tenancy_id);
CREATE INDEX idx_complaints_status  ON complaints(status, escalation_level);
CREATE INDEX idx_complaint_msgs     ON complaint_messages(complaint_id);
