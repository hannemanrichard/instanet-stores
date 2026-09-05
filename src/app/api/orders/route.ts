import { NextRequest, NextResponse } from "next/server";
import { orderApplicationService } from "@/features/orders/application/services/orderApplicationService";
import type { CreateOrderPayload } from "@/features/orders/application/services/orderApplicationService";
import type { CreateOrderInput } from "@/features/orders/domain";
import {
  adminCreateOrderBodySchema,
  orderListSearchParamsSchema,
} from "@/features/orders/domain/validations";
import { requireDashboardActor } from "@/shared/server/requireDashboardActor";
import { resolveScopeStoreIds } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";
import { parseJsonBody, parseSearchParams } from "@/shared/server/parseRequest";
import { UnauthorizedError } from "@/shared/server/requireCurrentStore";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireDashboardActor();
    const parsed = parseSearchParams(
      req.nextUrl.searchParams,
      orderListSearchParamsSchema
    );
    const page = parsed.page ?? 1;
    const limit = parsed.limit ?? 10;
    const status = parsed.status;
    const search = parsed.search;
    const requestedStoreId = parsed.storeId ?? null;
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

    const body = await parseJsonBody(req, adminCreateOrderBodySchema);
    const orderFields = { ...body.order };

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
