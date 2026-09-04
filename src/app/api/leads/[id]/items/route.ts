import { NextRequest, NextResponse } from "next/server";
import { leadApplicationService } from "@/features/leads/application/services/leadApplicationService";
import type { UpdateLeadItemInput } from "@/features/leads/domain";
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
    const items = await leadApplicationService.getLeadItems(leadId);
    return NextResponse.json({ items });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminActor();
    const leadId = Number((await context.params).id);
    if (!leadId || Number.isNaN(leadId)) {
      throw new LeadError("Valid lead id is required", "LEAD_INVALID_ID");
    }
    const body = (await req.json()) as { items?: UpdateLeadItemInput[] };
    if (!body.items) {
      throw new LeadError("items are required", "LEAD_ITEMS_REQUIRED");
    }
    const items = await leadApplicationService.replaceLeadItems(
      leadId,
      body.items
    );
    return NextResponse.json({ items });
  } catch (error) {
    return jsonError(error);
  }
}
