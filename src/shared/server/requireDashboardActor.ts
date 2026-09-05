import type { User } from "@clerk/nextjs/server";
import { storeAssignmentApplicationService } from "@/features/stores/application/services/storeManagerApplicationService";
import type { StoreEntity } from "@/features/stores/domain";
import {
  requireAuthenticatedUser,
  requireCurrentStoreForUser,
  UnauthorizedError,
} from "./requireCurrentStore";
import type { DashboardRoleName } from "./storeAccess";
import { resolveUserEmail } from "@/shared/utils/userEmail";

export type DashboardActor =
  | { role: "admin"; user: User; store: null; storeIds: null }
  | { role: "store"; user: User; store: StoreEntity; storeIds: number[] }
  | {
      role: "stores_manager";
      user: User;
      store: null;
      storeIds: number[];
    };

const resolveRole = (user: User): string | undefined => {
  const role = user.publicMetadata?.role;
  return typeof role === "string" ? role : undefined;
};

/**
 * Resolves Clerk session to admin, stores manager, or store actor.
 * Managers never resolve via requireCurrentStore.
 */
export const requireDashboardActor = async (): Promise<DashboardActor> => {
  const user = await requireAuthenticatedUser();

  const role = resolveRole(user);

  if (role === "admin") {
    return { role: "admin", user, store: null, storeIds: null };
  }

  if (role === "stores_manager") {
    const storeIds =
      await storeAssignmentApplicationService.listAssignedStoreIds(
        resolveUserEmail(user)
      );
    return { role: "stores_manager", user, store: null, storeIds };
  }

  const store = await requireCurrentStoreForUser(user);
  return { role: "store", user, store, storeIds: [store.id] };
};

export const requireAdminActor = async (): Promise<DashboardActor> => {
  const actor = await requireDashboardActor();
  if (actor.role !== "admin") {
    throw new UnauthorizedError("Admin access required");
  }
  return actor;
};

export const requireStoreOpsActor = async (): Promise<DashboardActor> => {
  const actor = await requireDashboardActor();
  if (actor.role === "store") {
    throw new UnauthorizedError("Admin or stores manager access required");
  }
  return actor;
};

export const actorRole = (actor: DashboardActor): DashboardRoleName =>
  actor.role;
