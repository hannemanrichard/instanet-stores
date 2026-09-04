-- Normalize existing return codes to RET-{6 alphanumeric}

UPDATE returns
SET code = 'RET-' || upper(substr(md5(coalesce(code, '') || id::text), 1, 6))
WHERE code IS NULL
   OR btrim(code) = ''
   OR code !~ '^RET-[A-Z0-9]{6}$';

COMMENT ON COLUMN returns.code IS
  'Public return tracking id, e.g. RET-4XEE9K';
