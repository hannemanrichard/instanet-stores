export type DashboardRoleName = "admin" | "store" | "stores_manager";

export type StoreScopedActor = {
  role: DashboardRoleName;
  storeIds: number[] | null;
};

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Admin + omitted id → undefined (all stores).
 * Store / manager + omitted id → assigned ids (possibly empty).
 * Requested id must be allowed or throws ForbiddenError.
 */
export const resolveScopeStoreIds = (
  actor: StoreScopedActor,
  requestedStoreId?: number | null
): number[] | undefined => {
  const requested =
    requestedStoreId != null && !Number.isNaN(requestedStoreId)
      ? requestedStoreId
      : null;

  if (actor.role === "admin") {
    return requested == null ? undefined : [requested];
  }

  const assigned = actor.storeIds ?? [];
  if (actor.role === "store") {
    return assigned;
  }

  if (requested == null) return assigned;
  if (!assigned.includes(requested)) {
    throw new ForbiddenError("Store is not assigned to this user");
  }
  return [requested];
};

export const assertStoreAccess = (
  actor: StoreScopedActor,
  storeId: number | null | undefined
) => {
  if (storeId == null || Number.isNaN(storeId)) {
    throw new ForbiddenError("Store id is required");
  }
  if (actor.role === "admin") return;
  if (!actor.storeIds?.includes(storeId)) {
    throw new ForbiddenError("Store is not assigned to this user");
  }
};

export const canMutateStoreOps = (role: DashboardRoleName) =>
  role === "admin" || role === "stores_manager";
