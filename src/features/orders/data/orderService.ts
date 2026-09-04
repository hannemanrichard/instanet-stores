import { eachDayOfInterval, format, parseISO } from "date-fns";
import { supabaseServer as supabase } from "@/infrastructure/supabase/server";
import type { Database } from "@/infrastructure/supabase/types";
import { DatabaseWrapper } from "@/shared/utils/databaseWrapper";
import { withPerformanceTracking } from "@/shared/utils/performanceMonitor";
import type {
  CreateOrderInput,
  OrderEntity,
  OrderSummary,
  OrderWithItems,
  UpdateOrderInput,
} from "../domain";
import type { OrderItemEntity } from "../domain/entities";
import type { OrderRepository } from "../domain/repositories";
import type {
  OrderFilters,
  OrderPaginationParams,
  PaginatedOrdersResult,
} from "../domain/valueObjects";

type Tables = Database["public"]["Tables"];
type OrderRow = Tables["orders"]["Row"];
type OrderInsert = Tables["orders"]["Insert"];
type OrderUpdate = Tables["orders"]["Update"];
type OrderItemRow = Tables["order_item"]["Row"] & {
  items?: Tables["items"]["Row"] | null;
};

export class SupabaseOrderService implements OrderRepository {
  private readonly tableName = "orders";

  async getAll(filters?: OrderFilters): Promise<OrderEntity[]> {
    return withPerformanceTracking("OrderService", "getAll", async () => {
      const rows = await DatabaseWrapper.executeQuery(
        async () => {
          let query = supabase
            .from(this.tableName)
            .select("*")
            .order("created_at", { ascending: false });

          if (filters?.storeIds?.length) {
            query = query.in("store_id", filters.storeIds);
          } else if (filters?.storeId != null) {
            query = query.eq("store_id", filters.storeId);
          }
          if (filters?.isSupplierPaid != null) {
            query = query.eq("is_supplier_paid", filters.isSupplierPaid);
          }
          if (filters?.status) {
            query = query.eq("status", filters.status);
          }
          if (filters?.agentId != null) {
            query = query.eq("agent_id", filters.agentId);
          }

          const { data, error } = await query;
          if (error) throw error;
          return { data, error };
        },
        {
          operation: "getAll",
          table: this.tableName,
          metadata: { filters },
        }
      );

      return rows.map(this.mapRowToEntity);
    });
  }

  async getById(id: number): Promise<OrderEntity | null> {
    return withPerformanceTracking("OrderService", "getById", async () => {
      const row = await DatabaseWrapper.executeQuery(
        async () => {
          const { data, error } = await supabase
            .from(this.tableName)
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "getById",
          table: this.tableName,
          metadata: { id },
        }
      );

      if (!row) return null;
      return this.mapRowToEntity(row);
    });
  }

  async getByStatus(status: string, storeId?: number): Promise<OrderEntity[]> {
    return withPerformanceTracking("OrderService", "getByStatus", async () => {
      const rows = await DatabaseWrapper.executeQuery(
        async () => {
          let query = supabase
            .from(this.tableName)
            .select("*")
            .eq("status", status)
            .order("created_at", { ascending: false });

          if (storeId != null) {
            query = query.eq("store_id", storeId);
          }

          const { data, error } = await query;
          if (error) throw error;
          return { data, error };
        },
        {
          operation: "getByStatus",
          table: this.tableName,
          metadata: { status, storeId },
        }
      );

      return rows.map(this.mapRowToEntity);
    });
  }

  async search(term: string, storeId?: number): Promise<OrderEntity[]> {
    if (!term.trim()) return [];

    const normalized = term.trim();
    return withPerformanceTracking("OrderService", "search", async () => {
      const rows = await DatabaseWrapper.executeQuery(
        async () => {
          let query = supabase
            .from(this.tableName)
            .select("*")
            .or(
              [
                `first_name.ilike.%${normalized}%`,
                `last_name.ilike.%${normalized}%`,
                `phone.ilike.%${normalized}%`,
                `tracking_id.ilike.%${normalized}%`,
              ].join(",")
            )
            .order("created_at", { ascending: false });

          if (storeId != null) {
            query = query.eq("store_id", storeId);
          }

          const { data, error } = await query;
          if (error) throw error;
          return { data, error };
        },
        {
          operation: "search",
          table: this.tableName,
          metadata: { term: normalized, storeId },
        }
      );

      return rows.map(this.mapRowToEntity);
    });
  }

