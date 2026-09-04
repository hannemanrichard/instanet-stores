import { NextRequest, NextResponse } from "next/server";
import { leadApplicationService } from "@/features/leads/application/services/leadApplicationService";
import type { CreateLeadPayload } from "@/features/leads/application/services/leadApplicationService";
import { LeadError } from "@/features/leads/domain";
import { requireAdminActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";

/** Public create (storefront) + admin list */
export async function GET(req: NextRequest) {
  try {
    await requireAdminActor();
    const status = req.nextUrl.searchParams.get("status")?.trim() || undefined;
    const search = req.nextUrl.searchParams.get("search")?.trim() || undefined;
    const leads = await leadApplicationService.getLeads({ status, search });
    return NextResponse.json({ leads });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as CreateLeadPayload;
    if (!payload?.lead) {
      throw new LeadError("Lead payload is required", "LEAD_REQUIRED");
    }
    const result = await leadApplicationService.createLead(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
