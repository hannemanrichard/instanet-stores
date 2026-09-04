import { supabaseServer as supabase } from "@/infrastructure/supabase/server";
import type { Database } from "@/infrastructure/supabase/types";
import { DatabaseWrapper } from "@/shared/utils/databaseWrapper";
import { withPerformanceTracking } from "@/shared/utils/performanceMonitor";
import type {
  CreatePaymentInput,
  NotReadyPaymentOrder,
  PaymentEntity,
  PaymentOrderSummary,
  PaymentsSummary,
} from "../domain";
import { generatePaymentCode } from "../domain/paymentCode";

type Tables = Database["public"]["Tables"];
type PaymentRow = Tables["payments"]["Row"];
type OrderRow = Tables["orders"]["Row"];
type OrderItemRow = Tables["order_item"]["Row"];

const orderSupplierAmount = (
  items: OrderItemRow[],
  fallbackQty: number
): number => {
  if (!items.length) return 0;
  return items.reduce((sum, item) => {
    const qty = item.qty ?? fallbackQty ?? 1;
    const unit = item.unit_supplier_price ?? 0;
    return sum + unit * qty;
  }, 0);
};

export class SupabasePaymentsService implements PaymentsRepository {
  private readonly tableName = "payments";
  private readonly junctionTable = "payment_orders";

  async getNotReadyOrders(storeIds?: number[]): Promise<NotReadyPaymentOrder[]> {
    return withPerformanceTracking(
      "PaymentsService",
      "getNotReadyOrders",
      async () => {
        if (storeIds && storeIds.length === 0) return [];

        const orders = await DatabaseWrapper.executeQuery(
          async () => {
            let query = supabase
              .from("orders")
              .select("*")
              .eq("status", "delivered")
              .eq("is_supplier_paid", false)
              .order("created_at", { ascending: false });

            if (storeIds) {
              query = query.in("store_id", storeIds);
            }

            const { data, error } = await query;
            if (error) throw error;
            return { data, error };
          },
          {
            operation: "getNotReadyOrders",
            table: "orders",
            metadata: { storeIds },
          }
        );

        return Promise.all(
          (orders as OrderRow[]).map(async (order) => {
            const items = await this.getOrderItems(order.id);
            return {
              id: order.id,
              store_id: order.store_id ?? undefined,
              product: order.product ?? undefined,
              product_qty: order.product_qty ?? 0,
              amount: orderSupplierAmount(items, order.product_qty ?? 1),
              created_at: order.created_at ?? undefined,
              status: order.status ?? undefined,
            };
          })
        );
      }
    );
  }

  async getByStoreId(storeId: number): Promise<PaymentEntity[]> {
    return this.getByStoreIds([storeId]);
  }

  async getByStoreIds(storeIds?: number[]): Promise<PaymentEntity[]> {
    return withPerformanceTracking("PaymentsService", "getByStoreIds", async () => {
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

      return (rows ?? []).map((row) => this.mapPaymentRow(row));
    });
  }

  async getById(id: number): Promise<PaymentEntity | null> {
    return withPerformanceTracking("PaymentsService", "getById", async () => {
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
      return this.hydratePayment(row);
    });
  }

  async getSummary(storeIds?: number[]): Promise<PaymentsSummary> {
    return withPerformanceTracking("PaymentsService", "getSummary", async () => {
      const [notReadyOrders, payments] = await Promise.all([
        this.getNotReadyOrders(storeIds),
        this.getByStoreIds(storeIds),
      ]);

      const readyPayments = payments.filter((payment) => !payment.is_paid);
      const paidPayments = payments.filter((payment) => payment.is_paid);

      return {
        notReadyTotal: notReadyOrders.reduce((sum, order) => sum + order.amount, 0),
        readyTotal: readyPayments.reduce((sum, payment) => sum + payment.amount, 0),
        paidTotal: paidPayments.reduce((sum, payment) => sum + payment.amount, 0),
        notReadyOrders,
        readyPayments,
        paidPayments,
      };
    });
  }

