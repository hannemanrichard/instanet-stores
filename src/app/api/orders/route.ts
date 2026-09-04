import { NextRequest, NextResponse } from "next/server";
import { orderApplicationService } from "@/features/orders/application/services/orderApplicationService";
import type { CreateOrderPayload } from "@/features/orders/application/services/orderApplicationService";
import type { CreateOrderInput } from "@/features/orders/domain";
import { requireDashboardActor } from "@/shared/server/requireDashboardActor";
import { resolveScopeStoreIds } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";
import { UnauthorizedError } from "@/shared/server/requireCurrentStore";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireDashboardActor();
    const { searchParams } = req.nextUrl;

    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const limit = Math.max(
      1,
      Math.min(100, Number(searchParams.get("limit") ?? "10") || 10)
    );
    const status = searchParams.get("status")?.trim() || undefined;
    const search = searchParams.get("search")?.trim() || undefined;
    const storeIdParam = searchParams.get("storeId");
    const requestedStoreId = storeIdParam ? Number(storeIdParam) : null;
    const storeIds = resolveScopeStoreIds(actor, requestedStoreId);

    const result = await orderApplicationService.getPaginatedOrders(
      {
        storeIds,
        status,
        search,
      },
      { page, limit }
    );

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireDashboardActor();
    if (actor.role !== "admin") {
      throw new UnauthorizedError("Admin access required to create orders");
    }

    const body = (await req.json()) as {
      order?: Partial<CreateOrderInput>;
      items?: CreateOrderPayload["items"];
      productId?: number;
    };

    if (!body.order) {
      return NextResponse.json(
        { error: "Order payload is required" },
        { status: 400 }
      );
    }

    if (!body.productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const orderFields = { ...body.order };
    delete orderFields.store_id;
    delete orderFields.is_supplier_paid;

    const payload: CreateOrderPayload = {
      order: {
        ...(orderFields as CreateOrderInput),
        product_qty: Number(orderFields.product_qty) || 1,
        is_auto_delivered: orderFields.is_auto_delivered ?? false,
        is_exchange_required: orderFields.is_exchange_required ?? false,
        has_defect: orderFields.has_defect ?? false,
        return_processed: orderFields.return_processed ?? false,
        is_supplier_paid: false,
      },
      items: body.items,
      productId: body.productId,
    };

    const result = await orderApplicationService.createOrder(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
