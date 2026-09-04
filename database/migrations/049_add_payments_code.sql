-- Public payment identifier: PMT-{6 alphanumeric}

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS code TEXT;

UPDATE payments
SET code = 'PMT-' || upper(substr(md5(id::text || clock_timestamp()::text), 1, 6))
WHERE code IS NULL OR btrim(code) = '';

ALTER TABLE payments
  ALTER COLUMN code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_code ON payments (code);

COMMENT ON COLUMN payments.code IS
  'Public payment identifier, e.g. PMT-4K2M9A';
