import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import {
  useDeleteOrder,
  useOrder,
  useOrderItems,
  useReplaceOrderItems,
  useUpdateOrder,
  useUpdateOrderStatus,
} from "../../application/useOrders";
import { apiFetch } from "@/shared/utils/apiFetch";

jest.mock("@/shared/utils/apiFetch");
jest.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
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

describe("Orders hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches order detail", async () => {
    const orderDetail = { order: { id: 1 }, items: [] };
    mockApiFetch.mockResolvedValue(orderDetail);

    const { result } = renderHook(() => useOrder(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(orderDetail);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/orders/1");
  });

  it("fetches order items", async () => {
    const items = [{ id: 1, order_id: 1, qty: 2 }];
    mockApiFetch.mockResolvedValue({ items });

    const { result } = renderHook(() => useOrderItems(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(items);
  });

  it("updates order via mutation", async () => {
    mockApiFetch.mockResolvedValue({
      order: { id: 1, status: "processed" },
      items: [],
    });

    const { result } = renderHook(() => useUpdateOrder(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      orderId: 1,
      payload: { order: { status: "processed" } },
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/orders/1", {
      method: "PATCH",
      body: JSON.stringify({ order: { status: "processed" } }),
    });
  });

  it("updates order status via mutation", async () => {
    mockApiFetch.mockResolvedValue({ order: { id: 1, status: "processed" } });

    const { result } = renderHook(() => useUpdateOrderStatus(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({ orderId: 1, status: "processed" });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/orders/1/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "processed" }),
    });
  });

  it("replaces order items via mutation", async () => {
    mockApiFetch.mockResolvedValue({
      items: [{ id: 1, order_id: 1, qty: 5 }],
    });

    const { result } = renderHook(() => useReplaceOrderItems(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      orderId: 1,
      items: [{ id: 1, qty: 5 }],
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/api/orders/1/items", {
      method: "PUT",
      body: JSON.stringify({ items: [{ id: 1, qty: 5 }] }),
    });
  });

  it("deletes order via mutation", async () => {
    mockApiFetch.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteOrder(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(1);

    expect(mockApiFetch).toHaveBeenCalledWith("/api/orders/1", {
      method: "DELETE",
    });
  });
});
