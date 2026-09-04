import { NextResponse } from "next/server";
import { storeApplicationService } from "@/features/stores/application/services/storeApplicationService";
import { requireDashboardActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";
import { UnauthorizedError } from "@/shared/server/requireCurrentStore";

export async function GET() {
  try {
    const actor = await requireDashboardActor();
    if (actor.role === "store") {
      throw new UnauthorizedError("Admin or stores manager access required");
    }

    const stores =
      actor.role === "admin"
        ? await storeApplicationService.getAll()
        : await storeApplicationService.getByIds(actor.storeIds);

    return NextResponse.json({ stores });
  } catch (error) {
    return jsonError(error);
  }
}
