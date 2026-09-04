export type OrderStatus =
  | "initial"
  | "processing"
  | "delivered"
  | "cancelled"
  | "returned"
  | "archived"
  | string;

export interface OrderFilters {
  status?: OrderStatus;
  search?: string;
  agentId?: number;
  storeId?: number;
  storeIds?: number[];
  isSupplierPaid?: boolean;
}

export interface OrderPaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedOrdersResult {
  data: import("./entities").OrderEntity[];
  total: number;
  page: number;
  limit: number;
}

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "initial",
  "processing",
  "delivered",
  "returned",
];
