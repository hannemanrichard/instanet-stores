-- ============================================================================
-- SEED: Realistic test data for stores 3 & 4
-- ============================================================================
--
-- Targets:
--   store 3 (hannemanrichard7@gmail.com)
--   store 4 (valorios80@gmail.com)
--
-- What this creates:
--   * realistic test activity for the existing store identities 3 and 4
--   * one seed-owned product + one item per store
--   * four orders per store across delivered / processing / initial / returned
--   * one ready payment batch example and one paid payment batch example
--   * one return batch example per store
--
-- Safety / isolation:
--   orders        -> channel = 'test-seed-store' AND comment LIKE 'TESTSEED STORES:%'
--   payments      -> note LIKE 'TESTSEED STORES:%'
--   returns       -> code IN ('RET-S3A001', 'RET-S4A001')
--   products      -> name LIKE '[TESTSEED STORES]%'
--   stores        -> never created or updated here; they must already exist
--
-- The script is IDEMPOTENT: it removes its own prior seed scope first, then
-- inserts fresh rows. Run from Supabase SQL Editor as a privileged role.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- STEP 0 · Pre-flight checks: the target stores must already exist and match
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM stores
    WHERE id = 3
      AND lower(email) = 'hannemanrichard7@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Seed aborted: expected existing store id 3 with email hannemanrichard7@gmail.com.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM stores
    WHERE id = 4
      AND lower(email) = 'valorios80@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Seed aborted: expected existing store id 4 with email valorios80@gmail.com.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payments'
      AND column_name = 'code'
  ) THEN
    RAISE EXCEPTION 'Seed aborted: payments.code is missing. Apply database/migrations/049_add_payments_code.sql first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'returns'
      AND column_name = 'code'
  ) THEN
    RAISE EXCEPTION 'Seed aborted: returns.code is missing. Apply database/migrations/047_add_returns_code.sql first.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- STEP 1 · Remove any previous seed run (marker-scoped only)
-- ---------------------------------------------------------------------------
DELETE FROM payments
WHERE store_id IN (3, 4)
  AND note LIKE 'TESTSEED STORES:%';

DELETE FROM returns
WHERE store_id IN (3, 4)
  AND code IN ('RET-S3A001', 'RET-S4A001');

DELETE FROM order_item
WHERE order_id IN (
  SELECT id
  FROM orders
  WHERE store_id IN (3, 4)
    AND channel = 'test-seed-store'
    AND comment LIKE 'TESTSEED STORES:%'
);

DELETE FROM orders
WHERE store_id IN (3, 4)
  AND channel = 'test-seed-store'
  AND comment LIKE 'TESTSEED STORES:%';

DELETE FROM items
WHERE product_id IN (
  SELECT id
  FROM products
  WHERE store_id IN (3, 4)
    AND name LIKE '[TESTSEED STORES]%'
);

DELETE FROM products
WHERE store_id IN (3, 4)
  AND name LIKE '[TESTSEED STORES]%';

-- ---------------------------------------------------------------------------
-- STEP 2 · Store identities are assumed to already exist
-- ---------------------------------------------------------------------------
-- No insert/update on stores by design.

