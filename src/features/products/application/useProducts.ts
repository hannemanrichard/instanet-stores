import {
  useStandardMutation,
  useStandardQuery,
} from "@/shared/hooks/useReactQuery";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/shared/utils/apiFetch";
import type {
  CreateProductPagePayload,
  CreateProductPayload,
  UpdateProductPagePayload,
  UpdateProductPayload,
} from "./services/productApplicationService";
import type {
  ProductCatalogEntry,
  ProductEntity,
  ProductInventoryAdjustment,
  ProductInventorySnapshot,
  ProductItemEntity,
  ProductPageEntity,
  ProductPageWithRelations,
} from "../domain";
import { dummyProducts, isDummyDataEnabled } from "@/shared/lib/dummy-data";
import { useAuth } from "@/shared/hooks/use-auth";

const catalogKey = ["products", "catalog"];
const adminProductsKey = ["products", "admin"];
const productItemsKey = (productId: number) => [
  "products",
  productId.toString(),
  "items",
];
const productInventoryKey = (productId: number) => [
  "products",
  productId.toString(),
  "inventory",
];
const productPageKey = (slug: string) => ["product-pages", slug];
const productPagesSearchKey = (term: string) => [
  "product-pages",
  "search",
  term,
];
const productPagesRootKey = ["product-pages"];

export const useProductCatalog = (searchTerm?: string) => {
  const trimmed = searchTerm?.trim() ?? "";
  const enabled = !searchTerm || trimmed.length === 0 || trimmed.length > 1;
  const qs = trimmed ? `?q=${encodeURIComponent(trimmed)}` : "";

  return useStandardQuery(
    searchTerm ? [...catalogKey, "search", trimmed] : catalogKey,
    () =>
      apiFetch<{ catalog: ProductCatalogEntry[] }>(
        `/api/products/catalog${qs}`
      ).then((d) => d.catalog),
    {
      enabled,
      staleTime: 2 * 60 * 1000,
    }
  );
};

export const useProductPage = (slug: string) => {
  return useStandardQuery(
    productPageKey(slug),
    () =>
      apiFetch<{ page: ProductPageWithRelations | null }>(
        `/api/product-pages/by-slug/${encodeURIComponent(slug)}`
      ).then((d) => d.page),
    {
      enabled: Boolean(slug),
      staleTime: 60 * 1000,
    }
  );
};

export const useProduct = (productId: number) => {
  return useStandardQuery(
    ["products", productId.toString()],
    () =>
      apiFetch<{ product: ProductEntity | null }>(
        `/api/products/${productId}`
      ).then((d) => d.product),
    {
      enabled: productId > 0,
      staleTime: 60 * 1000,
    }
  );
};

export const useActiveProductPages = () => {
  return useStandardQuery(
    [...productPagesRootKey, "active"],
    () =>
      apiFetch<{ pages: ProductPageEntity[] }>("/api/product-pages?active=1").then(
        (d) => d.pages
      ),
    {
      staleTime: 2 * 60 * 1000,
    }
  );
};

export const useProductPageSearch = (term: string) => {
  const trimmed = term.trim();
  const params = new URLSearchParams();
  params.set("scope", "ops");
  if (trimmed) params.set("q", trimmed);
  return useStandardQuery(
    productPagesSearchKey(trimmed),
    () =>
      apiFetch<{ pages: ProductPageEntity[] }>(
        `/api/product-pages?${params.toString()}`
      ).then((d) => d.pages),
    {
      enabled: trimmed.length === 0 || trimmed.length > 1,
      staleTime: 2 * 60 * 1000,
    }
  );
};

export const useAdminProducts = () => {
  const { canPickStore } = useAuth();
  const useDummy = isDummyDataEnabled() && !canPickStore;
  return useStandardQuery(
    adminProductsKey,
    async () => {
      if (useDummy) return dummyProducts;
      return apiFetch<{ products: ProductEntity[] }>("/api/products").then(
        (d) => d.products
      );
    },
    {
      staleTime: 60 * 1000,
    }
  );
};

export const useStoreProducts = (storeId: number | null, enabled = true) => {
  const { canPickStore } = useAuth();
  const useDummy = isDummyDataEnabled() && !canPickStore;
  const qs =
    storeId != null ? `?storeId=${encodeURIComponent(String(storeId))}` : "";
  return useStandardQuery(
    [...adminProductsKey, "store", String(storeId ?? "session")],
    async () => {
      if (useDummy) return dummyProducts;
      return apiFetch<{ products: ProductEntity[] }>(`/api/products${qs}`).then(
        (d) => d.products
      );
    },
    {
      enabled: useDummy || enabled,
      staleTime: 60 * 1000,
    }
  );
};

