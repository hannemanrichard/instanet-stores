import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import {
  useAdminProducts,
  useBulkInventoryUpdate,
  useProduct,
  useProductCatalog,
  useProductItems,
  useProductPage,
  useProductPageSearch,
  useUpdateProduct,
  useUpdateProductPage,
} from "../../application/useProducts";
import { apiFetch } from "@/shared/utils/apiFetch";

jest.mock("@/shared/utils/apiFetch");
jest.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));
jest.mock("@/shared/hooks/use-auth", () => ({
  useAuth: () => ({ canPickStore: true }),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("Product hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches catalog", async () => {
    const catalog = [{ id: 1, name: "Product" }];
    mockApiFetch.mockResolvedValue({ catalog });

    const { result } = renderHook(() => useProductCatalog(""), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(catalog);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/products/catalog");
  });

  it("searches product pages", async () => {
    const pages = [{ id: 1, slug: "pro" }];
    mockApiFetch.mockResolvedValue({ pages });

    const { result } = renderHook(() => useProductPageSearch("pro"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith("/api/product-pages?scope=ops&q=pro");
  });

  it("fetches product page by slug", async () => {
    const page = { page: { id: 1, slug: "product" }, items: [] };
    mockApiFetch.mockResolvedValue({ page });

    const { result } = renderHook(() => useProductPage("product"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/product-pages/by-slug/product"
    );
  });

  it("fetches admin products", async () => {
    mockApiFetch.mockResolvedValue({ products: [{ id: 1 }] });

    const { result } = renderHook(() => useAdminProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith("/api/products");
  });

  it("fetches product items", async () => {
    mockApiFetch.mockResolvedValue({ items: [{ id: 1 }] });

    const { result } = renderHook(() => useProductItems(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith("/api/products/1/items");
  });

  it("fetches product by id", async () => {
    mockApiFetch.mockResolvedValue({ product: { id: 1 } });

    const { result } = renderHook(() => useProduct(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith("/api/products/1");
  });

  it("updates product via mutation", async () => {
    mockApiFetch.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useUpdateProduct(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      productId: 1,
      payload: { product: { name: "Updated" } },
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/products/1", {
      method: "PATCH",
      body: JSON.stringify({ product: { name: "Updated" } }),
    });
  });

  it("updates product page via mutation", async () => {
    mockApiFetch.mockResolvedValue({
      page: { id: 2, slug: "updated-slug" },
    });

    const { result } = renderHook(() => useUpdateProductPage(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      pageId: 2,
      payload: { headline: "New" },
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/product-pages/2", {
      method: "PATCH",
      body: JSON.stringify({
        mode: "simple",
        payload: { headline: "New" },
      }),
    });
  });

  it("bulk updates inventory via mutation", async () => {
    mockApiFetch.mockResolvedValue({
      snapshot: { product_id: 1, in_stock: 10 },
    });

    const { result } = renderHook(() => useBulkInventoryUpdate(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      productId: 1,
      adjustments: [{ itemId: 2, quantity: 5 }],
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/products/1/inventory/bulk",
      {
        method: "POST",
        body: JSON.stringify({
          adjustments: [{ itemId: 2, quantity: 5 }],
        }),
      }
    );
  });
});
