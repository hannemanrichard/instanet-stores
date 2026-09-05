# Instanet Affiliate Improvements Porting Checklist

This document summarizes the improvements made in `instanet-affiliate` that should be considered for `instanet-stores`.

---

## Goal

Port the security, validation, financial-integrity, performance, and audit-logging improvements from `instanet-affiliate` into `instanet-stores` in a structured way.

---

## 1. Request Validation Foundation

Create shared server helpers equivalent to:

- `parseJsonBody(req, schema)`
- `parseSearchParams(searchParams, schema)`
- `parsePositiveIntParam(value, name)`
- `ValidationError`
- unified `jsonError` handling

Implementation checklist:

- Add a shared `parseRequest` utility for all route handlers.
- Add a shared `jsonError` utility that returns consistent API responses.
- Add feature-level `domain/validations.ts` files using Zod.
- Ensure every route parses and validates request data before business logic runs.

Why this matters:

- Prevents malformed input from reaching services.
- Makes API behavior predictable.
- Reduces repeated route-level parsing code.

---

## 2. Server/Client Supabase Separation

Adopt a strict split between public and privileged Supabase access.

Implementation checklist:

- Keep the browser-safe Supabase module limited to the anon/public client.
- Move all service-role usage into a `server-only` module.
- Audit imports and remove any service-role client usage from browser-safe files.

Why this matters:

- Prevents accidental privileged client exposure.
- Makes the trust boundary explicit.

---

## 3. Ownership and Authorization Guards

Introduce reusable server-side access guards for tenant-scoped resources.

Patterns to port:

- current user / current partner resolution
- resource ownership guard
- dashboard actor guard

Implementation checklist:

- Add guards for store-scoped access.
- Add guards for order access.
- Add guards for lead/customer access if applicable.
- Make cross-tenant access return not found instead of leaking existence.

Why this matters:

- Prevents IDOR issues.
- Centralizes authorization rules.

---

## 4. Public Route Hardening

For any anonymous storefront route, use a separate public schema and enforce server-owned defaults.

Implementation checklist:

- Create public-specific Zod schemas.
- Remove privileged fields from public allowlists.
- Force workflow defaults on the server, for example `status: "initial"`.
- Keep authenticated and public route contracts separate.

Why this matters:

- Anonymous flows are usually the easiest abuse path.
- Public routes should never accept internal workflow state from the client.

---

## 5. Financial Integrity

Make all commercial amounts server-authoritative.

Fields that should not be client-trusted:

- product price
- shipping price
- delivery fees
- commission-related values
- payout-related values
- discounts unless validated against server rules

Implementation checklist:

- Accept IDs, quantities, and destination from the client.
- Resolve product pricing on the server from trusted catalog data.
- Resolve delivery fees on the server from delivery rules or location data.
- Recompute final totals on the server.
- Do not persist raw client-supplied monetary values as authoritative fields.

Why this matters:

- Prevents underpricing and commission mismatch.
- Protects payout and COD integrity.

---

## 6. Field Allowlists Per Actor

Define exactly which fields each actor can write.

Implementation checklist:

- Add partner/staff create allowlists.
- Add partner/staff update allowlists.
- Add public route allowlists.
- Explicitly exclude workflow and system-owned fields.

Examples of fields that usually need protection:

- `status`
- `partner_id`
- `agent_id`
- tracking fields
- parcel fields
- internal audit fields
- monetary authority fields

Why this matters:

- Prevents privilege escalation through over-posting.
- Keeps route behavior explicit and testable.

---

## 7. Rate Limiting

Add shared route throttling for abuseable endpoints.

What was done in `instanet-affiliate`:

- added a shared `rateLimit` server helper
- throttled `meta-conversion`
- throttled public lead submission
- throttled UploadThing authenticated upload entrypoints

Implementation checklist:

- Add a shared rate-limit helper.
- Rate-limit anonymous/public endpoints by IP.
- Rate-limit authenticated sensitive endpoints by user ID.
- Return `429` with `Retry-After`.
- Add tests covering allow, block, and reset behavior.

Important note:

- The current implementation is in-memory/process-local.
- For multi-instance production, prefer Redis/Upstash or another centralized store.

Why this matters:

- Reduces spam, brute-force, and resource abuse.
- Protects file uploads and public submission routes.

---

## 8. Upload Hardening

Move upload authorization into the upload router itself.

Implementation checklist:

- Keep provider callbacks working if they cannot carry Clerk session state.
- Enforce auth inside upload route middleware.
- Restrict privileged upload types to admin or staff roles.
- Add rate limiting to upload entrypoints.

Why this matters:

- Upload endpoints are high-risk for abuse and cost amplification.

---

## 9. Audit Logging Improvements

Standardize server-side audit writes and tag them by source.

What was improved:

- audit logging moved to server-side Supabase access
- central source constant added
- database wrapper injects source automatically
- audited mutation path tested

Implementation checklist:

- Ensure audit writes happen server-side only.
- Add a central source constant or env var.
- Make the DB wrapper inject source automatically.
- Add at least one focused test that proves the source is written.

Why this matters:

- Shared audit tables remain attributable by project.
- Prevents clients from forging or bypassing audit provenance.

---

## 10. Pagination and Summary Performance

Push large-list and summary work down to the database.

What was improved:

- leads list pagination
- narrower selected columns
- database aggregate RPCs for order/lead summaries
- supporting DB index for list access pattern

Implementation checklist:

- Replace full-table list fetches with pagination.
- Replace `select("*")` where not needed.
- Add indexes aligned with actual filters and sort order.
- Move dashboard and summary aggregation into SQL/RPCs where useful.

Why this matters:

- Improves response time and memory usage.
- Makes growth safer.

---

## 11. UI Data Minimization

Avoid exposing internal identifiers or unnecessary sensitive values in the UI.

What was improved:

- earnings tables no longer show internal order IDs
- related fetches were narrowed to avoid unnecessary exposure

Implementation checklist:

- Review all admin/staff/partner/customer tables.
- Remove internal IDs from display where not operationally required.
- Avoid fetching sensitive fields that the UI does not need.

Why this matters:

- Reduces accidental data leakage.
- Keeps UX cleaner.

---

## 12. Tests to Add While Porting

Minimum high-value tests:

- request schema tests
- ownership guard tests
- pricing integrity tests
- rate-limit tests
- audit log source injection tests
- route tests for privileged field stripping
- summary mapping tests for SQL/RPC-backed services

Why this matters:

- These fixes are security-sensitive and can regress quietly.

---

## Recommended Porting Order

1. Add shared request parsing and API error handling.
2. Split Supabase public vs server-only privileged access.
3. Add reusable ownership/authorization guards.
4. Harden public routes with separate schemas and server-owned defaults.
5. Remove client trust for financial fields.
6. Add shared rate limiting.
7. Harden uploads.
8. Standardize audit logging with project source injection.
9. Add pagination, narrower selects, and SQL summaries.
10. Reduce unnecessary UI data exposure.
11. Add targeted regression tests for all of the above.

---

## Still Not Fully Solved in `instanet-affiliate`

Do not copy these weaknesses as-is:

- rate limiting is still process-local, not distributed
- no RLS on core shared tables
- authenticated lead create still allows some workflow fields in non-public paths
- partner order update still allows some fee edits after create
- order create flow is still not fully atomic across DB plus external delivery side effects

These are useful follow-up items for `instanet-stores` too.
