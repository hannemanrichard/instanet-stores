-- ============================================================================
-- CLEANUP: Remove seeded test data for stores 3 & 4
-- ============================================================================
--
-- Deletes exactly the rows created by 001_seed_test_stores.sql and nothing
-- else. The stores rows themselves are intentionally preserved because the app
-- resolves stores by email and those identities may become useful outside the
-- fixture.
--
-- Marker scope:
--   orders      -> channel = 'test-seed-store' AND comment LIKE 'TESTSEED STORES:%'
--   payments    -> note LIKE 'TESTSEED STORES:%'
--   returns     -> code IN ('RET-S3A001', 'RET-S4A001')
--   products    -> name LIKE '[TESTSEED STORES]%'
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PRE-DELETE REPORT
-- ---------------------------------------------------------------------------
SELECT 'orders' AS entity, store_id::text AS store_ref, COUNT(*) AS rows_to_delete
FROM orders
WHERE store_id IN (3, 4)
  AND channel = 'test-seed-store'
  AND comment LIKE 'TESTSEED STORES:%'
GROUP BY store_id

UNION ALL

SELECT 'order_item', o.store_id::text, COUNT(*)
FROM order_item oi
JOIN orders o ON o.id = oi.order_id
WHERE o.store_id IN (3, 4)
  AND o.channel = 'test-seed-store'
  AND o.comment LIKE 'TESTSEED STORES:%'
GROUP BY o.store_id

UNION ALL

SELECT 'payments', store_id::text, COUNT(*)
FROM payments
WHERE store_id IN (3, 4)
  AND note LIKE 'TESTSEED STORES:%'
GROUP BY store_id

UNION ALL

SELECT 'payment_orders', p.store_id::text, COUNT(*)
FROM payment_orders po
JOIN payments p ON p.id = po.payment_id
WHERE p.store_id IN (3, 4)
  AND p.note LIKE 'TESTSEED STORES:%'
GROUP BY p.store_id

UNION ALL

SELECT 'returns', store_id::text, COUNT(*)
FROM returns
WHERE store_id IN (3, 4)
  AND code IN ('RET-S3A001', 'RET-S4A001')
GROUP BY store_id

UNION ALL

SELECT 'return_orders', r.store_id::text, COUNT(*)
FROM return_orders ro
JOIN returns r ON r.id = ro.return_id
WHERE r.store_id IN (3, 4)
  AND r.code IN ('RET-S3A001', 'RET-S4A001')
GROUP BY r.store_id

UNION ALL

SELECT 'products', store_id::text, COUNT(*)
FROM products
WHERE store_id IN (3, 4)
  AND name LIKE '[TESTSEED STORES]%'
GROUP BY store_id

UNION ALL

SELECT 'items', p.store_id::text, COUNT(*)
FROM items i
JOIN products p ON p.id = i.product_id
WHERE p.store_id IN (3, 4)
  AND p.name LIKE '[TESTSEED STORES]%'
GROUP BY p.store_id

ORDER BY 1, 2;

BEGIN;

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

COMMIT;

-- ---------------------------------------------------------------------------
-- POST-DELETE VERIFICATION
-- ---------------------------------------------------------------------------
SELECT 'orders' AS entity, COUNT(*) AS remaining
FROM orders
WHERE store_id IN (3, 4)
  AND channel = 'test-seed-store'
  AND comment LIKE 'TESTSEED STORES:%'

UNION ALL

SELECT 'payments', COUNT(*)
FROM payments
WHERE store_id IN (3, 4)
  AND note LIKE 'TESTSEED STORES:%'

UNION ALL

SELECT 'returns', COUNT(*)
FROM returns
WHERE store_id IN (3, 4)
  AND code IN ('RET-S3A001', 'RET-S4A001')

UNION ALL

SELECT 'products', COUNT(*)
FROM products
WHERE store_id IN (3, 4)
  AND name LIKE '[TESTSEED STORES]%'

ORDER BY 1;
