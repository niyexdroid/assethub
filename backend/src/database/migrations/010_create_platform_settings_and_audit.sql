-- Platform settings (all fees/thresholds configurable from admin panel)
CREATE TABLE platform_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         VARCHAR(100) UNIQUE NOT NULL,
  value       VARCHAR(255) NOT NULL,
  description TEXT,
  updated_by  UUID REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('fee_tier_1_percent',    '2.00',   'Fee % for rent below tier_1_threshold'),
  ('fee_tier_2_percent',    '1.50',   'Fee % for rent between tier_1 and tier_2 thresholds'),
  ('fee_tier_3_percent',    '1.00',   'Fee % for rent above tier_2_threshold'),
  ('fee_tier_1_threshold',  '100000', 'Upper bound (NGN) for tier 1 fee'),
  ('fee_tier_2_threshold',  '500000', 'Upper bound (NGN) for tier 2 fee'),
  ('complaint_sla_hours',   '72',     'Hours landlord has to respond before auto-escalation'),
  ('match_min_score',       '60',     'Minimum roommate compatibility score to show a match'),
  ('match_expiry_days',     '7',      'Days before an unaccepted roommate request expires');

-- Audit logs
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor  ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