  async getPaginated(
    filters: OrderFilters,
    pagination: OrderPaginationParams
  ): Promise<PaginatedOrdersResult> {
    return withPerformanceTracking("OrderService", "getPaginated", async () => {
      const page = Math.max(1, pagination.page);
      const limit = Math.max(1, pagination.limit);
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const result = await DatabaseWrapper.executeQuery(
        async () => {
          let query = supabase
            .from(this.tableName)
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(from, to);

          if (filters.storeIds?.length) {
            query = query.in("store_id", filters.storeIds);
          } else if (filters.storeId != null) {
            query = query.eq("store_id", filters.storeId);
          }
          if (filters.isSupplierPaid != null) {
            query = query.eq("is_supplier_paid", filters.isSupplierPaid);
          }
          if (filters.status) {
            query = query.eq("status", filters.status);
          }
          if (filters.agentId != null) {
            query = query.eq("agent_id", filters.agentId);
          }
          if (filters.search?.trim()) {
            const normalized = filters.search.trim();
            query = query.or(
              [
                `first_name.ilike.%${normalized}%`,
                `last_name.ilike.%${normalized}%`,
                `phone.ilike.%${normalized}%`,
                `tracking_id.ilike.%${normalized}%`,
              ].join(",")
            );
          }

          const { data, error, count } = await query;
          if (error) throw error;
          return { data: { rows: data ?? [], total: count ?? 0 }, error };
        },
        {
          operation: "getPaginated",
          table: this.tableName,
          metadata: { filters, pagination },
        }
      );

      return {
        data: await this.attachProductThumbnails(
          result.rows.map(this.mapRowToEntity)
        ),
        total: result.total,
        page,
        limit,
      };
    });
  }

  async create(data: CreateOrderInput): Promise<OrderEntity> {
    return withPerformanceTracking("OrderService", "create", async () => {
      const payload: OrderInsert = this.mapCreateInputToInsert(data);

      const row = await DatabaseWrapper.executeMutation(
        async () => {
          const { data: created, error } = await supabase
            .from(this.tableName)
            .insert(payload)
            .select()
            .single();

          if (error) throw error;
          return { data: created, error };
        },
        {
          operation: "create",
          table: this.tableName,
          metadata: { customer: data.first_name },
          auditLog: {
            enabled: true,
            action: "INSERT",
            newValues: payload,
          },
        }
      );

      return this.mapRowToEntity(row);
    });
  }

  async update(id: number, data: UpdateOrderInput): Promise<OrderEntity> {
    return withPerformanceTracking("OrderService", "update", async () => {
      const payload: OrderUpdate = {
        ...this.mapUpdateInputToUpdate(data),
        modified_at: new Date().toISOString(),
      };

      const row = await DatabaseWrapper.executeMutation(
        async () => {
          const { data: updated, error } = await supabase
            .from(this.tableName)
            .update(payload)
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;
          return { data: updated, error };
        },
        {
          operation: "update",
          table: this.tableName,
          metadata: { id },
          auditLog: {
            enabled: true,
            action: "UPDATE",
            recordId: id,
            newValues: payload,
          },
        }
      );

      return this.mapRowToEntity(row);
    });
  }

  async delete(id: number): Promise<void> {
    return withPerformanceTracking("OrderService", "delete", async () => {
      await DatabaseWrapper.executeMutation(
        async () => {
          const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq("id", id);

          if (error) throw error;
          return { data: { id }, error };
        },
        {
          operation: "delete",
          table: this.tableName,
          metadata: { id },
          auditLog: {
            enabled: true,
            action: "DELETE",
            recordId: id,
          },
        }
      );
    });
  }

