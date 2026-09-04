"use client";

import { useTranslations } from "next-intl";
import { Shell } from "@/shared/components";
import { RoleGuard } from "@/shared/components/auth/RoleGuard";
import { StoreProductsAdminView } from "@/features/products/presentation/StoreProductsAdminView";
import { CATALOG_ROLES } from "@/shared/hooks/use-auth";

export default function ProductsPage() {
  const t = useTranslations("dashboard.products");

  return (
    <RoleGuard allowedRoles={CATALOG_ROLES}>
      <Shell>
        <div className="space-y-6">
          <div className="hidden items-center justify-between md:flex">
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          </div>
          <StoreProductsAdminView />
        </div>
      </Shell>
    </RoleGuard>
  );
}
