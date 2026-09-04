"use client";

import { useTranslations } from "next-intl";
import { Shell } from "@/shared/components";
import { RoleGuard } from "@/shared/components/auth/RoleGuard";
import { ManagersManagementView } from "@/features/stores";

export default function ManagersPage() {
  const t = useTranslations("dashboard.managers");

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <Shell>
        <div className="space-y-6">
          <div className="hidden items-center justify-between md:flex">
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          </div>
          <ManagersManagementView />
        </div>
      </Shell>
    </RoleGuard>
  );
}
