import type {
  CreateOrderInput,
  OrderEntity,
  OrderSummary,
  OrderWithItems,
} from "../../domain";
import {
  OrderApplicationService,
  type CreateOrderPayload,
} from "../../application/services/orderApplicationService";
import type {
  OrderItemRepository,
  OrderRepository,
} from "../../domain/repositories";
import type { ProductRepository } from "@/features/products/domain/repositories";
import type { ProductEntity } from "@/features/products/domain";

jest.mock("../../data", () => ({
  SupabaseOrderService: jest.fn().mockImplementation(() => ({})),
  SupabaseOrderItemService: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("@/features/products/data", () => ({
  SupabaseProductService: jest.fn().mockImplementation(() => ({})),
}));

const createOrderRepositoryMock = (): jest.Mocked<OrderRepository> => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  getByStatus: jest.fn(),
  search: jest.fn(),
  getPaginated: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getWithItems: jest.fn(),
  getSummary: jest.fn(),
  getDailyMetrics: jest.fn(),
  getPendingFulfillmentCount: jest.fn(),
});

const createOrderItemRepositoryMock = (): jest.Mocked<OrderItemRepository> => ({
  getByOrderId: jest.fn(),
  createMany: jest.fn(),
  updateMany: jest.fn(),
  deleteByOrderId: jest.fn(),
});

const createProductRepositoryMock = (): jest.Mocked<ProductRepository> => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  getByStoreId: jest.fn(),
  getByStoreIds: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  search: jest.fn(),
  getCatalog: jest.fn(),
  getInventorySnapshot: jest.fn(),
});

