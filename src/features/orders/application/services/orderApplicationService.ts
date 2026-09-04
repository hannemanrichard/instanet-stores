import {
  SupabaseOrderItemService,
  SupabaseOrderService,
} from "../../data";
import { SupabaseProductService } from "@/features/products/data";
import type {
  CreateOrderInput,
  CreateOrderItemInput,
  OrderEntity,
  OrderItemEntity,
  OrderSummary,
  OrderWithItems,
  UpdateOrderInput,
  UpdateOrderItemInput,
} from "../../domain";
import { OrderError, OrderItemError } from "../../domain";
import type { OrderRepository, OrderItemRepository } from "../../domain/repositories";
import type {
  OrderFilters,
  OrderPaginationParams,
  PaginatedOrdersResult,
} from "../../domain/valueObjects";
import type { ProductRepository } from "@/features/products/domain/repositories";

export interface CreateOrderPayload {
  order: CreateOrderInput;
  items?: CreateOrderItemInput[];
  /** Product id used to resolve store_id and snapshot supplier_price */
  productId?: number;
}

export interface UpdateOrderPayload {
  order?: UpdateOrderInput;
  items?: UpdateOrderItemInput[];
}

export class OrderApplicationService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly productRepository: ProductRepository
  ) {}

  async getOrders(filters?: OrderFilters): Promise<OrderEntity[]> {
    try {
      if (filters?.search?.trim()) {
        return await this.orderRepository.search(
          filters.search.trim(),
          filters.storeId
        );
      }

      if (filters?.status) {
        return await this.orderRepository.getByStatus(
          filters.status,
          filters.storeId
        );
      }

      return await this.orderRepository.getAll(filters);
    } catch {
      throw new OrderError("Failed to load orders", "ORDER_FETCH_FAILED");
    }
  }

  async getPaginatedOrders(
    filters: OrderFilters,
    pagination: OrderPaginationParams
  ): Promise<PaginatedOrdersResult> {
    try {
      if (filters.storeIds && filters.storeIds.length === 0) {
        return {
          data: [],
          total: 0,
          page: pagination.page,
          limit: pagination.limit,
        };
      }
      return await this.orderRepository.getPaginated(filters, pagination);
    } catch (error) {
      if (error instanceof OrderError) throw error;
      throw new OrderError("Failed to load orders", "ORDER_FETCH_FAILED");
    }
  }

  async getOrderDetail(orderId: number): Promise<OrderWithItems> {
    try {
      const result = await this.orderRepository.getWithItems(orderId);
      if (!result) {
        throw new OrderError("Order not found", "ORDER_NOT_FOUND");
      }
      return result;
    } catch (error) {
      if (error instanceof OrderError) throw error;
      throw new OrderError("Failed to load order", "ORDER_FETCH_FAILED");
    }
  }

  async getOrderItems(orderId: number): Promise<OrderItemEntity[]> {
    try {
      return await this.orderItemRepository.getByOrderId(orderId);
    } catch {
      throw new OrderItemError(
        "Failed to load order items",
        "ORDER_ITEM_FETCH_FAILED"
      );
    }
  }

  async getOrderSummary(
    storeId?: number,
    storeIds?: number[]
  ): Promise<OrderSummary> {
    try {
      if (storeIds && storeIds.length === 0) {
        return {
          total_orders: 0,
          total_processing: 0,
          total_delivered: 0,
          total_value: 0,
        };
      }
      return await this.orderRepository.getSummary(storeId, storeIds);
    } catch {
      throw new OrderError(
        "Failed to load order summary",
        "ORDER_SUMMARY_FETCH_FAILED"
      );
    }
  }

  async createOrder(payload: CreateOrderPayload): Promise<OrderWithItems> {
    try {
      if (!payload.productId) {
        throw new OrderError(
          "Product id is required to create an order",
          "ORDER_PRODUCT_REQUIRED"
        );
      }

      const product = await this.productRepository.getById(payload.productId);
      if (!product) {
        throw new OrderError("Product not found", "ORDER_PRODUCT_NOT_FOUND");
      }
      if (product.store_id == null) {
        throw new OrderError(
          "Product has no store assigned",
          "ORDER_PRODUCT_STORE_REQUIRED"
        );
      }
      if (product.supplier_price == null || product.supplier_price < 0) {
        throw new OrderError(
          "Product supplier_price is required",
          "ORDER_SUPPLIER_PRICE_REQUIRED"
        );
      }

      const orderInput: CreateOrderInput = {
        ...payload.order,
        store_id: product.store_id,
        status: payload.order.status ?? "initial",
        is_auto_delivered: payload.order.is_auto_delivered ?? false,
        is_exchange_required: payload.order.is_exchange_required ?? false,
        has_defect: payload.order.has_defect ?? false,
        return_processed: payload.order.return_processed ?? false,
        is_supplier_paid: payload.order.is_supplier_paid ?? false,
        product: payload.order.product ?? product.name,
      };

      const order = await this.orderRepository.create(orderInput);

      const unitSupplierPrice = product.supplier_price;
      let items: OrderItemEntity[] = [];
      if (payload.items?.length) {
        items = await this.orderItemRepository.createMany(
          order.id,
          payload.items.map((item) => ({
            ...item,
            unit_supplier_price:
              item.unit_supplier_price ?? unitSupplierPrice,
          }))
        );
      }

      return { order, items };
    } catch (error) {
      if (error instanceof OrderError) throw error;
      throw new OrderError("Failed to create order", "ORDER_CREATE_FAILED");
    }
  }

  async updateOrder(
    orderId: number,
    payload: UpdateOrderPayload
  ): Promise<OrderWithItems> {
    try {
      if (payload.order) {
        await this.orderRepository.update(orderId, payload.order);
      }

      if (payload.items) {
        await this.orderItemRepository.updateMany(orderId, payload.items);
      }

      const updated = await this.orderRepository.getWithItems(orderId);
      if (!updated) {
        throw new OrderError(
          "Order not found after update",
          "ORDER_NOT_FOUND"
        );
      }

      return updated;
    } catch (error) {
      if (error instanceof OrderError) throw error;
      throw new OrderError("Failed to update order", "ORDER_UPDATE_FAILED");
    }
  }

  async updateOrderStatus(
    orderId: number,
    status: string
  ): Promise<OrderEntity> {
    try {
      return await this.orderRepository.update(orderId, { status });
    } catch {
      throw new OrderError(
        "Failed to update order status",
        "ORDER_STATUS_UPDATE_FAILED"
      );
    }
  }

  async replaceOrderItems(
    orderId: number,
    items: UpdateOrderItemInput[]
  ): Promise<OrderItemEntity[]> {
    try {
      return await this.orderItemRepository.updateMany(orderId, items);
    } catch {
      throw new OrderItemError(
        "Failed to update order items",
        "ORDER_ITEM_UPDATE_FAILED"
      );
    }
  }

  async deleteOrder(orderId: number): Promise<void> {
    try {
      await this.orderItemRepository.deleteByOrderId(orderId);
      await this.orderRepository.delete(orderId);
    } catch {
      throw new OrderError("Failed to delete order", "ORDER_DELETE_FAILED");
    }
  }

  async markOrdersSupplierPaid(orderIds: number[]): Promise<void> {
    try {
      for (const orderId of orderIds) {
        await this.orderRepository.update(orderId, {
          is_supplier_paid: true,
        } as UpdateOrderInput);
      }
    } catch {
      throw new OrderError(
        "Failed to mark orders as supplier paid",
        "ORDER_SUPPLIER_PAID_UPDATE_FAILED"
      );
    }
  }
}

const orderService = new SupabaseOrderService();
const orderItemService = new SupabaseOrderItemService();
const productService = new SupabaseProductService();

export const orderApplicationService = new OrderApplicationService(
  orderService,
  orderItemService,
  productService
);
