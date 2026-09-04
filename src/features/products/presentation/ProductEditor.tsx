"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useProduct, useProductItems, useUpdateProduct, useCreateProduct } from "../application";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { UploadArea } from "@/shared/components/ui/upload-area";
import { useStoresList } from "@/features/stores";
import { StoreScopeSelect } from "@/shared/components/stores/StoreScopeSelect";

interface ProductEditorProps {
  productId?: number;
}

const parseOptionalNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.length) {
    return undefined;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
};

export const ProductEditor = ({ productId }: ProductEditorProps) => {
  const t = useTranslations("dashboard.products.editor");
  const tCommon = useTranslations("dashboard.common");
  const router = useRouter();
  const isCreate = productId == null;
  const productQuery = useProduct(productId ?? 0);
  const product = productQuery.data;
  const itemsQuery = useProductItems(productId ?? 0);
  const updateMutation = useUpdateProduct();
  const createMutation = useCreateProduct();
  const storesQuery = useStoresList(true);
  const stores = storesQuery.data ?? [];

  const [name, setName] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [retailPrice2, setRetailPrice2] = useState("");
  const [retailPrice3, setRetailPrice3] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [storeId, setStoreId] = useState("");
  const [supplierPrice, setSupplierPrice] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const baseId = useId();
  const nameInputId = `${baseId}-name`;
  const categoryInputId = `${baseId}-category`;
  const storeIdInputId = `${baseId}-store-id`;
  const supplierPriceInputId = `${baseId}-supplier-price`;
  const retailPriceInputId = `${baseId}-retail-price`;
  const retailPrice2InputId = `${baseId}-retail-price-two`;
  const retailPrice3InputId = `${baseId}-retail-price-three`;
  const wholesalePriceInputId = `${baseId}-wholesale-price`;
  const weightInputId = `${baseId}-weight`;
  const descriptionInputId = `${baseId}-description`;

  useEffect(() => {
    if (isCreate && !storeId && stores[0]?.id) {
      setStoreId(String(stores[0].id));
    }
  }, [isCreate, storeId, stores]);

  useEffect(() => {
    if (!product) {
      return;
    }

    setName(product.name ?? "");
    setRetailPrice(
      product.retail_price != null ? String(product.retail_price) : ""
    );
    setRetailPrice2(
      product.retail_price_2 != null ? String(product.retail_price_2) : ""
    );
    setRetailPrice3(
      product.retail_price_3 != null ? String(product.retail_price_3) : ""
    );
    setWholesalePrice(
      product.wholesale_price != null ? String(product.wholesale_price) : ""
    );
    setWeight(product.weight != null ? String(product.weight) : "");
    setDescription(product.description ?? "");
    setCategory(product.category ?? "");
    setThumbnail(product.thumbnail ?? "");
    setStoreId(product.store_id != null ? String(product.store_id) : "1");
    setSupplierPrice(
      product.supplier_price != null ? String(product.supplier_price) : ""
    );
  }, [product]);

  const isSaving = updateMutation.isPending || createMutation.isPending;
  const isLoading = isCreate
    ? storesQuery.isLoading
    : productQuery.isLoading || itemsQuery.isLoading;

  const variantsPreview = useMemo(() => {
    return (itemsQuery.data ?? []).slice(0, 6);
  }, [itemsQuery.data]);

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="product-editor-skeleton">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full rounded-3xl" />
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!isCreate && !product) {
    return (
      <Card className="rounded-3xl border border-[#f0f0f0] shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <CardContent className="p-10 text-center">
          <p className="text-sm text-muted-foreground">{t("notFound")}</p>
          <Button
            className="mt-6"
            onClick={() => router.push("/dashboard/products")}
          >
            {t("back")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName.length) {
      setValidationError(t("nameRequired"));
      return;
    }

    const primaryPrice = Number(retailPrice.trim());
    if (!Number.isFinite(primaryPrice) || primaryPrice <= 0) {
      setValidationError(t("retailInvalid"));
      return;
    }

    const parsedStoreId = Number(storeId.trim());
    if (!Number.isFinite(parsedStoreId) || parsedStoreId < 1) {
      setValidationError(t("storeInvalid"));
      return;
    }

    const parsedSupplierPrice = parseOptionalNumber(supplierPrice);
    if (parsedSupplierPrice == null || parsedSupplierPrice < 0) {
      setValidationError(t("supplierInvalid"));
      return;
    }

    const payload = {
      product: {
        name: trimmedName,
        retail_price: primaryPrice,
        retail_price_2: parseOptionalNumber(retailPrice2),
        retail_price_3: parseOptionalNumber(retailPrice3),
        wholesale_price: parseOptionalNumber(wholesalePrice),
        weight: parseOptionalNumber(weight),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        thumbnail: thumbnail.trim() || undefined,
        store_id: parsedStoreId,
        supplier_price: parsedSupplierPrice,
      },
    };

    setValidationError(null);

    try {
      if (isCreate) {
        await createMutation.mutateAsync({
          product: {
            name: trimmedName,
            retail_price: primaryPrice,
            retail_price_2: parseOptionalNumber(retailPrice2),
            retail_price_3: parseOptionalNumber(retailPrice3),
            wholesale_price: parseOptionalNumber(wholesalePrice),
            weight: parseOptionalNumber(weight),
            description: description.trim() || undefined,
            category: category.trim() || undefined,
            thumbnail: thumbnail.trim() || undefined,
            store_id: parsedStoreId,
            supplier_price: parsedSupplierPrice,
          },
          items: [{ color: "Default", initialQuantity: 0 }],
        });
      } else if (productId != null) {
        await updateMutation.mutateAsync({
          productId,
          payload,
        });
      }
      router.push("/dashboard/products");
    } catch {
      // Error feedback handled by mutation toast
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-[#f0f0f0] shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <CardHeader className="space-y-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {isCreate ? t("createHeading") : t("heading")}
            </p>
            <h1 className="text-2xl font-semibold text-[#222]">
              {isCreate ? t("createHeading") : product?.name}
            </h1>
            {!isCreate && product ? (
              <p className="text-sm text-muted-foreground">
                {t("productFallback", { id: product.id })}
              </p>
            ) : null}
          </div>
          {variantsPreview.length ? (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {variantsPreview.map((item) => (
                <Badge key={item.id} variant="outline">
                  {item.color ?? t("unspecified")}{" "}
                  {item.size ? `· ${item.size}` : ""}
                </Badge>
              ))}
              {itemsQuery.data &&
              itemsQuery.data.length > variantsPreview.length ? (
                <Badge variant="outline">
                  {t("moreCount", {
                    count:
                      (itemsQuery.data?.length ?? 0) - variantsPreview.length,
                  })}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </CardHeader>
      </Card>

      <Card className="rounded-3xl border border-[#f0f0f0] shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor={nameInputId}
              >
                {t("name")}
              </label>
              <Input
                id={nameInputId}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("namePlaceholder")}
                aria-label={t("name")}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor={categoryInputId}
              >
                {t("category")}
              </label>
              <Input
                id={categoryInputId}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder={t("categoryPlaceholder")}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor={storeIdInputId}
              >
                {t("storeId")}
              </label>
              <StoreScopeSelect
                id={storeIdInputId}
                stores={stores}
                value={storeId ? Number(storeId) : null}
                onChange={(next) => setStoreId(next != null ? String(next) : "")}
                allLabel={tCommon("allStores")}
                placeholder={tCommon("selectStore")}
                allowAll={false}
              />
              <p className="text-xs text-muted-foreground">{t("storeHelp")}</p>
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor={supplierPriceInputId}
              >
                {t("supplierPrice")}
              </label>
              <Input
                id={supplierPriceInputId}
                value={supplierPrice}
                onChange={(event) => setSupplierPrice(event.target.value)}
                inputMode="decimal"
                placeholder={t("supplierHelp")}
                aria-label={t("supplierPrice")}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor={retailPriceInputId}
              >
                {t("retailPrice")}
              </label>
              <Input
                id={retailPriceInputId}
                value={retailPrice}
                onChange={(event) => setRetailPrice(event.target.value)}
                inputMode="decimal"
                placeholder={t("required")}
                aria-label={t("retailPrice")}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor={retailPrice2InputId}
              >
                {t("retailPrice2")}
              </label>
              <Input
                id={retailPrice2InputId}
                value={retailPrice2}
                onChange={(event) => setRetailPrice2(event.target.value)}
                inputMode="decimal"
                placeholder={t("optional")}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor={retailPrice3InputId}
              >
                {t("retailPrice3")}
              </label>
              <Input
                id={retailPrice3InputId}
                value={retailPrice3}
                onChange={(event) => setRetailPrice3(event.target.value)}
                inputMode="decimal"
                placeholder={t("optional")}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor={wholesalePriceInputId}
              >
                {t("wholesalePrice")}
              </label>
              <Input
                id={wholesalePriceInputId}
                value={wholesalePrice}
                onChange={(event) => setWholesalePrice(event.target.value)}
                inputMode="decimal"
                placeholder={t("optional")}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                htmlFor={weightInputId}
              >
                {t("weight")}
              </label>
              <Input
                id={weightInputId}
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                inputMode="decimal"
                placeholder={t("optional")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              htmlFor={descriptionInputId}
            >
              {t("description")}
            </label>
            <Textarea
              id={descriptionInputId}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              placeholder={t("descriptionHelp")}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              htmlFor="thumbnail"
            >
              {t("thumbnail")}
            </label>
            <p className="text-xs text-muted-foreground">{t("thumbnailHelp")}</p>
            <UploadArea
              endpoint="productImage"
              alt={t("thumbnailAlt")}
              value={thumbnail}
              onChange={setThumbnail}
            />
          </div>

          {validationError ? (
            <p className="text-sm text-destructive">{validationError}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button asChild variant="outline" disabled={isSaving}>
              <Link href="/dashboard/products">{t("cancel")}</Link>
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (isCreate ? t("creating") : t("saving")) : isCreate ? t("create") : t("save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
