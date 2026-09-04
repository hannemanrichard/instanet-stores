import { NextResponse } from "next/server";
import { leadHopApplicationService } from "@/features/leads/application/services/leadHopApplicationService";
import { LeadHopError } from "@/features/leads/domain";
import { requireAdminActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ leadId: string }> }
) {
  try {
    await requireAdminActor();
    const leadId = Number((await context.params).leadId);
    if (!leadId || Number.isNaN(leadId)) {
      throw new LeadHopError("Valid lead id is required", "LEAD_HOP_INVALID_ID");
    }
    await leadHopApplicationService.deleteLeadHopsByLeadId(leadId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