-- ---------------------------------------------------------------------------
-- STEP 3 · Seed minimal store-owned catalog
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE seed_products_spec (
  store_id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  retail_price NUMERIC(12, 2) NOT NULL,
  retail_price_2 NUMERIC(12, 2),
  retail_price_3 NUMERIC(12, 2),
  retail_commission NUMERIC(12, 2),
  supplier_price NUMERIC(12, 2) NOT NULL,
  thumbnail TEXT,
  color TEXT,
  color_hex TEXT,
  size TEXT,
  created_at TIMESTAMPTZ NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_products_spec (
  store_id, name, description,
  retail_price, retail_price_2, retail_price_3, retail_commission, supplier_price,
  thumbnail, color, color_hex, size, created_at
) VALUES
  (
    3,
    '[TESTSEED STORES] Store 3 Signature Set',
    'Seed fixture product for store 3',
    6500, 6200, 5900, 450, 3100,
    NULL,
    'Ivory', '#F3EBDD', 'Standard',
    TIMESTAMPTZ '2026-08-01 09:00:00+00'
  ),
  (
    4,
    '[TESTSEED STORES] Store 4 Premium Set',
    'Seed fixture product for store 4',
    7200, 6900, 6500, 500, 2950,
    NULL,
    'Black', '#111111', 'Standard',
    TIMESTAMPTZ '2026-08-03 09:00:00+00'
  );

INSERT INTO products (
  store_id,
  name,
  description,
  retail_price,
  retail_price_2,
  retail_price_3,
  retail_commission,
  supplier_price,
  thumbnail,
  created_at
)
SELECT
  store_id,
  name,
  description,
  retail_price,
  retail_price_2,
  retail_price_3,
  retail_commission,
  supplier_price,
  thumbnail,
  created_at
FROM seed_products_spec;

CREATE TEMP TABLE seeded_products ON COMMIT DROP AS
SELECT
  p.id AS product_id,
  s.store_id,
  s.name,
  s.retail_price,
  s.retail_price_2,
  s.retail_price_3,
  s.supplier_price,
  s.color,
  s.color_hex,
  s.size,
  s.thumbnail
FROM seed_products_spec s
JOIN products p
  ON p.store_id = s.store_id
 AND p.name = s.name;

INSERT INTO items (
  product_id,
  product,
  color,
  color_hex,
  size,
  thumbnail,
  created_at
)
SELECT
  product_id,
  name,
  color,
  color_hex,
  size,
  thumbnail,
  TIMESTAMPTZ '2026-08-05 09:00:00+00'
FROM seeded_products;

CREATE TEMP TABLE seeded_items ON COMMIT DROP AS
SELECT
  sp.store_id,
  sp.product_id,
  i.id AS item_id,
  sp.name AS product_name,
  sp.color,
  sp.size,
  sp.retail_price,
  sp.retail_price_2,
  sp.retail_price_3,
  sp.supplier_price
FROM seeded_products sp
JOIN items i
  ON i.product_id = sp.product_id
 AND i.product = sp.name;

-- ---------------------------------------------------------------------------
-- STEP 4 · Order specifications
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE seed_order_specs (
  seed_key TEXT PRIMARY KEY,
  store_id BIGINT NOT NULL,
  status TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  commune TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  qty INT NOT NULL,
  delivery_fees NUMERIC(12, 2) NOT NULL,
  shipping_price NUMERIC(12, 2) NOT NULL,
  is_supplier_paid BOOLEAN NOT NULL,
  dc_recent_status TEXT,
  yalidine_status TEXT,
  tracking_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  modified_at TIMESTAMPTZ
) ON COMMIT DROP;

INSERT INTO seed_order_specs (
  seed_key, store_id, status,
  first_name, last_name, phone, address, commune, wilaya,
  qty, delivery_fees, shipping_price,
  is_supplier_paid, dc_recent_status, yalidine_status, tracking_id,
  created_at, modified_at
) VALUES
  (
    'S3-DELIV-UNPAID', 3, 'delivered',
    'Amine', 'Benali', '0550123401', '12 Rue Emir Abdelkader', 'Bab Ezzouar', 'Alger',
    1, 600, 600,
    false, 'encaisse', 'Livré', 'TESTSEED-S3-001',
    TIMESTAMPTZ '2026-08-10 10:00:00+00', TIMESTAMPTZ '2026-08-12 10:00:00+00'
  ),
  (
    'S3-DELIV-READY', 3, 'delivered',
    'Sara', 'Mansouri', '0550123402', '18 Rue des Freres', 'Bir El Djir', 'Oran',
    2, 650, 650,
    true, 'encaisse', 'Livré', 'TESTSEED-S3-002',
    TIMESTAMPTZ '2026-08-14 11:00:00+00', TIMESTAMPTZ '2026-08-16 11:00:00+00'
  ),
  (
    'S3-PROCESSING', 3, 'processing',
    'Lina', 'Kaci', '0550123403', '3 Cite El Wiam', 'Sidi Bel Abbes', 'Sidi Bel Abbes',
    1, 550, 550,
    false, 'en_preparation', 'En cours', 'TESTSEED-S3-003',
    TIMESTAMPTZ '2026-08-26 09:30:00+00', TIMESTAMPTZ '2026-08-26 09:30:00+00'
  ),
  (
    'S3-RETURNED', 3, 'returned',
    'Nadia', 'Cherif', '0550123404', '45 Rue des Jasmins', 'Annaba', 'Annaba',
    1, 700, 700,
    false, 'retour_entrepot', 'Retour à retirer', 'TESTSEED-S3-004',
    TIMESTAMPTZ '2026-08-20 08:00:00+00', TIMESTAMPTZ '2026-08-22 08:00:00+00'
  ),
  (
    'S4-DELIV-UNPAID', 4, 'delivered',
    'Rania', 'Saadi', '0660123401', '8 Cite 200 logements', 'Hydra', 'Alger',
    1, 500, 500,
    false, 'encaisse', 'Livré', 'TESTSEED-S4-001',
    TIMESTAMPTZ '2026-08-11 10:30:00+00', TIMESTAMPTZ '2026-08-13 10:30:00+00'
  ),
  (
    'S4-DELIV-PAID', 4, 'delivered',
    'Omar', 'Bouzid', '0660123402', '22 Rue de la Gare', 'El Khroub', 'Constantine',
    3, 650, 650,
    true, 'encaisse', 'Livré', 'TESTSEED-S4-002',
    TIMESTAMPTZ '2026-08-15 13:00:00+00', TIMESTAMPTZ '2026-08-18 13:00:00+00'
  ),
  (
    'S4-INITIAL', 4, 'initial',
    'Karim', 'Ziani', '0660123403', '11 Rue des Orangers', 'Boufarik', 'Blida',
    1, 450, 450,
    false, NULL, NULL, NULL,
    TIMESTAMPTZ '2026-09-01 09:00:00+00', TIMESTAMPTZ '2026-09-01 09:00:00+00'
  ),
  (
    'S4-RETURNED', 4, 'returned',
    'Imene', 'Haddad', '0660123404', '90 Hay El Badr', 'Akbou', 'Bejaia',
    1, 550, 550,
    false, 'retour_entrepot', 'Retour à retirer', 'TESTSEED-S4-004',
    TIMESTAMPTZ '2026-08-23 08:30:00+00', TIMESTAMPTZ '2026-08-25 08:30:00+00'
  );

INSERT INTO orders (
  store_id,
  status,
  first_name,
  last_name,
  phone,
  address,
  commune,
  wilaya,
  product,
  product_color,
  product_size,
  product_price,
  product_qty,
  delivery_fees,
  shipping_price,
  delivery_company,
  is_free_shipping,
  is_stopdesk,
  is_auto_delivered,
  is_exchange_required,
  has_defect,
  return_processed,
  is_supplier_paid,
  channel,
  comment,
  dc_recent_status,
  yalidine_status,
  tracking_id,
  created_at,
  modified_at
)
SELECT
  si.store_id,
  spec.status,
  spec.first_name,
  spec.last_name,
  spec.phone,
  spec.address,
  spec.commune,
  spec.wilaya,
  si.product_name,
  si.color,
  si.size,
  CASE
    WHEN spec.qty >= 3 THEN COALESCE(si.retail_price_3, si.retail_price_2, si.retail_price)
    WHEN spec.qty = 2 THEN COALESCE(si.retail_price_2, si.retail_price)
    ELSE si.retail_price
  END,
  spec.qty,
  spec.delivery_fees,
  spec.shipping_price,
  'zr',
  false,
  false,
  false,
  false,
  false,
  spec.status = 'returned',
  spec.is_supplier_paid,
  'test-seed-store',
  'TESTSEED STORES:' || spec.seed_key,
  spec.dc_recent_status,
  spec.yalidine_status,
  spec.tracking_id,
  spec.created_at,
  spec.modified_at
FROM seed_order_specs spec
JOIN seeded_items si
  ON si.store_id = spec.store_id;

CREATE TEMP TABLE seeded_orders ON COMMIT DROP AS
SELECT
  id AS order_id,
  store_id,
  comment
FROM orders
WHERE channel = 'test-seed-store'
  AND comment LIKE 'TESTSEED STORES:%'
  AND store_id IN (3, 4);

INSERT INTO order_item (
  order_id,
  item_id,
  qty,
  unit_supplier_price
)
SELECT
  so.order_id,
  si.item_id,
  o.product_qty,
  si.supplier_price
FROM seeded_orders so
JOIN orders o
  ON o.id = so.order_id
JOIN seeded_items si
  ON si.store_id = so.store_id;

-- ---------------------------------------------------------------------------
-- STEP 5 · Payment fixtures
-- ---------------------------------------------------------------------------
INSERT INTO payments (
  store_id,
  amount,
  is_paid,
  note,
  code,
  created_at,
  paid_at
)
VALUES
  (
    3,
    (
      SELECT (oi.unit_supplier_price * oi.qty)
      FROM order_item oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.comment = 'TESTSEED STORES:S3-DELIV-READY'
      LIMIT 1
    ),
    false,
    'TESTSEED STORES:READY:S3',
    'PMT-S3P001',
    TIMESTAMPTZ '2026-08-24 10:00:00+00',
    NULL
  ),
  (
    4,
    (
      SELECT (oi.unit_supplier_price * oi.qty)
      FROM order_item oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.comment = 'TESTSEED STORES:S4-DELIV-PAID'
      LIMIT 1
    ),
    true,
    'TESTSEED STORES:PAID:S4',
    'PMT-S4P001',
    TIMESTAMPTZ '2026-08-27 10:00:00+00',
    TIMESTAMPTZ '2026-08-29 10:00:00+00'
  );

INSERT INTO payment_orders (
  payment_id,
  order_id,
  amount
)
SELECT
  p.id,
  o.id,
  (oi.unit_supplier_price * oi.qty)
FROM payments p
JOIN orders o
  ON (
    (p.store_id = 3 AND o.comment = 'TESTSEED STORES:S3-DELIV-READY')
    OR
    (p.store_id = 4 AND o.comment = 'TESTSEED STORES:S4-DELIV-PAID')
  )
JOIN order_item oi
  ON oi.order_id = o.id
WHERE p.note IN ('TESTSEED STORES:READY:S3', 'TESTSEED STORES:PAID:S4');

-- ---------------------------------------------------------------------------
-- STEP 6 · Return fixtures
-- ---------------------------------------------------------------------------
INSERT INTO returns (
  store_id,
  status,
  code,
  created_at,
  modified_at
)
VALUES
  (
    3,
    'processed',
    'RET-S3A001',
    TIMESTAMPTZ '2026-08-28 09:00:00+00',
    TIMESTAMPTZ '2026-08-28 09:00:00+00'
  ),
  (
    4,
    'collected',
    'RET-S4A001',
    TIMESTAMPTZ '2026-08-30 09:00:00+00',
    TIMESTAMPTZ '2026-08-31 09:00:00+00'
  );

INSERT INTO return_orders (
  return_id,
  order_id
)
SELECT
  r.id,
  o.id
FROM returns r
JOIN orders o
  ON (
    (r.store_id = 3 AND o.comment = 'TESTSEED STORES:S3-RETURNED')
    OR
    (r.store_id = 4 AND o.comment = 'TESTSEED STORES:S4-RETURNED')
  )
WHERE r.code IN ('RET-S3A001', 'RET-S4A001');

COMMIT;

-- ---------------------------------------------------------------------------
-- POST-RUN VERIFICATION
-- ---------------------------------------------------------------------------
SELECT id, email, fullname, username, status
FROM stores
WHERE id IN (3, 4)
ORDER BY id;

SELECT store_id, status, COUNT(*) AS order_count
FROM orders
WHERE channel = 'test-seed-store'
  AND comment LIKE 'TESTSEED STORES:%'
GROUP BY store_id, status
ORDER BY store_id, status;

SELECT store_id, is_paid, COUNT(*) AS payment_count, SUM(amount) AS total_amount
FROM payments
WHERE note LIKE 'TESTSEED STORES:%'
GROUP BY store_id, is_paid
ORDER BY store_id, is_paid;

SELECT store_id, status, COUNT(*) AS return_count
FROM returns
WHERE code IN ('RET-S3A001', 'RET-S4A001')
GROUP BY store_id, status
ORDER BY store_id, status;
