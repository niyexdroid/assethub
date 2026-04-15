CREATE TYPE listing_type AS ENUM ('standard', 'student');
CREATE TYPE property_type AS ENUM ('apartment','flat','duplex','self_contain','room','hostel','bedspace','bungalow','house');
CREATE TYPE tenancy_mode AS ENUM ('monthly', 'yearly', 'both');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE gender_preference AS ENUM ('any', 'male', 'female');

CREATE TABLE properties (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_type        listing_type NOT NULL DEFAULT 'standard',
  property_type       property_type NOT NULL,
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  address             TEXT NOT NULL,
  lga                 VARCHAR(100) NOT NULL,
  state               VARCHAR(100) NOT NULL DEFAULT 'Lagos',
  latitude            DECIMAL(10,8),
  longitude           DECIMAL(11,8),
  nearest_landmark    VARCHAR(255),
  nearest_university  VARCHAR(255),
  bedrooms            INTEGER,
  bathrooms           INTEGER,
  amenities           JSONB NOT NULL DEFAULT '[]',
  monthly_rent        DECIMAL(12,2),
  yearly_rent         DECIMAL(12,2),
  caution_fee         DECIMAL(12,2) NOT NULL DEFAULT 0,
  agency_fee          DECIMAL(12,2) NOT NULL DEFAULT 0,
  tenancy_mode        tenancy_mode NOT NULL DEFAULT 'yearly',
  available_units     INTEGER NOT NULL DEFAULT 1,
  is_available        BOOLEAN NOT NULL DEFAULT true,
  approval_status     approval_status NOT NULL DEFAULT 'pending',
  rejection_reason    TEXT,
  photos              JSONB NOT NULL DEFAULT '[]',
  video_url           VARCHAR,
  rules               TEXT,
  max_occupants       INTEGER,
  gender_preference   gender_preference NOT NULL DEFAULT 'any',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_landlord   ON properties(landlord_id);
CREATE INDEX idx_properties_lga        ON properties(lga);
CREATE INDEX idx_properties_type       ON properties(listing_type, property_type);
CREATE INDEX idx_properties_available  ON properties(is_available, approval_status);
CREATE INDEX idx_properties_location   ON properties(latitude, longitude);
