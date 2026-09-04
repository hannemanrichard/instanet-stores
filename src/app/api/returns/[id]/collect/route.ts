import { NextRequest, NextResponse } from "next/server";
import { returnsApplicationService } from "@/features/returns/application/services/returnsApplicationService";
import { requireStoreOpsActor } from "@/shared/server/requireDashboardActor";
import { assertStoreAccess } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";
import { ReturnsError } from "@/features/returns/domain";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireStoreOpsActor();
    const returnId = Number((await context.params).id);
    if (!returnId || Number.isNaN(returnId)) {
      throw new ReturnsError("Return id is required", "RETURNS_ID_REQUIRED");
    }

    const existing = await returnsApplicationService.getById(returnId);
    if (!existing) {
      throw new ReturnsError("Return not found", "RETURNS_NOT_FOUND");
    }
    assertStoreAccess(actor, existing.store_id);

    const updated = await returnsApplicationService.markCollected(returnId);
    return NextResponse.json({ return: updated });
  } catch (error) {
    return jsonError(error);
  }
}
