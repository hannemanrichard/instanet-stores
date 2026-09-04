"use client";

import { useTranslations } from "next-intl";
import { Shell } from "@/shared/components";
import { RoleGuard } from "@/shared/components/auth/RoleGuard";
import { ProductPageCreateView } from "@/features/products";
import { CATALOG_ROLES } from "@/shared/hooks/use-auth";

export default function NewProductPage() {
  const t = useTranslations("dashboard.productPages");

  return (
    <RoleGuard allowedRoles={CATALOG_ROLES}>
      <Shell>
        <div className="space-y-6">
          <div className="hidden md:block">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("createTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("createDescription")}
            </p>
          </div>
          <ProductPageCreateView />
        </div>
      </Shell>
    </RoleGuard>
  );
}
