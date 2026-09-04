"use client";

import { useTranslations } from "next-intl";
import { Shell } from "@/shared/components";
import { ReturnsManagementView } from "@/features/returns";

export default function ReturnsPage() {
  const t = useTranslations("dashboard.returns");

  return (
    <Shell>
      <div className="space-y-6">
        <div className="hidden items-center justify-between md:flex">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        </div>
        <ReturnsManagementView />
      </div>
    </Shell>
  );
}
