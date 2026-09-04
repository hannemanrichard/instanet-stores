import { supabaseServer as supabase } from "@/infrastructure/supabase/server";
import type { Database } from "@/infrastructure/supabase/types";
import { DatabaseWrapper } from "@/shared/utils/databaseWrapper";
import { withPerformanceTracking } from "@/shared/utils/performanceMonitor";
import type {
  CreateReturnInput,
  EligibleReturnOrder,
  ReturnEntity,
  ReturnItemSummary,
  ReturnOrderSummary,
  ReturnStatus,
} from "../domain";
import { generateReturnCode } from "../domain/returnCode";
import type { ReturnsRepository } from "../domain/repositories";

type Tables = Database["public"]["Tables"];
type ReturnRow = Tables["returns"]["Row"];
type OrderRow = Tables["orders"]["Row"];
type OrderItemRow = Tables["order_item"]["Row"];
type ItemRow = Tables["items"]["Row"];

type OrderItemWithDetails = OrderItemRow & {
  items?: ItemRow | null;
};

const mapOrderToSummary = (order: OrderRow): ReturnOrderSummary => ({
  id: order.id,
  status: order.status ?? undefined,
  product: order.product ?? undefined,
  product_qty: order.product_qty ?? 0,
  tracking_id: order.tracking_id ?? undefined,
  yalidine_status: order.yalidine_status ?? undefined,
  dc_recent_status: order.dc_recent_status ?? undefined,
  created_at: order.created_at ?? undefined,
});

const mapOrderItemToSummary = (row: OrderItemWithDetails): ReturnItemSummary => ({
  order_id: row.order_id,
  item_id: row.item_id,
  product: row.items?.product ?? undefined,
  color: row.items?.color ?? undefined,
  colorHex: row.items?.color_hex ?? undefined,
  size: row.items?.size ?? undefined,
  qty: row.qty ?? 0,
});

const itemsFromOrderRows = (orders: OrderRow[]): ReturnItemSummary[] =>
  orders.map((order) => ({
    order_id: order.id,
    item_id: order.id,
    product: order.product ?? undefined,
    color: order.product_color ?? undefined,
    size: order.product_size ?? undefined,
    qty: order.product_qty ?? 0,
  }));

const isEligibleReturnOrder = (order: OrderRow): boolean => {
  if ((order.status ?? "").toLowerCase() !== "returned") return false;

  const yalidine = (order.yalidine_status ?? "").trim();
  const dc = (order.dc_recent_status ?? "").trim().toLowerCase();

  if (yalidine === "Retour à retirer") return true;
  if (!dc.startsWith("recupere_par_fournisseur")) return true;
  return false;
};

export class SupabaseReturnsService implements ReturnsRepository {
  private readonly tableName = "returns";
  private readonly junctionTable = "return_orders";

  async getByStoreId(storeId: number): Promise<ReturnEntity[]> {
    return this.getByStoreIds([storeId]);
  }

  async getByStoreIds(storeIds?: number[]): Promise<ReturnEntity[]> {
    return withPerformanceTracking("ReturnsService", "getByStoreIds", async () => {
      if (storeIds && storeIds.length === 0) return [];

      const rows = await DatabaseWrapper.executeQuery(
        async () => {
          let query = supabase
            .from(this.tableName)
            .select("*")
            .order("created_at", { ascending: false });

          if (storeIds) {
            query = query.in("store_id", storeIds);
          }

          const { data, error } = await query;
          if (error) throw error;
          return { data, error };
        },
        {
          operation: "getByStoreIds",
          table: this.tableName,
          metadata: { storeIds },
        }
      );

      return (rows ?? []).map((row) => this.mapReturnRow(row));
    });
  }

  async getById(id: number): Promise<ReturnEntity | null> {
    return withPerformanceTracking("ReturnsService", "getById", async () => {
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
      return this.hydrateReturn(row);
    });
  }

  async getEligibleOrders(storeId: number): Promise<EligibleReturnOrder[]> {
    return withPerformanceTracking(
      "ReturnsService",
      "getEligibleOrders",
      async () => {
        const linked = await DatabaseWrapper.executeQuery(
          async () => {
            const { data, error } = await supabase
              .from(this.junctionTable)
              .select("order_id");

            if (error) throw error;
            return { data, error };
          },
          {
            operation: "getEligibleOrders.linked",
            table: this.junctionTable,
          }
        );

        const linkedIds = new Set(
          (linked ?? []).map((row: { order_id: number }) => row.order_id)
        );

        const orders = await DatabaseWrapper.executeQuery(
          async () => {
            const { data, error } = await supabase
              .from("orders")
              .select("*")
              .eq("store_id", storeId)
              .eq("status", "returned")
              .order("created_at", { ascending: false });

            if (error) throw error;
            return { data, error };
          },
          {
            operation: "getEligibleOrders.orders",
            table: "orders",
            metadata: { storeId },
          }
        );

        return (orders as OrderRow[])
          .filter((order) => !linkedIds.has(order.id))
          .filter(isEligibleReturnOrder)
          .map((order) => ({
            id: order.id,
            store_id: order.store_id ?? undefined,
            status: order.status ?? undefined,
            product: order.product ?? undefined,
            product_qty: order.product_qty ?? 0,
            tracking_id: order.tracking_id ?? undefined,
            yalidine_status: order.yalidine_status ?? undefined,
            dc_recent_status: order.dc_recent_status ?? undefined,
            created_at: order.created_at ?? undefined,
          }));
      }
    );
  }

