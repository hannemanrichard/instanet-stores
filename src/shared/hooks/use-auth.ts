"use client";

import { useUser } from "@clerk/nextjs";

export type DashboardRole = "admin" | "store" | "stores_manager" | null;

/** Products and product pages: admin plus stores managers (assigned stores only). */
export const CATALOG_ROLES: Exclude<DashboardRole, null>[] = [
  "admin",
  "stores_manager",
];

const ROLE_LABELS: Record<Exclude<DashboardRole, null>, string> = {
  admin: "Admin",
  store: "Store",
  stores_manager: "Stores manager",
};

/**
 * Normalizes Clerk metadata to dashboard roles.
 * Admin is assigned in Clerk. stores_manager is assigned by an admin in-app.
 * Legacy affiliate `partner` maps to store.
 */
export const resolveDashboardRole = (
  rawRole: unknown,
  isSignedIn: boolean
): DashboardRole => {
  if (!isSignedIn) return null;
  if (rawRole === "admin") return "admin";
  if (rawRole === "stores_manager") return "stores_manager";
  return "store";
};

export function useAuth() {
  const { user, isLoaded } = useUser();
  const isSignedIn = Boolean(user);

  const role = resolveDashboardRole(user?.publicMetadata?.role, isSignedIn);
  const isAdmin = role === "admin";
  const isStore = role === "store";
  const isStoresManager = role === "stores_manager";
  const roleLabel = role ? ROLE_LABELS[role] : null;

  return {
    isAdmin,
    isLoaded,
    user,
    isStore,
    isStoresManager,
    canPickStore: isAdmin || isStoresManager,
    canManageCatalog: isAdmin || isStoresManager,
    canMutateInventory: isAdmin || isStoresManager,
    canMutatePayments: isAdmin || isStoresManager,
    canChangeOrderStatus: isAdmin || isStoresManager,
    isPlatformAdmin: isAdmin,
    role,
    roleLabel,
  };
}
