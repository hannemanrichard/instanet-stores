"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStoreProducts } from "@/features/products";
import { useCurrentStore, useStoresList } from "@/features/stores";
import { StoreScopeSelect } from "@/shared/components/stores/StoreScopeSelect";
import { useAuth } from "@/shared/hooks/use-auth";
import { useRefreshPhaseDetailsView } from "../application/useInventory";
import { InventoryProductAccordion } from "./InventoryProductAccordion";
import { InventorySoldUnitsByDateRangeCard } from "./InventorySoldUnitsByDateRangeCard";

export const InventoryManagementView = () => {
  const t = useTranslations("dashboard.inventory");
  const tCommon = useTranslations("dashboard.common");
  const { canPickStore, canMutateInventory, isPlatformAdmin } = useAuth();
  const { storeId, store, isLoading: storeLoading } = useCurrentStore();
  const [scopeStoreId, setScopeStoreId] = useState<number | null>(null);
  const storesQuery = useStoresList(canPickStore);
  const productsQuery = useStoreProducts(
    canPickStore ? scopeStoreId : storeId,
    canPickStore || !storeLoading,
  );
  const products = productsQuery.data ?? [];
  const refreshPhaseDetailsView = useRefreshPhaseDetailsView();

  const sortedProducts = useMemo(
    () => products.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );

  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const handleRefresh = () => {
    if (!isPlatformAdmin) return;
    refreshPhaseDetailsView.mutate(undefined, {
      onSuccess: () => {
        productsQuery.refetch();
      },
    });
  };

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return (
      sortedProducts.find(
        (product) => product.id.toString() === selectedProductId,
      ) ?? null
    );
  }, [selectedProductId, sortedProducts]);

  const storeName = store?.fullname ?? store?.username ?? t("yourStore");

  if (productsQuery.isLoading || (!canPickStore && storeLoading)) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const emptyMessage = canPickStore
    ? t("emptyAdmin")
    : t("emptyStore", { store: storeName });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden space-y-1 md:block">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {canPickStore
              ? t("subtitleAdmin")
              : t("subtitleStore", { store: storeName })}
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full max-w-sm space-y-2">
            <Label htmlFor="inventory-product">{t("productLabel")}</Label>
            <Select
              value={selectedProductId}
              onValueChange={setSelectedProductId}
            >
              <SelectTrigger
                id="inventory-product"
                aria-label={t("productLabel")}
              >
                <SelectValue placeholder={t("selectProduct")} />
              </SelectTrigger>
              <SelectContent>
                {sortedProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isPlatformAdmin ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshPhaseDetailsView.isPending}
              aria-label={t("refresh")}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("refresh")}
            </Button>
          ) : null}
        </div>
      </div>

      {canPickStore ? (
        <StoreScopeSelect
          stores={storesQuery.data ?? []}
          value={scopeStoreId}
          onChange={(next) => {
            setScopeStoreId(next);
            setSelectedProductId("");
          }}
          allLabel={isPlatformAdmin ? tCommon("allStores") : tCommon("allAssigned")}
          placeholder={tCommon("selectStore")}
        />
      ) : null}

      {canPickStore ? <InventorySoldUnitsByDateRangeCard /> : null}

      {sortedProducts.length === 0 ? (
        <div className="rounded-lg border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : selectedProduct ? (
        <InventoryProductAccordion
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          productThumbnail={selectedProduct.thumbnail}
          readOnly={!canMutateInventory}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("selectToView")}
        </div>
      )}
    </div>
  );
};
