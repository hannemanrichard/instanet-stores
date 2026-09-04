import { NextRequest, NextResponse } from "next/server";
import { storeAssignmentApplicationService } from "@/features/stores/application/services/storeManagerApplicationService";
import { requireAdminActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";
import { StoreError } from "@/features/stores/domain";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ email: string }> }
) {
  try {
    await requireAdminActor();
    const { email } = await context.params;
    const body = (await req.json()) as { storeIds?: number[] };

    if (!body.storeIds?.length) {
      throw new StoreError(
        "At least one store is required",
        "STORE_MANAGER_STORES_REQUIRED"
      );
    }

    const manager = await storeAssignmentApplicationService.updateAssignments(
      decodeURIComponent(email),
      body.storeIds
    );
    return NextResponse.json({ manager });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ email: string }> }
) {
  try {
    await requireAdminActor();
    const { email } = await context.params;
    await storeAssignmentApplicationService.demoteManager(
      decodeURIComponent(email)
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
