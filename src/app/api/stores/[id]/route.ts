import { NextRequest, NextResponse } from "next/server";
import { storeApplicationService } from "@/features/stores/application/services/storeApplicationService";
import { requireAdminActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";
import { StoreError } from "@/features/stores/domain";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    const { id } = await context.params;
    const storeId = Number(id);
    if (!storeId || Number.isNaN(storeId)) {
      throw new StoreError("Invalid store id", "STORE_ID_INVALID");
    }

    const body = (await req.json()) as { status?: string };
    if (!body.status?.trim()) {
      throw new StoreError("Status is required", "STORE_STATUS_REQUIRED");
    }

    const store = await storeApplicationService.updateStatus(
      storeId,
      body.status.trim()
    );
    return NextResponse.json({ store });
  } catch (error) {
    return jsonError(error);
  }
}
