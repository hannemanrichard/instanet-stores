import { NextRequest, NextResponse } from "next/server";
import { orderApplicationService } from "@/features/orders/application/services/orderApplicationService";
import { OrderError } from "@/features/orders/domain";
import type { UpdateOrderItemInput } from "@/features/orders/domain";
import {
  requireAdminActor,
  requireDashboardActor,
} from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";
import { assertStoreAccess } from "@/shared/server/storeAccess";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireDashboardActor();
    const orderId = Number((await context.params).id);
    if (!orderId || Number.isNaN(orderId)) {
      throw new OrderError("Valid order id is required", "ORDER_INVALID_ID");
    }

    const detail = await orderApplicationService.getOrderDetail(orderId);
    assertStoreAccess(actor, detail.order.store_id);

    const items = await orderApplicationService.getOrderItems(orderId);
    return NextResponse.json({ items });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    const orderId = Number((await context.params).id);
    if (!orderId || Number.isNaN(orderId)) {
      throw new OrderError("Valid order id is required", "ORDER_INVALID_ID");
    }

    const body = (await req.json()) as { items?: UpdateOrderItemInput[] };
    if (!body.items) {
      throw new OrderError("items are required", "ORDER_ITEMS_REQUIRED");
    }

    const items = await orderApplicationService.replaceOrderItems(
      orderId,
      body.items
    );
    return NextResponse.json({ items });
  } catch (error) {
    return jsonError(error);
  }
}