export const useProductItems = (productId: number) => {
  return useStandardQuery(
    productItemsKey(productId),
    () =>
      apiFetch<{ items: ProductItemEntity[] }>(
        `/api/products/${productId}/items`
      ).then((d) => d.items),
    {
      enabled: productId > 0,
      staleTime: 60 * 1000,
    }
  );
};

export const useProductInventory = (productId: number) => {
  return useStandardQuery(
    productInventoryKey(productId),
    () =>
      apiFetch<{ snapshot: ProductInventorySnapshot }>(
        `/api/products/${productId}/inventory`
      ).then((d) => d.snapshot),
    {
      enabled: productId > 0,
      staleTime: 30 * 1000,
    }
  );
};

export const useCreateProductPage = () => {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (payload: CreateProductPagePayload) =>
      apiFetch<{ page: ProductPageWithRelations }>("/api/product-pages", {
        method: "POST",
        body: JSON.stringify(payload),
      }).then((d) => d.page),
    {
      successMessage: "Product page created successfully",
      errorMessage: "Failed to create product page",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: productPagesRootKey });
      },
    }
  );
};

export const useUpdateProductPage = () => {
  const queryClient = useQueryClient();

  return useStandardMutation(
    ({
      pageId,
      payload,
    }: {
      pageId: number;
      payload: Partial<ProductPageEntity>;
    }) =>
      apiFetch<{ page: ProductPageEntity }>(`/api/product-pages/${pageId}`, {
        method: "PATCH",
        body: JSON.stringify({ mode: "simple", payload }),
      }).then((d) => d.page),
    {
      successMessage: "Product page updated successfully",
      errorMessage: "Failed to update product page",
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: productPagesRootKey });
        queryClient.invalidateQueries({ queryKey: productPageKey(data.slug) });
      },
    }
  );
};

export const useUpdateProductPageWithRelations = () => {
  const queryClient = useQueryClient();

  return useStandardMutation(
    ({
      pageId,
      payload,
    }: {
      pageId: number;
      payload: UpdateProductPagePayload;
    }) =>
      apiFetch<{ page: ProductPageWithRelations }>(
        `/api/product-pages/${pageId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ mode: "relations", payload }),
        }
      ).then((d) => d.page),
    {
      successMessage: "Product page updated successfully",
      errorMessage: "Failed to update product page",
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: productPagesRootKey });
        queryClient.invalidateQueries({
          queryKey: productPageKey(data.page.slug),
        });
      },
    }
  );
};

export const useDeleteProductPage = () => {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (pageId: number) =>
      apiFetch<{ success: boolean }>(`/api/product-pages/${pageId}`, {
        method: "DELETE",
      }),
    {
      successMessage: "Product page deleted successfully",
      errorMessage: "Failed to delete product page",
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: productPagesRootKey });
      },
    }
  );
};

export const useCreateProduct = () => {
  return useStandardMutation(
    (payload: CreateProductPayload) =>
      apiFetch<{ product: ProductEntity }>("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
      }).then((d) => d.product),
    {
      invalidateQueries: [catalogKey, adminProductsKey],
      successMessage: "Product created successfully",
      errorMessage: "Failed to create product",
    }
  );
};

export const useUpdateProduct = () => {
  return useStandardMutation(
    ({
      productId,
      payload,
    }: {
      productId: number;
      payload: UpdateProductPayload;
    }) =>
      apiFetch<{ success: boolean }>(`/api/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    {
      invalidateQueries: [catalogKey, adminProductsKey],
      successMessage: "Product updated successfully",
      errorMessage: "Failed to update product",
    }
  );
};

export const useBulkInventoryUpdate = () => {
  return useStandardMutation(
    ({
      productId,
      adjustments,
    }: {
      productId: number;
      adjustments: ProductInventoryAdjustment[];
    }) =>
      apiFetch<{ snapshot: ProductInventorySnapshot }>(
        `/api/products/${productId}/inventory/bulk`,
        {
          method: "POST",
          body: JSON.stringify({ adjustments }),
        }
      ).then((d) => d.snapshot),
    {
      invalidateQueries: [catalogKey],
      successMessage: "Inventory updated successfully",
      errorMessage: "Failed to update inventory",
    }
  );
};
