import { NextRequest, NextResponse } from "next/server";
import { returnsApplicationService } from "@/features/returns/application/services/returnsApplicationService";
import { requireDashboardActor, requireStoreOpsActor } from "@/shared/server/requireDashboardActor";
import { assertStoreAccess, resolveScopeStoreIds } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";
import { ReturnsError } from "@/features/returns/domain";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireDashboardActor();
    const storeIdParam = req.nextUrl.searchParams.get("storeId");
    const requestedStoreId = storeIdParam ? Number(storeIdParam) : null;
    const storeIds = resolveScopeStoreIds(actor, requestedStoreId);

    const returns = await returnsApplicationService.getByStoreIds(storeIds);
    return NextResponse.json({ returns });
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
    };

    if (!body.store_id || !body.order_ids?.length) {
      throw new ReturnsError(
        "store_id and order_ids are required",
        "RETURNS_ORDERS_REQUIRED"
      );
    }

    assertStoreAccess(actor, body.store_id);

    const created = await returnsApplicationService.createReturn({
      store_id: body.store_id,
      order_ids: body.order_ids,
    });

    return NextResponse.json({ return: created }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
