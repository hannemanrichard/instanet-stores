ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS source TEXT;

UPDATE audit_logs
SET source = 'instanet-stores'
WHERE source IS NULL OR btrim(source) = '';

ALTER TABLE audit_logs
  ALTER COLUMN source SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_source
  ON audit_logs(source);

COMMENT ON COLUMN audit_logs.source IS
  'Project source that produced the audit entry, e.g. instanet-stores';
