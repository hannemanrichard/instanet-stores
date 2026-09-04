import type { ReturnEntity } from "./entities";
import { getReturnItemCount, getReturnItems, itemsFromOrders } from "./returnItems";

const sampleReturn: ReturnEntity = {
  id: 801,
  code: "RET-4XEE9K",
  store_id: 1,
  status: "processed",
  created_at: "2026-08-30T10:00:00.000Z",
  modified_at: "2026-08-30T10:00:00.000Z",
  order_ids: [10432, 10433],
  orders: [
    { id: 10432, product: "Linen Abaya", product_qty: 1 },
    { id: 10433, product: "Silk Hijab Set", product_qty: 2 },
  ],
  items: [
    {
      order_id: 10432,
      item_id: 201,
      product: "Linen Abaya",
      color: "Sand",
      size: "M",
      qty: 1,
    },
    {
      order_id: 10433,
      item_id: 103,
      product: "Silk Hijab Set",
      color: "Rose",
      size: "One Size",
      qty: 2,
    },
  ],
};

describe("return items", () => {
  it("sums quantities from order_item lines", () => {
    expect(getReturnItemCount(sampleReturn)).toBe(3);
    expect(getReturnItems(sampleReturn)).toHaveLength(2);
  });

  it("falls back to linked orders when item lines are missing", () => {
    const withoutItems: ReturnEntity = { ...sampleReturn, items: undefined };
    expect(getReturnItems(withoutItems)).toEqual(itemsFromOrders(withoutItems.orders));
    expect(getReturnItemCount(withoutItems)).toBe(3);
  });
});
