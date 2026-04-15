CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE id_doc_type AS ENUM ('bvn', 'nin', 'student_id');

CREATE TABLE kyc_verifications (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bvn                    VARCHAR,
  nin                    VARCHAR,
  bvn_verified           BOOLEAN NOT NULL DEFAULT false,
  nin_verified           BOOLEAN NOT NULL DEFAULT false,
  student_id_url         VARCHAR,
  school_email           VARCHAR(255),
  school_email_verified  BOOLEAN NOT NULL DEFAULT false,
  school_name            VARCHAR(255),
  id_doc_type            id_doc_type,
  verification_status    verification_status NOT NULL DEFAULT 'pending',
  rejection_reason       TEXT,
  verified_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_kyc_user ON kyc_verifications(user_id);
