"use client";

import { useAuth, type DashboardRole } from "@/shared/hooks/use-auth";
import { redirect } from "next/navigation";

type GuardRole = Exclude<DashboardRole, null>;

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: GuardRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, isLoaded, role } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!user) {
    redirect("/sign-in");
  }

  if (!role || !allowedRoles.includes(role)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
