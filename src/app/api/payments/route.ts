import { NextRequest, NextResponse } from "next/server";
import { paymentsApplicationService } from "@/features/payments/application/services/paymentsApplicationService";
import { createPaymentBodySchema } from "@/features/payments/domain/validations";
import {
  requireDashboardActor,
  requireStoreOpsActor,
} from "@/shared/server/requireDashboardActor";
import { assertStoreAccess, resolveScopeStoreIds } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";
import { parseJsonBody } from "@/shared/server/parseRequest";
import { rateLimitByActor } from "@/shared/server/rateLimit";

const AUTHENTICATED_PAYMENT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const AUTHENTICATED_PAYMENT_RATE_LIMIT_MAX = 20;

export async function GET(req: NextRequest) {
  try {
    const actor = await requireDashboardActor();
    const storeIdParam = req.nextUrl.searchParams.get("storeId");
    const requestedStoreId = storeIdParam ? Number(storeIdParam) : null;
    const storeIds = resolveScopeStoreIds(actor, requestedStoreId);

    const summary = await paymentsApplicationService.getSummary(storeIds);
    return NextResponse.json(summary);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireStoreOpsActor();
    const limit = rateLimitByActor(
      actor.user.id,
      "payment-create",
      AUTHENTICATED_PAYMENT_RATE_LIMIT_MAX,
      AUTHENTICATED_PAYMENT_RATE_LIMIT_WINDOW_MS
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

    const body = await parseJsonBody(req, createPaymentBodySchema);

    assertStoreAccess(actor, body.store_id);

    const payment = await paymentsApplicationService.createPayment({
      store_id: body.store_id,
      order_ids: body.order_ids,
      note: body.note,
    });

    return NextResponse.json(
      { payment },
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