  async create(input: CreateReturnInput): Promise<ReturnEntity> {
    return withPerformanceTracking("ReturnsService", "create", async () => {
      const code = generateReturnCode();

      const returnRow = await DatabaseWrapper.executeMutation(
        async () => {
          const { data, error } = await supabase
            .from(this.tableName)
            .insert({
              store_id: input.store_id,
              status: "processed",
              code,
            })
            .select()
            .single();

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "create",
          table: this.tableName,
          metadata: { storeId: input.store_id, code },
          auditLog: { enabled: true, action: "INSERT" },
        }
      );

      await DatabaseWrapper.executeMutation(
        async () => {
          const { data, error } = await supabase
            .from(this.junctionTable)
            .insert(
              input.order_ids.map((orderId) => ({
                return_id: returnRow.id,
                order_id: orderId,
              }))
            )
            .select();

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "create.return_orders",
          table: this.junctionTable,
          metadata: { returnId: returnRow.id, count: input.order_ids.length },
          auditLog: { enabled: true, action: "INSERT" },
        }
      );

      return this.mapReturnRow(returnRow);
    });
  }

  async updateStatus(id: number, status: ReturnStatus): Promise<ReturnEntity> {
    return withPerformanceTracking("ReturnsService", "updateStatus", async () => {
      const row = await DatabaseWrapper.executeMutation(
        async () => {
          const { data, error } = await supabase
            .from(this.tableName)
            .update({
              status,
              modified_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "updateStatus",
          table: this.tableName,
          metadata: { id, status },
          auditLog: { enabled: true, action: "UPDATE", recordId: id },
        }
      );

      return this.mapReturnRow(row);
    });
  }

  private mapReturnRow = (row: ReturnRow): ReturnEntity => ({
    id: row.id,
    code: row.code,
    store_id: row.store_id,
    status: row.status as ReturnStatus,
    created_at: row.created_at,
    modified_at: row.modified_at,
  });

  private async hydrateReturn(row: ReturnRow): Promise<ReturnEntity> {
    const links = await DatabaseWrapper.executeQuery(
      async () => {
        const { data, error } = await supabase
          .from(this.junctionTable)
          .select("order_id")
          .eq("return_id", row.id);

        if (error) throw error;
        return { data, error };
      },
      {
        operation: "hydrateReturn.links",
        table: this.junctionTable,
        metadata: { returnId: row.id },
      }
    );

    const orderIds = (links ?? []).map(
      (link: { order_id: number }) => link.order_id
    );

    let orders: ReturnOrderSummary[] = [];
    let items: ReturnItemSummary[] = [];
    if (orderIds.length) {
      const orderRows = await DatabaseWrapper.executeQuery(
        async () => {
          const { data, error } = await supabase
            .from("orders")
            .select("*")
            .in("id", orderIds);

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "hydrateReturn.orders",
          table: "orders",
          metadata: { returnId: row.id },
        }
      );

      const typedOrders = (orderRows ?? []) as OrderRow[];
      orders = typedOrders.map(mapOrderToSummary);

      const itemRows = await DatabaseWrapper.executeQuery(
        async () => {
          const { data, error } = await supabase
            .from("order_item")
            .select(
              `
                *,
                items (*)
              `
            )
            .in("order_id", orderIds);

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "hydrateReturn.items",
          table: "order_item",
          metadata: { returnId: row.id },
        }
      );

      const typedItems = (itemRows ?? []) as OrderItemWithDetails[];
      if (typedItems.length) {
        items = typedItems.map(mapOrderItemToSummary);
        const coveredOrderIds = new Set(items.map((line) => line.order_id));
        const missingOrders = typedOrders.filter(
          (order) => !coveredOrderIds.has(order.id)
        );
        items = [...items, ...itemsFromOrderRows(missingOrders)];
      } else {
        items = itemsFromOrderRows(typedOrders);
      }
    }

    return {
      ...this.mapReturnRow(row),
      order_ids: orderIds,
      orders,
      items,
    };
  }
}
