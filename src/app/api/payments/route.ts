import { NextRequest, NextResponse } from "next/server";
import { paymentsApplicationService } from "@/features/payments/application/services/paymentsApplicationService";
import {
  requireDashboardActor,
  requireStoreOpsActor,
} from "@/shared/server/requireDashboardActor";
import { assertStoreAccess, resolveScopeStoreIds } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";
import { PaymentsError } from "@/features/payments/domain";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireDashboardActor();
    const storeIdParam = req.nextUrl.searchParams.get("storeId");
    const requestedStoreId = storeIdParam ? Number(storeIdParam) : null;
    const storeIds = resolveScopeStoreIds(actor, requestedStoreId);

    const summary = await paymentsApplicationService.getSummary(storeIds);
    return NextResponse.json(summary);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireStoreOpsActor();
    const body = (await req.json()) as {
      store_id?: number;
      order_ids?: number[];
      note?: string;
    };

    if (!body.store_id || !body.order_ids?.length) {
      throw new PaymentsError(
        "store_id and order_ids are required",
        "PAYMENTS_ORDERS_REQUIRED"
      );
    }

    assertStoreAccess(actor, body.store_id);

    const payment = await paymentsApplicationService.createPayment({
      store_id: body.store_id,
      order_ids: body.order_ids,
      note: body.note,
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
