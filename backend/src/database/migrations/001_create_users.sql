CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('landlord', 'tenant', 'admin');
CREATE TYPE package_type AS ENUM ('standard', 'student');

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number      VARCHAR(15) UNIQUE NOT NULL,
  email             VARCHAR(255) UNIQUE,
  password_hash     VARCHAR NOT NULL,
  first_name        VARCHAR(100),
  last_name         VARCHAR(100),
  profile_photo_url VARCHAR,
  role              user_role NOT NULL,
  package_type      package_type NOT NULL DEFAULT 'standard',
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  fcm_token         VARCHAR,
  whatsapp_opt_in   BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);
