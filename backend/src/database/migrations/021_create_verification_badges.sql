-- Landlord verification documents (utility bill, land registry, property title)
CREATE TYPE verification_doc_type AS ENUM ('utility_bill', 'land_registry', 'property_title');

CREATE TABLE landlord_verifications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verification_type verification_doc_type NOT NULL,
  document_url      VARCHAR NOT NULL,
  status            verification_status NOT NULL DEFAULT 'pending',
  reviewed_by       UUID REFERENCES users(id),
  rejection_reason  TEXT,
  verified_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_landlord_verifications_user   ON landlord_verifications(landlord_id);
CREATE INDEX idx_landlord_verifications_status ON landlord_verifications(status);

-- Tenant ratings of landlords after tenancy ends
CREATE TABLE landlord_ratings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenancy_id  UUID NOT NULL REFERENCES tenancies(id),
  tenant_id   UUID NOT NULL REFERENCES users(id),
  landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenancy_id, tenant_id)
);

CREATE INDEX idx_landlord_ratings_landlord ON landlord_ratings(landlord_id);
CREATE INDEX idx_landlord_ratings_tenancy  ON landlord_ratings(tenancy_id);

-- Materialized badge tier column on users (0 = none, 1-3)
ALTER TABLE users ADD COLUMN landlord_badge SMALLINT NOT NULL DEFAULT 0;

-- Trigger function: recompute landlord badge when relevant data changes
CREATE OR REPLACE FUNCTION recompute_landlord_badge(p_landlord_id UUID)
RETURNS void AS $$
DECLARE
  kyc_ok       BOOLEAN;
  ownership_ok BOOLEAN;
  tenancy_count INT;
  avg_rating   NUMERIC;
  new_badge    SMALLINT;
BEGIN
  -- Tier 1: KYC approved
  SELECT EXISTS(
    SELECT 1 FROM kyc_verifications
    WHERE user_id = p_landlord_id AND verification_status = 'approved'
  ) INTO kyc_ok;

  -- Tier 2: ownership document verified
  SELECT EXISTS(
    SELECT 1 FROM landlord_verifications
    WHERE landlord_id = p_landlord_id AND status = 'approved'
  ) INTO ownership_ok;

  -- Tier 3: 3+ expired tenancies with average rating >= 3.5
  SELECT COUNT(*), COALESCE(AVG(r.rating), 0)
  INTO tenancy_count, avg_rating
  FROM tenancies t
  LEFT JOIN landlord_ratings r ON r.tenancy_id = t.id
  WHERE t.landlord_id = p_landlord_id AND t.status = 'expired';

  IF kyc_ok AND ownership_ok AND tenancy_count >= 3 AND avg_rating >= 3.5 THEN
    new_badge := 3;
  ELSIF kyc_ok AND ownership_ok THEN
    new_badge := 2;
  ELSIF kyc_ok THEN
    new_badge := 1;
  ELSE
    new_badge := 0;
  END IF;

  UPDATE users SET landlord_badge = new_badge WHERE id = p_landlord_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger wrappers that call recompute for the affected landlord
CREATE OR REPLACE FUNCTION trigger_kyc_badge() RETURNS trigger AS $$
BEGIN
  PERFORM recompute_landlord_badge(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_verification_badge() RETURNS trigger AS $$
BEGIN
  PERFORM recompute_landlord_badge(NEW.landlord_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_rating_badge() RETURNS trigger AS $$
BEGIN
  PERFORM recompute_landlord_badge(NEW.landlord_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_tenancy_badge() RETURNS trigger AS $$
BEGIN
  -- Recompute when tenancy status changes to/from expired
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status)
     OR TG_OP IN ('INSERT', 'DELETE') THEN
    PERFORM recompute_landlord_badge(COALESCE(NEW.landlord_id, OLD.landlord_id));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
CREATE TRIGGER trg_kyc_badge
  AFTER INSERT OR UPDATE OF verification_status ON kyc_verifications
  FOR EACH ROW EXECUTE FUNCTION trigger_kyc_badge();

CREATE TRIGGER trg_verification_badge
  AFTER INSERT OR UPDATE OF status ON landlord_verifications
  FOR EACH ROW EXECUTE FUNCTION trigger_verification_badge();

CREATE TRIGGER trg_rating_badge
  AFTER INSERT OR UPDATE OF rating ON landlord_ratings
  FOR EACH ROW EXECUTE FUNCTION trigger_rating_badge();

CREATE TRIGGER trg_tenancy_badge
  AFTER INSERT OR UPDATE OR DELETE ON tenancies
  FOR EACH ROW EXECUTE FUNCTION trigger_tenancy_badge();
