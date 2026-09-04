/**
 * Demo fixtures matching domain types.
 * Opt in with NEXT_PUBLIC_USE_DUMMY_DATA=true (defaults to live Supabase data).
 */

import type {
  OrderEntity,
  OrderSummary,
  PaginatedOrdersResult,
  OrderFilters,
} from "@/features/orders/domain";
import type {
  InventoryPhaseColorDetail,
  InventoryPhaseSummary,
  InventorySoldUnitsByProduct,
  InventoryWithItem,
} from "@/features/inventory/domain";
import type {
  CreatePaymentInput,
  PaymentEntity,
  PaymentsSummary,
} from "@/features/payments/domain";
import { generatePaymentCode } from "@/features/payments/domain/paymentCode";
import type { ProductEntity } from "@/features/products/domain";
import type {
  CreateReturnInput,
  EligibleReturnOrder,
  ReturnEntity,
  ReturnItemSummary,
  ReturnOrderSummary,
  ReturnStatus,
} from "@/features/returns/domain";
import { generateReturnCode } from "@/features/returns/domain/returnCode";
import { DUMMY_DAILY_METRICS } from "@/features/dashboard/data/dummyDailySales";
import {
  getPreviousDashboardDateRange,
  type DashboardDateRange,
} from "@/features/dashboard/domain/dashboardDateRange";
import type { DashboardHomeMetrics } from "@/features/dashboard/domain/dashboardSales";

export const isDummyDataEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_USE_DUMMY_DATA === "true";

const DUMMY_STORE_ID = 1;

const daysAgo = (days: number): string =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

/** Demo product-page style thumbnails for orders table */
const dummyProductThumbnails: Record<string, string> = {
  "Silk Hijab Set":
    "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=120&h=120&fit=crop",
  "Linen Abaya":
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=120&h=120&fit=crop",
  "Cotton Prayerset":
    "https://images.unsplash.com/photo-1617137968427-85924c800a41?w=120&h=120&fit=crop",
  "Everyday Tee Bundle":
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=120&h=120&fit=crop",
};

const withProductThumbnail = (
  order: OrderEntity
): OrderEntity => ({
  ...order,
  product_thumbnail:
    order.product_thumbnail ??
    (order.product ? dummyProductThumbnails[order.product] : undefined),
});

const orderDefaults = {
  is_supplier_paid: false,
  product_qty: 1,
  is_auto_delivered: false,
  is_exchange_required: false,
  has_defect: false,
  return_processed: false,
  store_id: DUMMY_STORE_ID,
} as const;

