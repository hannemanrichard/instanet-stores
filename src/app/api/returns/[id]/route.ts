import { NextRequest, NextResponse } from "next/server";
import { returnsApplicationService } from "@/features/returns/application/services/returnsApplicationService";
import { requireDashboardActor } from "@/shared/server/requireDashboardActor";
import { assertStoreAccess } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";
import { ReturnsError } from "@/features/returns/domain";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireDashboardActor();
    const returnId = Number((await context.params).id);
    if (!returnId || Number.isNaN(returnId)) {
      throw new ReturnsError("Return id is required", "RETURNS_ID_REQUIRED");
    }

    const existing = await returnsApplicationService.getById(returnId);
    if (!existing) {
      throw new ReturnsError("Return not found", "RETURNS_NOT_FOUND");
    }
    assertStoreAccess(actor, existing.store_id);

    return NextResponse.json({ return: existing });
  } catch (error) {
    return jsonError(error);
  }
}