  async getWithItems(id: number): Promise<OrderWithItems | null> {
    return withPerformanceTracking("OrderService", "getWithItems", async () => {
      const row = await DatabaseWrapper.executeQuery(
        async () => {
          const { data, error } = await supabase
            .from(this.tableName)
            .select(
              `
                  *,
                  order_item (
                    item_id,
                    order_id,
                    qty,
                    items (*)
                  )
                `
            )
            .eq("id", id)
            .maybeSingle<OrderRow & { order_item?: OrderItemRow[] | null }>();

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "getWithItems",
          table: this.tableName,
          metadata: { id },
        }
      );

      if (!row) return null;

      const order = this.mapRowToEntity(row);
      const items = (row.order_item ?? []).map(this.mapOrderItemRowToEntity);

      return { order, items };
    });
  }

  async getSummary(storeId?: number, storeIds?: number[]): Promise<OrderSummary> {
    return withPerformanceTracking("OrderService", "getSummary", async () => {
      const rows = await DatabaseWrapper.executeQuery(
        async () => {
          let query = supabase
            .from(this.tableName)
            .select("status, product_price, product_qty");

          if (storeIds?.length) {
            query = query.in("store_id", storeIds);
          } else if (storeId != null) {
            query = query.eq("store_id", storeId);
          }

          const { data, error } = await query;
          if (error) throw error;
          return { data, error };
        },
        {
          operation: "getSummary",
          table: this.tableName,
          metadata: { storeId, storeIds },
        }
      );

      const initial = {
        total_orders: 0,
        total_processing: 0,
        total_delivered: 0,
        total_value: 0,
      };

      return rows.reduce<OrderSummary>((acc, row) => {
        acc.total_orders += 1;
        if (row.status === "processing") acc.total_processing += 1;
        if (row.status === "delivered") acc.total_delivered += 1;

        const lineValue = (row.product_price ?? 0) * (row.product_qty ?? 0);
        acc.total_value += lineValue;
        return acc;
      }, initial);
    });
  }

  async getDailyMetrics(
    fromDate: string,
    toDate: string,
    storeId?: number,
    storeIds?: number[]
  ): Promise<{ date: string; sales: number; orders: number }[]> {
    return withPerformanceTracking("OrderService", "getDailyMetrics", async () => {
      const rows = await DatabaseWrapper.executeQuery(
        async () => {
          let query = supabase
            .from(this.tableName)
            .select("created_at, product_price, product_qty")
            .gte("created_at", `${fromDate}T00:00:00`)
            .lte("created_at", `${toDate}T23:59:59.999`);

          if (storeIds?.length) {
            query = query.in("store_id", storeIds);
          } else if (storeId != null) {
            query = query.eq("store_id", storeId);
          }

          const { data, error } = await query;
          if (error) throw error;
          return { data, error };
        },
        {
          operation: "getDailyMetrics",
          table: this.tableName,
          metadata: { fromDate, toDate, storeId, storeIds },
        }
      );

      const metricsByDate = new Map<string, { sales: number; orders: number }>();

      for (const row of rows) {
        if (!row.created_at) continue;
        const date = row.created_at.slice(0, 10);
        const current = metricsByDate.get(date) ?? { sales: 0, orders: 0 };
        current.orders += 1;
        current.sales += (row.product_price ?? 0) * (row.product_qty ?? 0);
        metricsByDate.set(date, current);
      }

      const days = eachDayOfInterval({
        start: parseISO(fromDate),
        end: parseISO(toDate),
      });

      return days.map((day) => {
        const date = format(day, "yyyy-MM-dd");
        const metrics = metricsByDate.get(date) ?? { sales: 0, orders: 0 };
        return { date, ...metrics };
      });
    });
  }

  async getPendingFulfillmentCount(
    storeId?: number,
    storeIds?: number[]
  ): Promise<number> {
    return withPerformanceTracking(
      "OrderService",
      "getPendingFulfillmentCount",
      async () => {
        const count = await DatabaseWrapper.executeQuery(
          async () => {
            let query = supabase
              .from(this.tableName)
              .select("id", { count: "exact", head: true })
              .in("status", ["initial", "processing"]);

            if (storeIds?.length) {
              query = query.in("store_id", storeIds);
            } else if (storeId != null) {
              query = query.eq("store_id", storeId);
            }

            const { count: rowCount, error } = await query;
            if (error) throw error;
            return { data: rowCount, error };
          },
          {
            operation: "getPendingFulfillmentCount",
            table: this.tableName,
            metadata: { storeId, storeIds },
          }
        );

        return count ?? 0;
      }
    );
  }

