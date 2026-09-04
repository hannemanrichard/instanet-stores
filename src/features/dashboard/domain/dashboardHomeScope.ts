import type { DashboardRole } from "@/shared/hooks/use-auth";

export type DashboardHomeScope = "platform" | "assigned" | "store";

export const resolveDashboardHomeScope = (
  role: DashboardRole
): DashboardHomeScope => {
  if (role === "admin") return "platform";
  if (role === "stores_manager") return "assigned";
  return "store";
};
