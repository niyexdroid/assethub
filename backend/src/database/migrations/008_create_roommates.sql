CREATE TYPE sleep_schedule AS ENUM ('early_bird','night_owl','flexible');
CREATE TYPE cleanliness_level AS ENUM ('very_clean','clean','relaxed');
CREATE TYPE noise_tolerance AS ENUM ('quiet','moderate','lively');
CREATE TYPE cooking_habit AS ENUM ('always','sometimes','never');
CREATE TYPE match_status AS ENUM ('pending','accepted','declined','expired');

CREATE TABLE roommate_profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  property_id      UUID REFERENCES properties(id),
  gender           gender_preference,
  age_range_min    INTEGER,
  age_range_max    INTEGER,
  school           VARCHAR(255),
  department       VARCHAR(255),
  level            VARCHAR(10),
  budget_min       DECIMAL(10,2),
  budget_max       DECIMAL(10,2),
  sleep_schedule   sleep_schedule,
  cleanliness      cleanliness_level,
  noise_tolerance  noise_tolerance,
  cooking_habits   cooking_habit,
  smoker           BOOLEAN NOT NULL DEFAULT false,
  pets_allowed     BOOLEAN NOT NULL DEFAULT false,
  bio              TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roommate_matches (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id        UUID NOT NULL REFERENCES users(id),
  recipient_id        UUID NOT NULL REFERENCES users(id),
  property_id         UUID NOT NULL REFERENCES properties(id),
  compatibility_score DECIMAL(5,2) NOT NULL,
  status              match_status NOT NULL DEFAULT 'pending',
  message             TEXT,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roommate_profiles_tenant   ON roommate_profiles(tenant_id);
CREATE INDEX idx_roommate_matches_requester ON roommate_matches(requester_id);
CREATE INDEX idx_roommate_matches_recipient ON roommate_matches(recipient_id);
