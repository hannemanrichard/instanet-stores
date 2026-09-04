import {
  useStandardMutation,
  useStandardQuery,
} from "@/shared/hooks/useReactQuery";
import { apiFetch } from "@/shared/utils/apiFetch";
import type {
  CreateOrderItemInput,
  CreateOrderInput,
  OrderEntity,
  OrderFilters,
  OrderItemEntity,
  OrderSummary,
  OrderWithItems,
  PaginatedOrdersResult,
  UpdateOrderItemInput,
} from "../domain";
import type { UpdateOrderPayload } from "./services/orderApplicationService";
import {
  getDummyOrderSummary,
  getDummyPaginatedOrders,
  isDummyDataEnabled,
} from "@/shared/lib/dummy-data";

const ordersKey = ["orders"];
const orderDetailKey = (orderId: number) => [...ordersKey, orderId.toString()];
const orderItemsKey = (orderId: number) => [
  ...ordersKey,
  orderId.toString(),
  "items",
];
const orderSummaryKey = [...ordersKey, "summary"];

/** Client payload — store_id / supplier snapshot resolved on the server from productId */
export type ClientCreateOrderPayload = {
  order: Omit<CreateOrderInput, "store_id" | "is_supplier_paid" | "partner_id">;
  items?: CreateOrderItemInput[];
  productId?: number;
};

export const usePaginatedOrders = (
  filters: OrderFilters,
  page = 1,
  limit = 10,
  enabled = true
) => {
  const trimmedSearch = filters.search?.trim() ?? "";

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters.status) params.set("status", String(filters.status));
  if (trimmedSearch) params.set("search", trimmedSearch);
  if (filters.storeId != null) params.set("storeId", String(filters.storeId));

  return useStandardQuery(
    [
      ...ordersKey,
      "paginated",
      filters.status ?? "all",
      trimmedSearch || "nosearch",
      `store:${filters.storeId ?? "all"}`,
      `page:${page}`,
      `limit:${limit}`,
    ],
    async () => {
      if (isDummyDataEnabled()) {
        return getDummyPaginatedOrders(
          { ...filters, search: trimmedSearch || undefined },
          page,
          limit
        );
      }
      return apiFetch<PaginatedOrdersResult>(`/api/orders?${params.toString()}`);
    },
    {
      enabled,
      staleTime: 60 * 1000,
    }
  );
};

export const useOrder = (orderId: number) => {
  return useStandardQuery(
    orderDetailKey(orderId),
    () => apiFetch<OrderWithItems>(`/api/orders/${orderId}`),
    {
      enabled: orderId > 0,
      staleTime: 60 * 1000,
    }
  );
};

export const useOrderItems = (orderId: number) => {
  return useStandardQuery(
    orderItemsKey(orderId),
    () =>
      apiFetch<{ items: OrderItemEntity[] }>(
        `/api/orders/${orderId}/items`
      ).then((d) => d.items),
    {
      enabled: orderId > 0,
      staleTime: 60 * 1000,
    }
  );
};

export const useOrderSummary = (
  enabled = true,
  storeId?: number | null
) => {
  const params =
    storeId != null ? `?storeId=${encodeURIComponent(String(storeId))}` : "";
  return useStandardQuery(
    [...orderSummaryKey, String(storeId ?? "all")],
    async () => {
      if (isDummyDataEnabled()) return getDummyOrderSummary();
      return apiFetch<OrderSummary>(`/api/orders/summary${params}`);
    },
    {
      enabled,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useCreateOrder = () => {
  return useStandardMutation(
    (payload: ClientCreateOrderPayload) =>
      apiFetch<OrderWithItems>("/api/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    {
      invalidateQueries: [ordersKey, orderSummaryKey, ["payments"]],
      successMessage: "Order created successfully",
      errorMessage: "Failed to create order",
    }
  );
};

export const useUpdateOrder = () => {
  return useStandardMutation(
    ({
      orderId,
      payload,
    }: {
      orderId: number;
      payload: UpdateOrderPayload;
    }) =>
      apiFetch<OrderWithItems>(`/api/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    {
      invalidateQueries: [ordersKey, orderSummaryKey],
      successMessage: "Order updated successfully",
      errorMessage: "Failed to update order",
    }
  );
};

export const useUpdateOrderStatus = () => {
  return useStandardMutation(
    ({ orderId, status }: { orderId: number; status: string }) =>
      apiFetch<{ order: OrderEntity }>(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }).then((d) => d.order),
    {
      invalidateQueries: [ordersKey, orderSummaryKey],
      successMessage: "Order status updated",
      errorMessage: "Failed to update order status",
    }
  );
};

export const useReplaceOrderItems = () => {
  return useStandardMutation(
    ({
      orderId,
      items,
    }: {
      orderId: number;
      items: UpdateOrderItemInput[];
    }) =>
      apiFetch<{ items: OrderItemEntity[] }>(`/api/orders/${orderId}/items`, {
        method: "PUT",
        body: JSON.stringify({ items }),
      }).then((d) => d.items),
    {
      invalidateQueries: [ordersKey],
      successMessage: "Order items updated",
      errorMessage: "Failed to update order items",
    }
  );
};

export const useDeleteOrder = () => {
  return useStandardMutation(
    (orderId: number) =>
      apiFetch<{ success: boolean }>(`/api/orders/${orderId}`, {
        method: "DELETE",
      }),
    {
      invalidateQueries: [ordersKey, orderSummaryKey],
      successMessage: "Order deleted",
      errorMessage: "Failed to delete order",
    }
  );
};
