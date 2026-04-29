-- Switch primary identifier from phone_number to email
-- Set placeholder emails for any existing rows without one (dev data only)
UPDATE users
SET email = CONCAT('user_', SUBSTR(id::text, 1, 8), '@placeholder.local')
WHERE email IS NULL;

ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;