describe("OrderApplicationService", () => {
  let orderRepository: jest.Mocked<OrderRepository>;
  let orderItemRepository: jest.Mocked<OrderItemRepository>;
  let productRepository: jest.Mocked<ProductRepository>;
  let service: OrderApplicationService;

  const baseOrder: OrderEntity = {
    id: 1,
    status: "processing",
    first_name: "John",
    last_name: "Doe",
    phone: "123",
    phone2: undefined,
    address: undefined,
    commune: undefined,
    wilaya: undefined,
    channel: undefined,
    comment: undefined,
    objective: undefined,
    delivery_company: undefined,
    delivery_fees: undefined,
    delivery_notes: undefined,
    delivery_attempt: undefined,
    tracking_id: undefined,
    tracker_id: undefined,
    dc_recent_status: undefined,
    yalidine_status: undefined,
    agent_id: undefined,
    partner_id: undefined,
    store_id: 7,
    is_supplier_paid: false,
    product: "Serum",
    product_color: undefined,
    product_size: undefined,
    product_price: undefined,
    product_qty: 2,
    shipping_price: undefined,
    is_auto_delivered: false,
    is_exchange_required: false,
    is_exchange: undefined,
    has_exchange: undefined,
    has_defect: false,
    is_free_shipping: undefined,
    is_stopdesk: undefined,
    is_wholesale: false,
    return_processed: false,
    stopdesk: undefined,
    created_at: undefined,
    modified_at: undefined,
  };

  const product: ProductEntity = {
    id: 10,
    name: "Serum",
    retail_price: 5000,
    retail_commission: 500,
    wholesale_commission: 300,
    store_id: 7,
    supplier_price: 100,
    created_at: "2026-01-01",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    orderRepository = createOrderRepositoryMock();
    orderItemRepository = createOrderItemRepositoryMock();
    productRepository = createProductRepositoryMock();
    service = new OrderApplicationService(
      orderRepository,
      orderItemRepository,
      productRepository
    );
  });

  describe("getOrders", () => {
    it("returns orders by status when provided", async () => {
      const orders: OrderEntity[] = [baseOrder];
      orderRepository.getByStatus.mockResolvedValue(orders);

      const result = await service.getOrders({
        status: "processing",
        storeId: 7,
      });

      expect(orderRepository.getByStatus).toHaveBeenCalledWith("processing", 7);
      expect(result).toEqual(orders);
    });

    it("searches orders when search term provided", async () => {
      orderRepository.search.mockResolvedValue([baseOrder]);

      await service.getOrders({ search: "john", storeId: 7 });

      expect(orderRepository.search).toHaveBeenCalledWith("john", 7);
    });
  });

  describe("getPaginatedOrders", () => {
    it("returns paginated orders for store", async () => {
      orderRepository.getPaginated.mockResolvedValue({
        data: [baseOrder],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await service.getPaginatedOrders(
        { storeId: 7, status: "initial" },
        { page: 1, limit: 10 }
      );

      expect(orderRepository.getPaginated).toHaveBeenCalledWith(
        { storeId: 7, status: "initial" },
        { page: 1, limit: 10 }
      );
      expect(result.total).toBe(1);
    });
  });

  describe("createOrder", () => {
    it("creates order with store_id and snapshots supplier_price on items", async () => {
      const payload: CreateOrderPayload = {
        order: {
          ...baseOrder,
          id: undefined as unknown as number,
        } as CreateOrderInput,
        items: [
          {
            item_id: 10,
            qty: 2,
          },
        ],
        productId: 10,
      };

      orderRepository.create.mockResolvedValue(baseOrder);
      orderItemRepository.createMany.mockResolvedValue([
        {
          order_id: 1,
          item_id: 10,
          qty: 2,
          unit_supplier_price: 100,
          item: undefined,
        },
      ]);
      productRepository.getById.mockResolvedValue(product);

      const result = await service.createOrder(payload);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          store_id: 7,
          status: "initial",
          is_supplier_paid: false,
          product: "Serum",
          product_price: 5000,
        })
      );
      expect(orderItemRepository.createMany).toHaveBeenCalledWith(1, [
        {
          item_id: 10,
          qty: 2,
          unit_supplier_price: 100,
        },
      ]);
      expect(productRepository.getById).toHaveBeenCalledWith(10);
      expect(result.order.id).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it("ignores client monetary and workflow fields in favor of trusted product values", async () => {
      const payload: CreateOrderPayload = {
        order: {
          ...baseOrder,
          id: undefined as unknown as number,
          status: "delivered",
          product_price: 1,
          shipping_price: 1,
          is_supplier_paid: true,
          product_qty: 3,
        } as CreateOrderInput,
        items: [
          {
            item_id: 10,
            qty: 3,
            unit_supplier_price: 1,
          },
        ],
        productId: 10,
      };

      orderRepository.create.mockResolvedValue(baseOrder);
      orderItemRepository.createMany.mockResolvedValue([
        {
          order_id: 1,
          item_id: 10,
          qty: 3,
          unit_supplier_price: 100,
          item: undefined,
        },
      ]);
      productRepository.getById.mockResolvedValue({
        ...product,
        retail_price_2: 4500,
        retail_price_3: 4000,
      });

      await service.createOrder(payload);

      expect(orderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "initial",
          is_supplier_paid: false,
          product_price: 4000,
          product_qty: 3,
          shipping_price: undefined,
        })
      );
      expect(orderItemRepository.createMany).toHaveBeenCalledWith(1, [
        {
          item_id: 10,
          qty: 3,
          unit_supplier_price: 100,
        },
      ]);
    });

    it("rejects create without product id", async () => {
      await expect(
        service.createOrder({
          order: baseOrder as CreateOrderInput,
        })
      ).rejects.toMatchObject({ code: "ORDER_PRODUCT_REQUIRED" });
    });

    it("rejects create when product has no supplier_price", async () => {
      productRepository.getById.mockResolvedValue({
        ...product,
        supplier_price: null,
      });

      await expect(
        service.createOrder({
          order: baseOrder as CreateOrderInput,
          productId: 10,
        })
      ).rejects.toMatchObject({ code: "ORDER_SUPPLIER_PRICE_REQUIRED" });
    });
  });

  describe("updateOrder", () => {
    it("updates order and items", async () => {
      const updated: OrderWithItems = {
        order: { ...baseOrder, status: "delivered" },
        items: [],
      };

      orderRepository.update.mockResolvedValue(updated.order);
      orderRepository.getWithItems.mockResolvedValue(updated);

      const result = await service.updateOrder(1, {
        order: { status: "delivered" },
      });

      expect(result.order.status).toBe("delivered");
    });
  });

  describe("updateOrderStatus", () => {
    it("updates status", async () => {
      orderRepository.update.mockResolvedValue({
        ...baseOrder,
        status: "delivered",
      });

      const result = await service.updateOrderStatus(1, "delivered");

      expect(result.status).toBe("delivered");
      expect(orderRepository.update).toHaveBeenCalledWith(1, {
        status: "delivered",
      });
    });
  });

  describe("getOrderSummary", () => {
    it("returns summary for store", async () => {
      const summary: OrderSummary = {
        total_orders: 3,
        total_processing: 1,
        total_delivered: 1,
        total_value: 1000,
      };
      orderRepository.getSummary.mockResolvedValue(summary);

      const result = await service.getOrderSummary(7);

      expect(orderRepository.getSummary).toHaveBeenCalledWith(7, undefined);
      expect(result).toEqual(summary);
    });
  });
});
