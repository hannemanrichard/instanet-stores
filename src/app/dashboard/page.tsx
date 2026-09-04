"use client";

import { useTranslations } from "next-intl";
import { Shell } from "@/shared/components";
import { DashboardHomeView } from "@/features/dashboard/presentation/DashboardHomeView";

const DashboardPage = () => {
  const t = useTranslations("dashboard.home");

  return (
    <Shell>
      <div className="space-y-6">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        </div>
        <DashboardHomeView />
      </div>
    </Shell>
  );
};

export default DashboardPage;