  private mapRowToEntity = (row: OrderRow): OrderEntity => ({
    id: row.id,
    status: row.status ?? undefined,
    first_name: row.first_name ?? undefined,
    last_name: row.last_name ?? undefined,
    phone: row.phone ?? undefined,
    phone2: row.phone2 ?? undefined,
    address: row.address ?? undefined,
    commune: row.commune ?? undefined,
    wilaya: row.wilaya ?? undefined,
    channel: row.channel ?? undefined,
    comment: row.comment ?? undefined,
    objective: row.objective ?? undefined,
    delivery_company: row.delivery_company ?? undefined,
    delivery_fees: row.delivery_fees ?? undefined,
    delivery_notes: row.delivery_notes ?? undefined,
    delivery_attempt: row.delivery_attempt ?? undefined,
    tracking_id: row.tracking_id ?? undefined,
    tracker_id: row.tracker_id ?? undefined,
    dc_recent_status: row.dc_recent_status ?? undefined,
    yalidine_status: row.yalidine_status ?? undefined,
    agent_id: row.agent_id ?? undefined,
    partner_id: row.partner_id ?? undefined,
    store_id: row.store_id ?? undefined,
    is_supplier_paid: Boolean(row.is_supplier_paid),
    product: row.product ?? undefined,
    product_color: row.product_color ?? undefined,
    product_size: row.product_size ?? undefined,
    product_price: row.product_price ?? undefined,
    product_qty: row.product_qty ?? 0,
    shipping_price: row.shipping_price ?? undefined,
    is_auto_delivered: Boolean(row.is_auto_delivered),
    is_exchange_required: Boolean(row.is_exchange_required),
    is_exchange: row.is_exchange ?? undefined,
    has_exchange: row.has_exchange ?? undefined,
    has_defect: Boolean(row.has_defect),
    is_free_shipping: row.is_free_shipping ?? undefined,
    is_stopdesk: row.is_stopdesk ?? undefined,
    is_wholesale: row.is_wholesale ?? undefined,
    return_processed: Boolean(row.return_processed),
    stopdesk: row.stopdesk ?? undefined,
    created_at: row.created_at ?? undefined,
    modified_at: row.modified_at ?? undefined,
  });

  private attachProductThumbnails = async (
    orders: OrderEntity[]
  ): Promise<OrderEntity[]> => {
    if (orders.length === 0) return orders;

    const orderIds = orders.map((order) => order.id);
    const thumbnailByOrderId = new Map<number, string>();

    const rows = await DatabaseWrapper.executeQuery(
      async () => {
        const { data, error } = await supabase
          .from("order_item")
          .select("order_id, items(thumbnail)")
          .in("order_id", orderIds);

        if (error) throw error;
        return { data, error };
      },
      {
        operation: "attachProductThumbnails",
        table: "order_item",
        metadata: { orderIds },
      }
    );

    for (const row of rows ?? []) {
      if (thumbnailByOrderId.has(row.order_id)) continue;
      const thumbnail = row.items?.thumbnail;
      if (thumbnail) {
        thumbnailByOrderId.set(row.order_id, thumbnail);
      }
    }

    return orders.map((order) => ({
      ...order,
      product_thumbnail: thumbnailByOrderId.get(order.id),
    }));
  };

  private mapOrderItemRowToEntity = (row: OrderItemRow): OrderItemEntity => ({
    order_id: row.order_id,
    item_id: row.item_id,
    qty: row.qty ?? undefined,
    unit_supplier_price: row.unit_supplier_price ?? undefined,
    item: row.items
      ? {
          id: row.items.id,
          product_id: row.items.product_id ?? undefined,
          product: row.items.product ?? undefined,
          color: row.items.color ?? undefined,
          colorHex:
            (row.items as Tables["items"]["Row"] & { color_hex?: string })
              .color_hex ?? undefined,
          size: row.items.size ?? undefined,
          thumbnail: row.items.thumbnail ?? undefined,
          cog: row.items.cog ?? undefined,
        }
      : undefined,
  });

