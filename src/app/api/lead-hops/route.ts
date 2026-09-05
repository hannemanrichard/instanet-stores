import { NextRequest, NextResponse } from "next/server";
import { leadHopApplicationService } from "@/features/leads/application/services/leadHopApplicationService";
import { publicLeadHopSchema } from "@/features/leads/domain/validations";
import { requireAdminActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";
import { parseJsonBody } from "@/shared/server/parseRequest";
import { rateLimitByIp } from "@/shared/server/rateLimit";

const PUBLIC_LEAD_HOP_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const PUBLIC_LEAD_HOP_RATE_LIMIT_MAX = 10;

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
    const limit = rateLimitByIp(
      req,
      "public-lead-hop-create",
      PUBLIC_LEAD_HOP_RATE_LIMIT_MAX,
      PUBLIC_LEAD_HOP_RATE_LIMIT_WINDOW_MS
    );

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests", code: "RATE_LIMITED" },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSeconds),
          },
        }
      );
    }

    const data = await parseJsonBody(req, publicLeadHopSchema);
    const hop = await leadHopApplicationService.createLeadHop(data);
    return NextResponse.json(
      { hop },
      {
        status: 201,
        headers: {
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      }
    );
  } catch (error) {
    return jsonError(error);
  }
}
