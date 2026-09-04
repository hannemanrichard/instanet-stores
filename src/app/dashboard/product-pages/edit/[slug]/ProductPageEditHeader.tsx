"use client";

import { useTranslations } from "next-intl";

export const ProductPageEditHeader = () => {
  const t = useTranslations("dashboard.productPages");

  return (
    <header className="hidden space-y-2 md:block">
      <h1 className="text-2xl font-semibold tracking-tight">{t("editTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("editDescription")}</p>
    </header>
  );
};