/** ——— Orders ——— */
export const dummyOrders: OrderEntity[] = [
  {
    ...orderDefaults,
    id: 10421,
    status: "delivered",
    first_name: "Amira",
    last_name: "Benali",
    phone: "0555123456",
    address: "12 Rue Didouche Mourad",
    wilaya: "Alger",
    commune: "Alger Centre",
    product: "Silk Hijab Set",
    product_color: "Ivory",
    product_size: "One Size",
    product_price: 4500,
    product_qty: 2,
    tracking_id: "YL-884201",
    dc_recent_status: "Livré",
    yalidine_status: "Livré",
    delivery_company: "Yalidine",
    is_supplier_paid: true,
    created_at: daysAgo(12),
  },
  {
    ...orderDefaults,
    id: 10422,
    status: "delivered",
    first_name: "Karim",
    last_name: "Haddad",
    phone: "0661789012",
    wilaya: "Oran",
    commune: "Es Senia",
    product: "Linen Abaya",
    product_color: "Olive",
    product_size: "M",
    product_price: 8900,
    product_qty: 1,
    tracking_id: "YL-884255",
    dc_recent_status: "Livré",
    yalidine_status: "Livré",
    delivery_company: "Yalidine",
    is_supplier_paid: false,
    created_at: daysAgo(5),
  },
  {
    ...orderDefaults,
    id: 10423,
    status: "processing",
    first_name: "Sara",
    last_name: "Mansouri",
    phone: "0770456789",
    wilaya: "Constantine",
    commune: "Zouaghi",
    product: "Cotton Prayerset",
    product_color: "Blush",
    product_size: "L",
    product_price: 3200,
    product_qty: 1,
    tracking_id: "YL-884301",
    dc_recent_status: "En préparation",
    yalidine_status: "En cours",
    delivery_company: "Yalidine",
    created_at: daysAgo(2),
  },
  {
    ...orderDefaults,
    id: 10424,
    status: "processing",
    first_name: "Nabil",
    last_name: "Cherif",
    phone: "0544332211",
    wilaya: "Blida",
    commune: "Blida",
    product: "Silk Hijab Set",
    product_color: "Black",
    product_size: "One Size",
    product_price: 4500,
    product_qty: 3,
    tracking_id: "YL-884318",
    dc_recent_status: "Ramassé",
    yalidine_status: "En transit",
    delivery_company: "Yalidine",
    created_at: daysAgo(1),
  },
  {
    ...orderDefaults,
    id: 10425,
    status: "initial",
    first_name: "Lina",
    last_name: "Bouzid",
    phone: "0555987654",
    wilaya: "Sétif",
    commune: "Sétif",
    product: "Everyday Tee Bundle",
    product_color: "White",
    product_size: "S",
    product_price: 2800,
    product_qty: 2,
    created_at: daysAgo(0),
  },
  {
    ...orderDefaults,
    id: 10426,
    status: "returned",
    first_name: "Yacine",
    last_name: "Khelifi",
    phone: "0677123098",
    wilaya: "Annaba",
    commune: "Annaba",
    product: "Linen Abaya",
    product_color: "Sand",
    product_size: "L",
    product_price: 8900,
    product_qty: 1,
    tracking_id: "YL-883901",
    dc_recent_status: "Retourné",
    yalidine_status: "Retour",
    return_processed: true,
    created_at: daysAgo(18),
  },
  {
    ...orderDefaults,
    id: 10427,
    status: "cancelled",
    first_name: "Rania",
    last_name: "Saadi",
    phone: "0555001122",
    wilaya: "Tizi Ouzou",
    product: "Silk Hijab Set",
    product_color: "Rose",
    product_size: "One Size",
    product_price: 4500,
    product_qty: 1,
    created_at: daysAgo(8),
  },
  {
    ...orderDefaults,
    id: 10428,
    status: "delivered",
    first_name: "Omar",
    last_name: "Belkacem",
    phone: "0661554433",
    wilaya: "Alger",
    commune: "Bab Ezzouar",
    product: "Cotton Prayerset",
    product_color: "Navy",
    product_size: "M",
    product_price: 3200,
    product_qty: 2,
    tracking_id: "YL-884100",
    dc_recent_status: "Livré",
    yalidine_status: "Livré",
    is_supplier_paid: false,
    created_at: daysAgo(4),
  },
  {
    ...orderDefaults,
    id: 10429,
    status: "returned",
    first_name: "Nour",
    last_name: "Hamidi",
    phone: "0555345678",
    wilaya: "Oran",
    commune: "Oran",
    product: "Silk Hijab Set",
    product_color: "Ivory",
    product_size: "One Size",
    product_price: 4500,
    product_qty: 1,
    tracking_id: "YL-884201",
    dc_recent_status: "En transit retour",
    yalidine_status: "Retour à retirer",
    created_at: daysAgo(6),
  },
  {
    ...orderDefaults,
    id: 10430,
    status: "returned",
    first_name: "Karim",
    last_name: "Meziane",
    phone: "0661789012",
    wilaya: "Constantine",
    commune: "Constantine",
    product: "Cotton Prayerset",
    product_color: "Navy",
    product_size: "L",
    product_price: 3200,
    product_qty: 1,
    tracking_id: "YL-884202",
    dc_recent_status: "Retourné",
    yalidine_status: "Retour",
    created_at: daysAgo(5),
  },
  {
    ...orderDefaults,
    id: 10431,
    status: "returned",
    first_name: "Sara",
    last_name: "Cherif",
    phone: "0771456789",
    wilaya: "Blida",
    commune: "Blida",
    product: "Everyday Tee Bundle",
    product_color: "White",
    product_size: "M",
    product_price: 2800,
    product_qty: 1,
    tracking_id: "YL-884203",
    dc_recent_status: "recupere_par_fournisseur",
    yalidine_status: "Livré",
    created_at: daysAgo(11),
  },
  {
    ...orderDefaults,
    id: 10432,
    status: "returned",
    first_name: "Bilal",
    last_name: "Amrani",
    phone: "0555678901",
    wilaya: "Alger",
    commune: "Hydra",
    product: "Linen Abaya",
    product_color: "Sand",
    product_size: "M",
    product_price: 8900,
    product_qty: 1,
    tracking_id: "YL-884204",
    dc_recent_status: "Retourné",
    yalidine_status: "Retour à retirer",
    created_at: daysAgo(3),
  },
  {
    ...orderDefaults,
    id: 10433,
    status: "returned",
    first_name: "Ines",
    last_name: "Touati",
    phone: "0677234567",
    wilaya: "Béjaïa",
    commune: "Béjaïa",
    product: "Silk Hijab Set",
    product_color: "Rose",
    product_size: "One Size",
    product_price: 4500,
    product_qty: 2,
    tracking_id: "YL-884205",
    dc_recent_status: "Retourné",
    yalidine_status: "Retour",
    created_at: daysAgo(14),
  },
];