  async create(input: CreatePaymentInput): Promise<PaymentEntity> {
    return withPerformanceTracking("PaymentsService", "create", async () => {
      const notReady = await this.getNotReadyOrders([input.store_id]);
      const byId = new Map(notReady.map((order) => [order.id, order]));

      const selected = input.order_ids.map((id) => {
        const order = byId.get(id);
        if (!order) {
          throw new Error(`Order ${id} is not eligible for payment`);
        }
        return order;
      });

      const amount = selected.reduce((sum, order) => sum + order.amount, 0);

      const code = generatePaymentCode();

      const paymentRow = await DatabaseWrapper.executeMutation(
        async () => {
          const { data, error } = await supabase
            .from(this.tableName)
            .insert({
              store_id: input.store_id,
              amount,
              is_paid: false,
              note: input.note ?? null,
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
          metadata: { storeId: input.store_id },
          auditLog: { enabled: true, action: "INSERT" },
        }
      );

      await DatabaseWrapper.executeMutation(
        async () => {
          const { data, error } = await supabase
            .from(this.junctionTable)
            .insert(
              selected.map((order) => ({
                payment_id: paymentRow.id,
                order_id: order.id,
                amount: order.amount,
              }))
            )
            .select();

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "create.payment_orders",
          table: this.junctionTable,
          metadata: { paymentId: paymentRow.id },
          auditLog: { enabled: true, action: "INSERT" },
        }
      );

      await DatabaseWrapper.executeMutation(
        async () => {
          const { data, error } = await supabase
            .from("orders")
            .update({ is_supplier_paid: true })
            .in(
              "id",
              selected.map((order) => order.id)
            )
            .select("id");

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "create.markOrdersPaid",
          table: "orders",
          metadata: { paymentId: paymentRow.id },
          auditLog: { enabled: true, action: "UPDATE" },
        }
      );

      return this.mapPaymentRow(paymentRow);
    });
  }

  async markPaid(paymentId: number): Promise<PaymentEntity> {
    return withPerformanceTracking("PaymentsService", "markPaid", async () => {
      const row = await DatabaseWrapper.executeMutation(
        async () => {
          const { data, error } = await supabase
            .from(this.tableName)
            .update({
              is_paid: true,
              paid_at: new Date().toISOString(),
            })
            .eq("id", paymentId)
            .select()
            .single();

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "markPaid",
          table: this.tableName,
          metadata: { paymentId },
          auditLog: { enabled: true, action: "UPDATE", recordId: paymentId },
        }
      );

      return this.mapPaymentRow(row);
    });
  }

  private async getOrderItems(orderId: number): Promise<OrderItemRow[]> {
    const rows = await DatabaseWrapper.executeQuery(
      async () => {
        const { data, error } = await supabase
          .from("order_item")
          .select("*")
          .eq("order_id", orderId);

        if (error) throw error;
        return { data, error };
      },
      {
        operation: "getOrderItems",
        table: "order_item",
        metadata: { orderId },
      }
    );

    return rows as OrderItemRow[];
  }

  private mapPaymentRow = (row: PaymentRow): PaymentEntity => ({
    id: row.id,
    code: row.code,
    store_id: row.store_id,
    amount: Number(row.amount) || 0,
    is_paid: Boolean(row.is_paid),
    note: row.note ?? undefined,
    created_at: row.created_at,
    paid_at: row.paid_at ?? undefined,
  });

  private async hydratePayment(row: PaymentRow): Promise<PaymentEntity> {
    const links = await DatabaseWrapper.executeQuery(
      async () => {
        const { data, error } = await supabase
          .from(this.junctionTable)
          .select("*")
          .eq("payment_id", row.id);

        if (error) throw error;
        return { data, error };
      },
      {
        operation: "hydratePayment.links",
        table: this.junctionTable,
        metadata: { paymentId: row.id },
      }
    );

    const orderIds = (links ?? []).map(
      (link: { order_id: number }) => link.order_id
    );

    let orderMap = new Map<number, OrderRow>();
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
          operation: "hydratePayment.orders",
          table: "orders",
          metadata: { paymentId: row.id },
        }
      );

      orderMap = new Map(
        (orderRows as OrderRow[]).map((order) => [order.id, order])
      );
    }

    const orders: PaymentOrderSummary[] = (links ?? []).map(
      (link: { order_id: number; amount: number }) => {
        const order = orderMap.get(link.order_id);
        return {
          order_id: link.order_id,
          amount: Number(link.amount) || 0,
          product: order?.product ?? undefined,
          product_qty: order?.product_qty ?? undefined,
          created_at: order?.created_at ?? undefined,
        };
      }
    );

    return {
      ...this.mapPaymentRow(row),
      orders,
    };
  }
}
