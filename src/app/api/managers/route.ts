import { NextRequest, NextResponse } from "next/server";
import { storeAssignmentApplicationService } from "@/features/stores/application/services/storeManagerApplicationService";
import { requireAdminActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";
import { StoreError } from "@/features/stores/domain";

export async function GET() {
  try {
    await requireAdminActor();
    const managers = await storeAssignmentApplicationService.listManagers();
    return NextResponse.json({ managers });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminActor();
    const body = (await req.json()) as {
      email?: string;
      storeIds?: number[];
    };

    if (!body.email?.trim() || !body.storeIds?.length) {
      throw new StoreError(
        "email and storeIds are required",
        "STORE_MANAGER_REQUIRED"
      );
    }

    const manager = await storeAssignmentApplicationService.assignManager(
      body.email,
      body.storeIds
    );
    return NextResponse.json({ manager }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
