import { NextRequest, NextResponse } from "next/server";
import { orderApplicationService } from "@/features/orders/application/services/orderApplicationService";
import type { UpdateOrderPayload } from "@/features/orders/application/services/orderApplicationService";
import { OrderError } from "@/features/orders/domain";
import {
  requireAdminActor,
  requireDashboardActor,
} from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";
import { assertStoreAccess } from "@/shared/server/storeAccess";

const assertOrderAccess = async (
  orderId: number,
  actor: Awaited<ReturnType<typeof requireDashboardActor>>
) => {
  const detail = await orderApplicationService.getOrderDetail(orderId);
  assertStoreAccess(actor, detail.order.store_id);
  return detail;
};

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

    const detail = await assertOrderAccess(orderId, actor);
    return NextResponse.json(detail);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    const orderId = Number((await context.params).id);
    if (!orderId || Number.isNaN(orderId)) {
      throw new OrderError("Valid order id is required", "ORDER_INVALID_ID");
    }

    const body = (await req.json()) as UpdateOrderPayload;
    const detail = await orderApplicationService.updateOrder(orderId, body);
    return NextResponse.json(detail);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    const orderId = Number((await context.params).id);
    if (!orderId || Number.isNaN(orderId)) {
      throw new OrderError("Valid order id is required", "ORDER_INVALID_ID");
    }

    await orderApplicationService.deleteOrder(orderId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
