# Instanet Stores Codebase Review

## Overall Score

`7.1/10`

The repository is structurally stronger than an average Next.js app. It has real feature-based organization, service/domain layering, a meaningful test base, and a decent shared UI foundation. The main areas dragging the score down are security rigor, accessibility consistency, and uneven operational discipline around API boundaries and developer workflow.

## Scores By Area

- `Architecture`: `8/10`
- `Backend / API Design`: `7/10`
- `Database / Schema Design`: `7.5/10`
- `Security`: `5.5/10`
- `Testing`: `7/10`
- `Maintainability`: `7/10`
- `Developer Experience`: `6/10`
- `Frontend UX Structure`: `8/10`
- `React / Next Patterns`: `7/10`
- `Component Organization`: `8.5/10`
- `Accessibility`: `5.5/10`
- `State / Data Fetching`: `7.5/10`
- `UI Consistency`: `8/10`

## Strongest Areas

### Component Organization — `8.5/10`

This is one of the best parts of the codebase. The feature-first layout is thoughtful, and the `application` / `domain` / `presentation` split is used in a way that makes the repo easier to navigate than a typical ad hoc app.

Representative paths:
- `src/features/orders/index.ts`
- `src/shared/components/index.ts`
- `src/features/products/presentation/ProductEditor.tsx`
- `src/features/products/presentation/ProductPageView.tsx`

### Architecture — `8/10`

The repo has strong architectural intent. Shared server helpers, service layers, and scoped access control are good decisions, and the backend is not just route logic glued directly to the database.

Representative paths:
- `src/features/orders/application/services/orderApplicationService.ts`
- `src/shared/server/requireDashboardActor.ts`
- `src/shared/core/baseService.ts`

### Frontend UX Structure — `8/10`

The dashboard/storefront split is coherent, and the app has a visible product structure instead of just a collection of screens. Shared layouts and shells are a real strength.

Representative paths:
- `src/app/dashboard/layout.tsx`
- `src/shared/components/layout/StorefrontLayout.tsx`
- `src/features/landing/presentation/StoreLandingPage.tsx`
- `src/features/orders/presentation/OrdersManagementView.tsx`

### UI Consistency — `8/10`

The shared component layer and dashboard visual language are fairly consistent. The design system is not fully enforced everywhere, but there is enough reuse to give the app a coherent feel.

Representative paths:
- `src/shared/components/ui/button.tsx`
- `src/shared/components/ui/data-table/data-table.tsx`
- `src/features/dashboard/presentation/DashboardHomeView.tsx`
- `src/features/payments/presentation/PaymentsManagementView.tsx`

## Middle-Tier Areas

### Database / Schema Design — `7.5/10`

The schema reflects real business workflows like store ownership, return batches, payment batches, and snapshot-style financial fields. That is a good sign. The main weakness is that the migration history is getting noisy, and some schema expectations drift from what is actually applied.

Representative paths:
- `database/migrations/043_create_stores_schema.sql`
- `database/migrations/041_create_partner_commissions_table.sql`
- `database/migrations/045_create_store_assignments.sql`
- `database/migrations/028_create_audit_logs_table.sql`

### State / Data Fetching — `7.5/10`

React Query usage is fairly disciplined, and there are shared abstractions instead of random ad hoc fetches everywhere. The weakness is that some screens accumulate too much local orchestration and state.

Representative paths:
- `src/shared/hooks/useReactQuery.ts`
- `src/shared/utils/apiFetch.ts`
- `src/features/orders/application/useOrders.ts`
- `src/features/inventory/application/useInventory.ts`

### Backend / API Design — `7/10`

The app has good ingredients: shared guards, shared error handling, and some route/schema discipline. But the route layer is not consistently standardized yet, so some endpoints are safer and cleaner than others.

Representative paths:
- `src/app/api/orders/route.ts`
- `src/app/api/payments/route.ts`
- `src/app/api/products/route.ts`
- `src/shared/server/parseRequest.ts`
- `src/shared/server/jsonError.ts`

### Testing — `7/10`

The repo has a meaningful amount of unit testing, including business logic and helpers. The main gap is boundary testing: route handlers, auth/DB integration, and end-to-end verification are still weaker than the pure logic layer.

Representative paths:
- `src/features/orders/__tests__/application/orderApplicationService.test.ts`
- `src/shared/server/storeAccess.test.ts`
- `src/shared/server/parseRequest.test.ts`
- `jest.config.js`

### Maintainability — `7/10`

The foundation is good, but it depends on active convention enforcement. There are signs of duplication and drift, especially across validation styles, documentation, and migration/application assumptions.

Representative paths:
- `src/shared/server/storeAccess.ts`
- `src/shared/server/jsonError.ts`
- `docs/NEXTJS_ARCHITECTURE_REFACTORING_GUIDE.md`
- `docs/REFACTORING_PLAN.md`

### React / Next Patterns — `7/10`

The App Router setup is decent, and page wrappers are often thin. The main weakness is that the app still leans heavily on client-driven flows where stronger server-first Next.js patterns could reduce complexity.

Representative paths:
- `src/app/layout.tsx`
- `src/app/products/[slug]/page.tsx`
- `src/app/dashboard/orders/page.tsx`
- `src/shared/components/auth/RoleGuard.tsx`

## Weakest Areas

### Security — `5.5/10`

This is the clearest risk area. Route-level auth and store scoping exist, which is good, but the database trust boundary and some permissive data access patterns reduce confidence. In-memory rate limiting also does not scale well for distributed deployment.

Representative paths:
- `src/infrastructure/supabase/server.ts`
- `src/shared/server/rateLimit.ts`
- `src/middleware.ts`
- `database/migrations/028_create_audit_logs_table.sql`

### Accessibility — `5.5/10`

Accessibility is not absent, but it is inconsistent. Some screens clearly try, while others still use patterns like clickable non-semantic containers or interactive media that are not reliably keyboard-friendly.

Representative paths:
- `src/shared/components/layout/MobileTabBar.tsx`
- `src/shared/components/layout/StoreSidebar.tsx`
- `src/features/products/presentation/NewProductGallery.tsx`
- `src/features/products/presentation/TestimonialsCarousel.tsx`
- `src/features/orders/presentation/OrderProductCell.tsx`

### Developer Experience — `6/10`

The repo has internal docs and a clear structure, but the onboarding story is weaker than it should be for a codebase of this size. The `README.md` is not project-specific enough, and standards feel more documented than enforced.

Representative paths:
- `README.md`
- `package.json`
- `tsconfig.json`
- `docs/TESTING_CHECKLIST.md`

## Best Summary

The biggest strength of this codebase is its architectural shape. It is clearly trying to be a serious product codebase, not just a quick prototype. The biggest weakness is that the trust boundary, accessibility discipline, and operational consistency have not caught up fully to that architecture yet.

## Highest-Impact Next Improvements

1. Harden the security model, especially around the database boundary and public route abuse prevention.
2. Standardize API validation across all route handlers.
3. Add more route-level and integration-style tests.
4. Improve accessibility systematically, especially for interactive media and keyboard flows.
5. Strengthen developer onboarding and enforcement with a better project README and stronger repo guardrails.
