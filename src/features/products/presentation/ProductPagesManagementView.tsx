'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { ProductPageList } from "./ProductPageList";

export const ProductPagesManagementView = () => {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const t = useTranslations("dashboard.productPages");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => router.push("/dashboard/product-pages/new")}>
          {t("newPage")}
        </Button>
      </div>
      <ProductPageList
        searchTerm={search}
        onSearchChange={setSearch}
        onPreview={(page) => window.open(`/products/${page.slug}`, "_blank")}
        onEdit={(page) =>
          router.push(`/dashboard/product-pages/edit/${page.slug}`)
        }
      />
    </div>
  );
};
