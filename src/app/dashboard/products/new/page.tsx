"use client";

import { useTranslations } from "next-intl";
import { Shell } from "@/shared/components";
import { RoleGuard } from "@/shared/components/auth/RoleGuard";
import { ProductEditor } from "@/features/products/presentation/ProductEditor";
import { CATALOG_ROLES } from "@/shared/hooks/use-auth";

export default function NewProductPage() {
  const t = useTranslations("dashboard.products");

  return (
    <RoleGuard allowedRoles={CATALOG_ROLES}>
      <Shell>
        <div className="space-y-6">
          <div className="hidden md:block">
            <h1 className="text-3xl font-bold tracking-tight">{t("createTitle")}</h1>
          </div>
          <ProductEditor />
        </div>
      </Shell>
    </RoleGuard>
  );
}