  private mapCreateInputToInsert = (data: CreateOrderInput): OrderInsert => ({
    address: data.address ?? null,
    agent_id: data.agent_id ?? null,
    channel: data.channel ?? null,
    comment: data.comment ?? null,
    commune: data.commune ?? null,
    dc_recent_status: data.dc_recent_status ?? null,
    delivery_attempt: data.delivery_attempt ?? null,
    delivery_company: data.delivery_company ?? null,
    delivery_fees: data.delivery_fees ?? null,
    delivery_notes: data.delivery_notes ?? null,
    first_name: data.first_name ?? null,
    has_defect: data.has_defect ?? false,
    has_exchange: data.has_exchange ?? null,
    is_auto_delivered: data.is_auto_delivered ?? false,
    is_exchange: data.is_exchange ?? null,
    is_exchange_required: data.is_exchange_required ?? false,
    is_free_shipping: data.is_free_shipping ?? null,
    is_stopdesk: data.is_stopdesk ?? null,
    is_wholesale: data.is_wholesale ?? null,
    last_name: data.last_name ?? null,
    objective: data.objective ?? null,
    partner_id: data.partner_id ?? null,
    store_id: data.store_id ?? null,
    is_supplier_paid: data.is_supplier_paid ?? false,
    phone: data.phone ?? null,
    phone2: data.phone2 ?? null,
    product: data.product ?? null,
    product_color: data.product_color ?? null,
    product_price: data.product_price ?? null,
    product_qty: data.product_qty,
    product_size: data.product_size ?? null,
    return_processed: data.return_processed ?? false,
    shipping_price: data.shipping_price ?? null,
    status: data.status ?? null,
    stopdesk: data.stopdesk ?? null,
    tracker_id: data.tracker_id ?? null,
    tracking_id: data.tracking_id ?? null,
    wilaya: data.wilaya ?? null,
    yalidine_status: data.yalidine_status ?? null,
  });

  private mapUpdateInputToUpdate = (data: UpdateOrderInput): OrderUpdate => ({
    address: data.address ?? undefined,
    agent_id: data.agent_id ?? undefined,
    channel: data.channel ?? undefined,
    comment: data.comment ?? undefined,
    commune: data.commune ?? undefined,
    created_at: data.created_at ?? undefined,
    dc_recent_status: data.dc_recent_status ?? undefined,
    delivery_attempt: data.delivery_attempt ?? undefined,
    delivery_company: data.delivery_company ?? undefined,
    delivery_fees: data.delivery_fees ?? undefined,
    delivery_notes: data.delivery_notes ?? undefined,
    first_name: data.first_name ?? undefined,
    has_defect: data.has_defect ?? undefined,
    has_exchange: data.has_exchange ?? undefined,
    is_auto_delivered: data.is_auto_delivered ?? undefined,
    is_exchange: data.is_exchange ?? undefined,
    is_exchange_required: data.is_exchange_required ?? undefined,
    is_free_shipping: data.is_free_shipping ?? undefined,
    is_stopdesk: data.is_stopdesk ?? undefined,
    is_wholesale: data.is_wholesale ?? undefined,
    last_name: data.last_name ?? undefined,
    objective: data.objective ?? undefined,
    partner_id: data.partner_id ?? undefined,
    store_id: data.store_id ?? undefined,
    is_supplier_paid: data.is_supplier_paid ?? undefined,
    phone: data.phone ?? undefined,
    phone2: data.phone2 ?? undefined,
    product: data.product ?? undefined,
    product_color: data.product_color ?? undefined,
    product_price: data.product_price ?? undefined,
    product_qty: data.product_qty ?? undefined,
    product_size: data.product_size ?? undefined,
    return_processed: data.return_processed ?? undefined,
    shipping_price: data.shipping_price ?? undefined,
    status: data.status ?? undefined,
    stopdesk: data.stopdesk ?? undefined,
    tracker_id: data.tracker_id ?? undefined,
    tracking_id: data.tracking_id ?? undefined,
    wilaya: data.wilaya ?? undefined,
    yalidine_status: data.yalidine_status ?? undefined,
  });
}
