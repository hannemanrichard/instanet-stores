import { NextResponse } from "next/server";
import { leadApplicationService } from "@/features/leads/application/services/leadApplicationService";
import { requireAdminActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";

export async function GET() {
  try {
    await requireAdminActor();
    const summary = await leadApplicationService.getLeadSummary();
    return NextResponse.json(summary);
  } catch (error) {
    return jsonError(error);
  }
}
