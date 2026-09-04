# Bellami Stores Plan

## Locked decisions

- **Identity:** `stores` table; 1 Clerk user ≈ 1 store. Clerk role: `store` | `admin`.
- **Default store (#1):** migration seeds a first row `stores.id = 1` (placeholder / system store). All `store_id` FKs default to `1` so existing rows and inserts never violate NOT NULL / FK constraints before a real store is assigned.
- **Product ownership:** each product belongs to exactly one store (`products.store_id` NOT NULL, default `1`).
- **Supplier cost:** `products.supplier_price`. On delivery, supplier earns `Σ (order_item.unit_supplier_price × order_item.qty)`. Snapshot `unit_supplier_price` onto `order_item` at order create.
- **Sell price:** unchanged for Bellami (`orders.product_price` / retail tiers). Store UI shows supplier amounts only.
- **Orders:** `orders.store_id` NOT NULL, default `1` (set from product’s store on create when known). Keep `partner_id` if DB is shared with affiliates.
- **Returns:** Bellami-created batches. 1 return → many eligible orders. Statuses: `processed` → `collected`.
- **Payments:**
  - **Not ready:** `orders.status = delivered` AND `is_supplier_paid = false`
  - **Ready:** row in `payments` with `is_paid = false` (included orders set `is_supplier_paid = true`)
  - **Paid:** `payments.is_paid = true`
- **v1 scope:** schema + store dashboards + Bellami internal ops (orders, inventory, returns, payments).

## Domain model

```
Clerk user → stores
stores (#1 default) → products → items → inventory
products.store_id → orders.store_id
orders → order_item (unit_supplier_price × qty)
orders (returned, eligible) → returns ← return_orders
orders (delivered, unpaid) → payments ← payment_orders
```

## Schema

Migration: [`database/migrations/043_create_stores_schema.sql`](database/migrations/043_create_stores_schema.sql)

### Default store seed

On migrate, insert store `#1` if missing:

| Column | Value |
|--------|--------|
| `id` | `1` |
| `email` | `default@bellami.stores` |
| `fullname` | `Default Store` |
| `username` | `default` |
| `status` | `active` |

Then:

1. Add `store_id` columns with `DEFAULT 1` and FK → `stores(id)`
2. Backfill any NULL `store_id` to `1`
3. Set `store_id` NOT NULL on `products` and `orders`

| Table / column | Role |
|----------------|------|
| `stores` | Supplier identity (Clerk email lookup); row `#1` is the default |
| `products.store_id` / `supplier_price` | Ownership + cost (`store_id` NOT NULL, default `1`) |
| `orders.store_id` / `is_supplier_paid` | Scope + settlement (`store_id` NOT NULL, default `1`) |
| `order_item.unit_supplier_price` | Locked cost at create |
| `returns` / `return_orders` | Return batches (`returns.store_id` NOT NULL) |
| `payments` / `payment_orders` | Supplier settlements (`payments.store_id` NOT NULL) |

**Eligible return orders:** `status = returned` AND (`yalidine_status = 'Retour à retirer'` OR `dc_recent_status` does not match `recupere_par_fournisseur%`) AND not already in `return_orders`.

## Auth & API

| Current (affiliate) | Stores |
|---------------------|--------|
| role `partner` | role `store` |
| `requireCurrentPartner` | `requireCurrentStore` / `requireDashboardActor` |
| `/api/partner/me` | `/api/store/me` |
| `/api/set-role` → partners | `/api/set-role` → stores |

Store-scoped APIs filter by resolved `store.id` server-side.

Admin APIs: create orders, inventory adjustments, create/collect returns, create/mark payments.

### Data access pattern

Browser hooks never talk to Supabase. Flow:

`hooks (apiFetch)` → Clerk-protected `/api/*` → `application` services → `data` services → `supabaseServer` (service role)

- Client: `src/infrastructure/supabase/client.ts` (browser anon) — legacy only (`meta-conversion` admin helper, shared utils)
- Server: `src/infrastructure/supabase/server.ts` — Route Handlers / RSC only
- Migrated features: inventory, orders, products/product-pages, payments, returns, stores, leads/lead-hops, settings
- Public (no Clerk session): product catalog, product items, product-page GETs, `POST /api/leads`, `POST /api/lead-hops`, `GET /api/settings?scope=map`
- Auth boundary is Clerk middleware + route guards (no RLS yet)
- **Lint lock-in:** `eslint.config.mjs` bans `@/infrastructure/supabase/client` under features/shared, and bans application-service / data imports (except `import type`) from hooks, presentation, and app UI. Feature barrels export hooks + domain + presentation only (not `data` / services).

## Dashboard

| Route | Store | Admin |
|-------|-------|-------|
| `/dashboard/inventory` | Read-only own products | Full manage |
| `/dashboard/orders` | Track own orders | Create + all/store filter |
| `/dashboard/returns` | View batches | Create batch + mark collected |
| `/dashboard/payments` | Not ready / ready / paid | Create payment + mark paid |
| `/dashboard/product-pages` | — | Marketing CMS |

`/dashboard/earnings` and `/dashboard/products` redirect to payments / inventory.

## Modules

| Feature | Path |
|---------|------|
| Stores | `src/features/stores` |
| Orders | `src/features/orders` (store scope, supplier snapshot) |
| Inventory | `src/features/inventory` |
| Returns | `src/features/returns` |
| Payments | `src/features/payments` |

## Order create snapshot

1. Resolve product → `store_id`, `supplier_price` (fallback `store_id = 1` only if missing)
2. Insert `orders` with `store_id`
3. Insert `order_item` with `unit_supplier_price = products.supplier_price`
4. No commission row

Reject if product lacks `supplier_price`. Prefer assigning a real store before go-live; `#1` is a safety net, not a production supplier.

## Out of scope (v1)

- Multi-user per store
- Store-managed inventory edits
- Marketing/confirmation agent workflows in this app
- Auto return batches from DC webhooks
