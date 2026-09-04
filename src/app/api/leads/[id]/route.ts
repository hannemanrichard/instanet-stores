import { NextRequest, NextResponse } from "next/server";
import { leadApplicationService } from "@/features/leads/application/services/leadApplicationService";
import type { UpdateLeadPayload } from "@/features/leads/application/services/leadApplicationService";
import { LeadError } from "@/features/leads/domain";
import { requireAdminActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    const leadId = Number((await context.params).id);
    if (!leadId || Number.isNaN(leadId)) {
      throw new LeadError("Valid lead id is required", "LEAD_INVALID_ID");
    }
    const detail = await leadApplicationService.getLeadDetail(leadId);
    return NextResponse.json(detail);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    const leadId = Number((await context.params).id);
    if (!leadId || Number.isNaN(leadId)) {
      throw new LeadError("Valid lead id is required", "LEAD_INVALID_ID");
    }
    const payload = (await req.json()) as UpdateLeadPayload;
    const detail = await leadApplicationService.updateLead(leadId, payload);
    return NextResponse.json(detail);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    const leadId = Number((await context.params).id);
    if (!leadId || Number.isNaN(leadId)) {
      throw new LeadError("Valid lead id is required", "LEAD_INVALID_ID");
    }
    await leadApplicationService.deleteLead(leadId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
