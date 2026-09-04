import { NextRequest, NextResponse } from "next/server";
import { leadHopApplicationService } from "@/features/leads/application/services/leadHopApplicationService";
import type { UpdateLeadHopInput } from "@/features/leads/domain";
import { LeadHopError } from "@/features/leads/domain";
import { requireAdminActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ leadId: string; agentId: string }> }
) {
  try {
    await requireAdminActor();
    const { leadId: leadIdParam, agentId: agentIdParam } = await context.params;
    const leadId = Number(leadIdParam);
    const agentId = Number(agentIdParam);
    if (!leadId || !agentId || Number.isNaN(leadId) || Number.isNaN(agentId)) {
      throw new LeadHopError("Valid ids are required", "LEAD_HOP_INVALID_ID");
    }
    const data = (await req.json()) as UpdateLeadHopInput;
    const hop = await leadHopApplicationService.updateLeadHop(
      leadId,
      agentId,
      data
    );
    return NextResponse.json({ hop });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ leadId: string; agentId: string }> }
) {
  try {
    await requireAdminActor();
    const { leadId: leadIdParam, agentId: agentIdParam } = await context.params;
    const leadId = Number(leadIdParam);
    const agentId = Number(agentIdParam);
    if (!leadId || !agentId || Number.isNaN(leadId) || Number.isNaN(agentId)) {
      throw new LeadHopError("Valid ids are required", "LEAD_HOP_INVALID_ID");
    }
    await leadHopApplicationService.deleteLeadHop(leadId, agentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
