"use client";

import { useTranslations } from "next-intl";
import { Shell } from "@/shared/components";
import { PaymentsManagementView } from "@/features/payments";

export default function PaymentsPage() {
  const t = useTranslations("dashboard.payments");

  return (
    <Shell>
      <div className="space-y-6">
        <div className="hidden items-center justify-between md:flex">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        </div>
        <PaymentsManagementView />
      </div>
    </Shell>
  );
}