export const getDummyOrderSummary = (): OrderSummary => {
  const total_orders = dummyOrders.length;
  const total_processing = dummyOrders.filter(
    (o) => o.status === "processing" || o.status === "initial"
  ).length;
  const total_delivered = dummyOrders.filter(
    (o) => o.status === "delivered"
  ).length;
  const total_value = dummyOrders.reduce(
    (sum, o) => sum + (o.product_price ?? 0) * (o.product_qty ?? 0),
    0
  );
  return { total_orders, total_processing, total_delivered, total_value };
};

export const getDummyPaginatedOrders = (
  filters: OrderFilters,
  page: number,
  limit: number
): PaginatedOrdersResult => {
  let data = [...dummyOrders];

  if (filters.status) {
    data = data.filter((o) => o.status === filters.status);
  }

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    data = data.filter((o) => {
      const haystack = [
        o.first_name,
        o.last_name,
        o.phone,
        o.tracking_id,
        o.product,
        String(o.id),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  const total = data.length;
  const start = (page - 1) * limit;
  return {
    data: data.slice(start, start + limit).map(withProductThumbnail),
    total,
    page,
    limit,
  };
};

/** ——— Products (for inventory picker) ——— */
export const dummyProducts: ProductEntity[] = [
  {
    id: 101,
    name: "Silk Hijab Set",
    description: "Soft silk hijab with matching undercap",
    retail_price: 4500,
    supplier_price: 2200,
    store_id: DUMMY_STORE_ID,
    created_at: daysAgo(60),
  },
  {
    id: 102,
    name: "Linen Abaya",
    description: "Breathable linen abaya",
    retail_price: 8900,
    supplier_price: 4800,
    store_id: DUMMY_STORE_ID,
    created_at: daysAgo(45),
  },
  {
    id: 103,
    name: "Cotton Prayerset",
    retail_price: 3200,
    supplier_price: 1600,
    store_id: DUMMY_STORE_ID,
    created_at: daysAgo(30),
  },
];

/** ——— Inventory ——— */
export const getDummyProductInventory = (
  productId: number
): InventoryWithItem[] => {
  const product = dummyProducts.find((p) => p.id === productId);
  const name = product?.name ?? "Sample Product";

  if (productId === 102) {
    return [
      {
        inventory: { id: 201, item_id: 201, quantity: 8 },
        item: {
          id: 201,
          product_id: 102,
          product: name,
          color: "Olive",
          colorHex: "#556B2F",
          size: "M",
        },
      },
      {
        inventory: { id: 202, item_id: 202, quantity: 5 },
        item: {
          id: 202,
          product_id: 102,
          product: name,
          color: "Olive",
          colorHex: "#556B2F",
          size: "L",
        },
      },
      {
        inventory: { id: 203, item_id: 203, quantity: 3 },
        item: {
          id: 203,
          product_id: 102,
          product: name,
          color: "Sand",
          colorHex: "#C2B280",
          size: "L",
        },
      },
    ];
  }

  if (productId === 103) {
    return [
      {
        inventory: { id: 301, item_id: 301, quantity: 14 },
        item: {
          id: 301,
          product_id: 103,
          product: name,
          color: "Blush",
          colorHex: "#E8B4B8",
          size: "L",
        },
      },
      {
        inventory: { id: 302, item_id: 302, quantity: 11 },
        item: {
          id: 302,
          product_id: 103,
          product: name,
          color: "Navy",
          colorHex: "#1B2A4A",
          size: "M",
        },
      },
    ];
  }

  // Default / product 101
  return [
    {
      inventory: { id: 101, item_id: 101, quantity: 24 },
      item: {
        id: 101,
        product_id: 101,
        product: name,
        color: "Ivory",
        colorHex: "#FFFFF0",
        size: "One Size",
      },
    },
    {
      inventory: { id: 102, item_id: 102, quantity: 18 },
      item: {
        id: 102,
        product_id: 101,
        product: name,
        color: "Black",
        colorHex: "#111111",
        size: "One Size",
      },
    },
    {
      inventory: { id: 103, item_id: 103, quantity: 9 },
      item: {
        id: 103,
        product_id: 101,
        product: name,
        color: "Rose",
        colorHex: "#C08081",
        size: "One Size",
      },
    },
  ];
};

export const getDummyInventoryPhases = (
  productId: number
): InventoryPhaseSummary => {
  const inStock = getDummyProductInventory(productId).reduce(
    (sum, row) => sum + row.inventory.quantity,
    0
  );

  const byProduct: Record<
    number,
    Omit<InventoryPhaseSummary, "product_id" | "in_stock">
  > = {
    101: { ordered: 12, in_delivery: 7, delivered: 42 },
    102: { ordered: 4, in_delivery: 3, delivered: 18 },
    103: { ordered: 6, in_delivery: 2, delivered: 25 },
  };

  const phases = byProduct[productId] ?? {
    ordered: 5,
    in_delivery: 2,
    delivered: 10,
  };

  return { product_id: productId, in_stock: inStock, ...phases };
};

export const getDummyInventoryPhaseDetails = (
  productId: number,
  phases: string[]
): InventoryPhaseColorDetail[] => {
  const inventory = getDummyProductInventory(productId);
  const byColor = new Map<string, InventoryPhaseColorDetail>();

  for (const row of inventory) {
    const color = row.item?.color ?? "Default";
    const existing = byColor.get(color) ?? {
      color,
      colorHex: row.item?.colorHex,
      total: 0,
      variants: [],
    };

    const qty =
      phases.includes("ordered") || phases.includes("in_delivery")
        ? Math.max(1, Math.floor(row.inventory.quantity / 4))
        : row.inventory.quantity;

    existing.total += qty;
    existing.variants.push({
      itemId: String(row.item?.id ?? row.inventory.item_id),
      size: row.item?.size,
      quantity: qty,
    });
    byColor.set(color, existing);
  }

  return Array.from(byColor.values());
};

export const dummySoldUnits: InventorySoldUnitsByProduct[] = [
  { key: "Silk Hijab Set", value: 42 },
  { key: "Linen Abaya", value: 18 },
  { key: "Cotton Prayerset", value: 25 },
  { key: "Everyday Tee Bundle", value: 11 },
];

/** ——— Payments / withdrawals (supplier payout batches) ——— */
export const dummyPaymentsSummary: PaymentsSummary = {
  notReadyTotal: 15300,
  readyTotal: 9900,
  paidTotal: 22400,
  notReadyOrders: [
    {
      id: 10422,
      store_id: DUMMY_STORE_ID,
      product: "Linen Abaya",
      product_qty: 1,
      amount: 4800,
      created_at: daysAgo(5),
      status: "delivered",
    },
    {
      id: 10428,
      store_id: DUMMY_STORE_ID,
      product: "Cotton Prayerset",
      product_qty: 2,
      amount: 3200,
      created_at: daysAgo(4),
      status: "delivered",
    },
    {
      id: 10419,
      store_id: DUMMY_STORE_ID,
      product: "Silk Hijab Set",
      product_qty: 3,
      amount: 6600,
      created_at: daysAgo(3),
      status: "delivered",
    },
    {
      id: 10415,
      store_id: DUMMY_STORE_ID,
      product: "Everyday Tee Bundle",
      product_qty: 1,
      amount: 1400,
      created_at: daysAgo(2),
      status: "delivered",
    },
  ],
  readyPayments: [
    {
      id: 501,
      code: "PMT-4K2M9A",
      store_id: DUMMY_STORE_ID,
      amount: 9900,
      is_paid: false,
      note: "Week 12 payout batch",
      created_at: daysAgo(3),
      orders: [
        {
          order_id: 10410,
          amount: 4400,
          product: "Silk Hijab Set",
          product_qty: 2,
          created_at: daysAgo(10),
        },
        {
          order_id: 10411,
          amount: 5500,
          product: "Linen Abaya",
          product_qty: 1,
          created_at: daysAgo(9),
        },
      ],
    },
  ],
  paidPayments: [
    {
      id: 488,
      code: "PMT-8XEE3B",
      store_id: DUMMY_STORE_ID,
      amount: 13200,
      is_paid: true,
      note: "Week 10 payout",
      created_at: daysAgo(21),
      paid_at: daysAgo(18),
      orders: [
        {
          order_id: 10390,
          amount: 6600,
          product: "Silk Hijab Set",
          product_qty: 3,
          created_at: daysAgo(28),
        },
        {
          order_id: 10391,
          amount: 6600,
          product: "Cotton Prayerset",
          product_qty: 4,
          created_at: daysAgo(27),
        },
      ],
    },
    {
      id: 475,
      code: "PMT-1Q7N2C",
      store_id: DUMMY_STORE_ID,
      amount: 9200,
      is_paid: true,
      note: "Week 8 payout",
      created_at: daysAgo(35),
      paid_at: daysAgo(32),
      orders: [
        {
          order_id: 10370,
          amount: 9200,
          product: "Linen Abaya",
          product_qty: 2,
          created_at: daysAgo(40),
        },
      ],
    },
  ],
};

let nextDummyPaymentId = 502;

const allDummyPayments = (): PaymentEntity[] => [
  ...dummyPaymentsSummary.readyPayments,
  ...dummyPaymentsSummary.paidPayments,
];

const omitPaymentOrders = (payment: PaymentEntity): PaymentEntity => {
  const { orders: _orders, ...rest } = payment;
  return rest;
};

export const getDummyPaymentsSummary = (): PaymentsSummary => ({
  notReadyTotal: dummyPaymentsSummary.notReadyTotal,
  readyTotal: dummyPaymentsSummary.readyTotal,
  paidTotal: dummyPaymentsSummary.paidTotal,
  notReadyOrders: [...dummyPaymentsSummary.notReadyOrders],
  readyPayments: dummyPaymentsSummary.readyPayments.map(omitPaymentOrders),
  paidPayments: dummyPaymentsSummary.paidPayments.map(omitPaymentOrders),
});

export const getDummyPaymentById = (id: number): PaymentEntity | null =>
  allDummyPayments().find((payment) => payment.id === id) ?? null;

export const createDummyPayment = (input: CreatePaymentInput): PaymentEntity => {
  if (!input.store_id) throw new Error("Store id is required");
  if (!input.order_ids?.length) throw new Error("At least one order is required");

  const selected = dummyPaymentsSummary.notReadyOrders.filter((order) =>
    input.order_ids.includes(order.id)
  );
  if (selected.length !== input.order_ids.length) {
    throw new Error("Order is not eligible for payment");
  }

  const created: PaymentEntity = {
    id: nextDummyPaymentId++,
    code: generatePaymentCode(),
    store_id: input.store_id,
    amount: selected.reduce((sum, order) => sum + order.amount, 0),
    is_paid: false,
    created_at: new Date().toISOString(),
    orders: selected.map((order) => ({
      order_id: order.id,
      amount: order.amount,
      product: order.product,
      product_qty: order.product_qty,
      created_at: order.created_at,
    })),
  };

  dummyPaymentsSummary.notReadyOrders = dummyPaymentsSummary.notReadyOrders.filter(
    (order) => !input.order_ids.includes(order.id)
  );
  dummyPaymentsSummary.notReadyTotal = dummyPaymentsSummary.notReadyOrders.reduce(
    (sum, order) => sum + order.amount,
    0
  );
  dummyPaymentsSummary.readyPayments = [created, ...dummyPaymentsSummary.readyPayments];
  dummyPaymentsSummary.readyTotal = dummyPaymentsSummary.readyPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  return created;
};

export const markDummyPaymentPaid = (paymentId: number): PaymentEntity => {
  const existing = getDummyPaymentById(paymentId);
  if (!existing) throw new Error("Payment not found");

  const updated: PaymentEntity = {
    ...existing,
    is_paid: true,
    paid_at: new Date().toISOString(),
  };
  dummyPaymentsSummary.readyPayments = dummyPaymentsSummary.readyPayments.filter(
    (payment) => payment.id !== paymentId
  );
  dummyPaymentsSummary.paidPayments = [updated, ...dummyPaymentsSummary.paidPayments];
  dummyPaymentsSummary.readyTotal = dummyPaymentsSummary.readyPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  dummyPaymentsSummary.paidTotal = dummyPaymentsSummary.paidPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  return updated;
};

/**
 * Temporary in-memory returns store (same shapes as /api/returns).
 * Switch hooks back to the API when you are ready to use the database again.
 */
const isDummyEligibleReturnOrder = (order: OrderEntity): boolean => {
  if ((order.status ?? "").toLowerCase() !== "returned") return false;

  const yalidine = (order.yalidine_status ?? "").trim();
  const dc = (order.dc_recent_status ?? "").trim().toLowerCase();

  if (yalidine === "Retour à retirer") return true;
  if (!dc.startsWith("recupere_par_fournisseur")) return true;
  return false;
};

const toReturnOrderSummary = (order: OrderEntity): ReturnOrderSummary => ({
  id: order.id,
  status: order.status,
  product: order.product,
  product_qty: order.product_qty ?? 0,
  tracking_id: order.tracking_id,
  yalidine_status: order.yalidine_status,
  dc_recent_status: order.dc_recent_status,
  created_at: order.created_at,
});

const toReturnItemSummary = (order: OrderEntity): ReturnItemSummary => ({
  order_id: order.id,
  item_id: order.id,
  product: order.product,
  color: order.product_color,
  size: order.product_size,
  qty: order.product_qty ?? 0,
});

const toEligibleReturnOrder = (order: OrderEntity): EligibleReturnOrder => ({
  id: order.id,
  store_id: order.store_id,
  status: order.status,
  product: order.product,
  product_qty: order.product_qty ?? 0,
  tracking_id: order.tracking_id,
  yalidine_status: order.yalidine_status,
  dc_recent_status: order.dc_recent_status,
  created_at: order.created_at,
});

const findDummyOrder = (id: number): OrderEntity | undefined =>
  dummyOrders.find((order) => order.id === id);

const buildDummyReturn = (
  id: number,
  code: string,
  status: ReturnStatus,
  orderIds: number[],
  createdDaysAgo: number,
  modifiedDaysAgo: number
): ReturnEntity => ({
  id,
  code,
  store_id: DUMMY_STORE_ID,
  status,
  created_at: daysAgo(createdDaysAgo),
  modified_at: daysAgo(modifiedDaysAgo),
  order_ids: orderIds,
  orders: orderIds
    .map(findDummyOrder)
    .filter((order): order is OrderEntity => order != null)
    .map(toReturnOrderSummary),
  items: orderIds
    .map(findDummyOrder)
    .filter((order): order is OrderEntity => order != null)
    .map(toReturnItemSummary),
});

let dummyReturnsState: ReturnEntity[] = [
  buildDummyReturn(801, "RET-4XEE9K", "processed", [10432], 2, 2),
  buildDummyReturn(800, "RET-9K2M4A", "collected", [10426, 10433], 12, 9),
];
let nextDummyReturnId = 802;

const getLinkedDummyOrderIds = (): Set<number> =>
  new Set(dummyReturnsState.flatMap((item) => item.order_ids ?? []));

export const getDummyReturns = (storeId?: number | null): ReturnEntity[] => {
  const list = [...dummyReturnsState].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const scoped =
    storeId == null ? list : list.filter((item) => item.store_id === storeId);

  return scoped.map((item) => ({
    id: item.id,
    code: item.code,
    store_id: item.store_id,
    status: item.status,
    created_at: item.created_at,
    modified_at: item.modified_at,
  }));
};

export const getDummyReturnById = (id: number): ReturnEntity | null =>
  dummyReturnsState.find((item) => item.id === id) ?? null;

export const getDummyEligibleReturnOrders = (
  storeId: number
): EligibleReturnOrder[] => {
  const linkedIds = getLinkedDummyOrderIds();
  return dummyOrders
    .filter((order) => (order.store_id ?? DUMMY_STORE_ID) === storeId)
    .filter((order) => !linkedIds.has(order.id))
    .filter(isDummyEligibleReturnOrder)
    .map(toEligibleReturnOrder);
};

export const createDummyReturn = (input: CreateReturnInput): ReturnEntity => {
  if (!input.store_id) {
    throw new Error("Store id is required");
  }
  if (!input.order_ids?.length) {
    throw new Error("At least one order is required");
  }

  const eligibleIds = new Set(
    getDummyEligibleReturnOrders(input.store_id).map((order) => order.id)
  );
  const invalid = input.order_ids.filter((id) => !eligibleIds.has(id));
  if (invalid.length) {
    throw new Error(
      `Orders not eligible for return batch: ${invalid.join(", ")}`
    );
  }

  const created: ReturnEntity = {
    id: nextDummyReturnId++,
    code: generateReturnCode(),
    store_id: input.store_id,
    status: "processed",
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
    order_ids: [...input.order_ids],
    orders: input.order_ids
      .map(findDummyOrder)
      .filter((order): order is OrderEntity => order != null)
      .map(toReturnOrderSummary),
    items: input.order_ids
      .map(findDummyOrder)
      .filter((order): order is OrderEntity => order != null)
      .map(toReturnItemSummary),
  };
  dummyReturnsState = [created, ...dummyReturnsState];
  return created;
};

export const markDummyReturnCollected = (returnId: number): ReturnEntity => {
  const existing = dummyReturnsState.find((item) => item.id === returnId);
  if (!existing) {
    throw new Error("Return not found");
  }

  const updated: ReturnEntity = {
    ...existing,
    status: "collected",
    modified_at: new Date().toISOString(),
  };
  dummyReturnsState = dummyReturnsState.map((item) =>
    item.id === returnId ? updated : item
  );
  return updated;
};

/** ——— Dashboard home statistics ——— */
export type DashboardHomeStats = {
  orders: OrderSummary;
  payments: {
    notReadyTotal: number;
    readyTotal: number;
    paidTotal: number;
    pendingWithdrawalCount: number;
  };
  inventory: {
    products: number;
    unitsInStock: number;
    unitsOrdered: number;
    unitsInDelivery: number;
  };
};

const toChangePercent = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const sumMetrics = (
  metrics: { sales: number; orders: number }[],
  field: "sales" | "orders"
) => metrics.reduce((total, point) => total + point[field], 0);

const filterMetricsByRange = (range: DashboardDateRange) =>
  DUMMY_DAILY_METRICS.filter(
    (point) => point.date >= range.fromDate && point.date <= range.toDate
  );

export const getDummyDashboardHomeMetrics = (
  range: DashboardDateRange
): DashboardHomeMetrics => {
  const currentMetrics = filterMetricsByRange(range);
  const previousRange = getPreviousDashboardDateRange(range);
  const previousMetrics = filterMetricsByRange(previousRange);
  const salesTotal = sumMetrics(currentMetrics, "sales");
  const previousSalesTotal = sumMetrics(previousMetrics, "sales");
  const ordersInPeriod = sumMetrics(currentMetrics, "orders");
  const previousOrdersInPeriod = sumMetrics(previousMetrics, "orders");

  return {
    range,
    series: currentMetrics.map((point) => ({
      date: point.date,
      value: point.sales,
    })),
    salesTotal,
    salesChangePercent: toChangePercent(salesTotal, previousSalesTotal),
    ordersInPeriod,
    ordersChangePercent: toChangePercent(
      ordersInPeriod,
      previousOrdersInPeriod
    ),
    pendingFulfillment: getDummyOrderSummary().total_processing,
  };
};

/** @deprecated Use getDummyDashboardHomeMetrics */
export const getDummyDailySales = getDummyDashboardHomeMetrics;

export const getDummyDashboardStats = (): DashboardHomeStats => {
  const orders = getDummyOrderSummary();
  const inventoryTotals = dummyProducts.reduce(
    (acc, product) => {
      const phases = getDummyInventoryPhases(product.id);
      acc.unitsInStock += phases.in_stock;
      acc.unitsOrdered += phases.ordered;
      acc.unitsInDelivery += phases.in_delivery;
      return acc;
    },
    { unitsInStock: 0, unitsOrdered: 0, unitsInDelivery: 0 }
  );

  return {
    orders,
    payments: {
      notReadyTotal: dummyPaymentsSummary.notReadyTotal,
      readyTotal: dummyPaymentsSummary.readyTotal,
      paidTotal: dummyPaymentsSummary.paidTotal,
      pendingWithdrawalCount:
        dummyPaymentsSummary.readyPayments.length +
        dummyPaymentsSummary.notReadyOrders.length,
    },
    inventory: {
      products: dummyProducts.length,
      ...inventoryTotals,
    },
  };
};
