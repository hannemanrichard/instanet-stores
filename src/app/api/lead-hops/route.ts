import { NextRequest, NextResponse } from "next/server";
import { leadHopApplicationService } from "@/features/leads/application/services/leadHopApplicationService";
import type { CreateLeadHopInput } from "@/features/leads/domain";
import { LeadHopError } from "@/features/leads/domain";
import { requireAdminActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";

export async function GET(req: NextRequest) {
  try {
    await requireAdminActor();
    const leadId = req.nextUrl.searchParams.get("leadId");
    const agentId = req.nextUrl.searchParams.get("agentId");

    if (leadId && agentId) {
      const hop = await leadHopApplicationService.getLeadHop(
        Number(leadId),
        Number(agentId)
      );
      return NextResponse.json({ hop });
    }

    if (leadId) {
      const hops = await leadHopApplicationService.getLeadHopsByLeadId(
        Number(leadId)
      );
      return NextResponse.json({ hops });
    }

    if (agentId) {
      const hops = await leadHopApplicationService.getLeadHopsByAgentId(
        Number(agentId)
      );
      return NextResponse.json({ hops });
    }

    const hops = await leadHopApplicationService.getAllLeadHops();
    return NextResponse.json({ hops });
  } catch (error) {
    return jsonError(error);
  }
}

/** Public — storefront attribution hop after lead create */
export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as CreateLeadHopInput;
    if (!data?.lead_id || !data?.agent_id) {
      throw new LeadHopError(
        "lead_id and agent_id are required",
        "LEAD_HOP_REQUIRED"
      );
    }
    const hop = await leadHopApplicationService.createLeadHop(data);
    return NextResponse.json({ hop }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
