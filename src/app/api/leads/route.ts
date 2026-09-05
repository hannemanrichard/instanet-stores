import { NextRequest, NextResponse } from "next/server";
import { leadApplicationService } from "@/features/leads/application/services/leadApplicationService";
import {
  leadListSearchParamsSchema,
  publicCreateLeadSchema,
} from "@/features/leads/domain/validations";
import { requireAdminActor } from "@/shared/server/requireDashboardActor";
import { jsonError } from "@/shared/server/jsonError";
import { parseJsonBody, parseSearchParams } from "@/shared/server/parseRequest";
import { rateLimitByIp } from "@/shared/server/rateLimit";

const PUBLIC_LEAD_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const PUBLIC_LEAD_RATE_LIMIT_MAX = 5;

/** Public create (storefront) + admin list */
export async function GET(req: NextRequest) {
  try {
    await requireAdminActor();
    const { status, search } = parseSearchParams(
      req.nextUrl.searchParams,
      leadListSearchParamsSchema
    );
    const leads = await leadApplicationService.getLeads({ status, search });
    return NextResponse.json({ leads });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimitByIp(
      req,
      "public-lead-create",
      PUBLIC_LEAD_RATE_LIMIT_MAX,
      PUBLIC_LEAD_RATE_LIMIT_WINDOW_MS
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

    const payload = await parseJsonBody(req, publicCreateLeadSchema);
    const result = await leadApplicationService.createLead(payload);
    return NextResponse.json(result, {
      status: 201,
      headers: {
        "X-RateLimit-Remaining": String(limit.remaining),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
