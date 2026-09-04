-- Public return identifier: RET-{6 alphanumeric}

ALTER TABLE returns
  ADD COLUMN IF NOT EXISTS code TEXT;

UPDATE returns
SET code = 'RET-' || upper(substr(md5(id::text || clock_timestamp()::text), 1, 6))
WHERE code IS NULL OR btrim(code) = '';

ALTER TABLE returns
  ALTER COLUMN code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_returns_code ON returns (code);

COMMENT ON COLUMN returns.code IS
  'Public return tracking id, e.g. RET-4XEE9K';
