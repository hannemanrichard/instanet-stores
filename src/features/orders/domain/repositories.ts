import type {
  CreateOrderItemInput,
  OrderEntity,
  OrderItemEntity,
  OrderSummary,
  OrderWithItems,
  UpdateOrderItemInput,
} from "./entities";
import type {
  OrderFilters,
  OrderPaginationParams,
  OrderStatus,
  PaginatedOrdersResult,
} from "./valueObjects";

export type CreateOrderInput = Omit<OrderEntity, "id" | "created_at" | "modified_at">;
export type UpdateOrderInput = Partial<Omit<OrderEntity, "id">>;

export interface OrderRepository {
  getAll(filters?: OrderFilters): Promise<OrderEntity[]>;
  getById(id: number): Promise<OrderEntity | null>;
  getByStatus(status: OrderStatus, storeId?: number): Promise<OrderEntity[]>;
  search(term: string, storeId?: number): Promise<OrderEntity[]>;
  getPaginated(
    filters: OrderFilters,
    pagination: OrderPaginationParams
  ): Promise<PaginatedOrdersResult>;
  create(data: CreateOrderInput): Promise<OrderEntity>;
  update(id: number, data: UpdateOrderInput): Promise<OrderEntity>;
  delete(id: number): Promise<void>;
  getWithItems(id: number): Promise<OrderWithItems | null>;
  getSummary(storeId?: number, storeIds?: number[]): Promise<OrderSummary>;
  getDailyMetrics(
    fromDate: string,
    toDate: string,
    storeId?: number,
    storeIds?: number[]
  ): Promise<{ date: string; sales: number; orders: number }[]>;
  getPendingFulfillmentCount(
    storeId?: number,
    storeIds?: number[]
  ): Promise<number>;
}

export interface OrderItemRepository {
  getByOrderId(orderId: number): Promise<OrderItemEntity[]>;
  createMany(orderId: number, items: CreateOrderItemInput[]): Promise<OrderItemEntity[]>;
  updateMany(orderId: number, items: UpdateOrderItemInput[]): Promise<OrderItemEntity[]>;
  deleteByOrderId(orderId: number): Promise<void>;
}
