import { NextRequest, NextResponse } from "next/server";
import { returnsApplicationService } from "@/features/returns/application/services/returnsApplicationService";
import { requireStoreOpsActor } from "@/shared/server/requireDashboardActor";
import { assertStoreAccess } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";
import { ReturnsError } from "@/features/returns/domain";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireStoreOpsActor();
    const storeId = Number(req.nextUrl.searchParams.get("storeId"));
    if (!storeId || Number.isNaN(storeId)) {
      throw new ReturnsError("storeId is required", "RETURNS_STORE_REQUIRED");
    }

    assertStoreAccess(actor, storeId);

    const orders = await returnsApplicationService.getEligibleOrders(storeId);
    return NextResponse.json({ orders });
  } catch (error) {
    return jsonError(error);
  }
}
