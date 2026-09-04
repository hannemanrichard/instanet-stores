import { NextRequest, NextResponse } from "next/server";
import { inventoryApplicationService } from "@/features/inventory/application/services/inventoryApplicationService";
import { requireDashboardActor } from "@/shared/server/requireDashboardActor";
import { resolveScopeStoreIds } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireDashboardActor();
    const storeIdParam = req.nextUrl.searchParams.get("storeId");
    const requestedStoreId = storeIdParam ? Number(storeIdParam) : null;
    const storeIds = resolveScopeStoreIds(actor, requestedStoreId);
    const summary = await inventoryApplicationService.getScopeSummary(storeIds);
    return NextResponse.json({ summary });
  } catch (error) {
    return jsonError(error);
  }
}
