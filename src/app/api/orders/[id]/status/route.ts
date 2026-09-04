import { NextRequest, NextResponse } from "next/server";
import { orderApplicationService } from "@/features/orders/application/services/orderApplicationService";
import { OrderError } from "@/features/orders/domain";
import { requireStoreOpsActor } from "@/shared/server/requireDashboardActor";
import { assertStoreAccess } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireStoreOpsActor();
    const orderId = Number((await context.params).id);
    if (!orderId || Number.isNaN(orderId)) {
      throw new OrderError("Valid order id is required", "ORDER_INVALID_ID");
    }

    const detail = await orderApplicationService.getOrderDetail(orderId);
    assertStoreAccess(actor, detail.order.store_id);

    const body = (await req.json()) as { status?: string };
    if (!body.status?.trim()) {
      throw new OrderError("status is required", "ORDER_STATUS_REQUIRED");
    }

    const order = await orderApplicationService.updateOrderStatus(
      orderId,
      body.status.trim()
    );
    return NextResponse.json({ order });
  } catch (error) {
    return jsonError(error);
  }
}
