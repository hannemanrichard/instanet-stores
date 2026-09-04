import type { ReturnEntity, ReturnItemSummary, ReturnOrderSummary } from "./entities";

export const itemsFromOrders = (
  orders: ReturnOrderSummary[] = []
): ReturnItemSummary[] =>
  orders.map((order) => ({
    order_id: order.id,
    item_id: order.id,
    product: order.product,
    qty: order.product_qty ?? 0,
  }));

export const getReturnItems = (item: ReturnEntity): ReturnItemSummary[] => {
  if (item.items && item.items.length > 0) return item.items;
  return itemsFromOrders(item.orders);
};

export const getReturnItemCount = (item: ReturnEntity): number =>
  getReturnItems(item).reduce((sum, line) => sum + (line.qty || 0), 0);
