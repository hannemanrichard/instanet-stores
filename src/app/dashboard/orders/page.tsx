"use client";

import { useTranslations } from "next-intl";
import { Shell } from "@/shared/components";
import { OrdersManagementView } from "@/features/orders";

export default function OrdersPage() {
  const t = useTranslations("dashboard.orders");

  return (
    <Shell>
      <div className="space-y-6">
        <div className="hidden items-center justify-between md:flex">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        </div>
        <OrdersManagementView />
      </div>
    </Shell>
  );
}
