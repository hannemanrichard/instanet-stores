import { NextRequest, NextResponse } from "next/server";
import { paymentsApplicationService } from "@/features/payments/application/services/paymentsApplicationService";
import { requireDashboardActor } from "@/shared/server/requireDashboardActor";
import { assertStoreAccess } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";
import { PaymentsError } from "@/features/payments/domain";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireDashboardActor();
    const paymentId = Number((await context.params).id);
    if (!paymentId || Number.isNaN(paymentId)) {
      throw new PaymentsError("Payment id is required", "PAYMENTS_ID_REQUIRED");
    }

    const existing = await paymentsApplicationService.getById(paymentId);
    if (!existing) {
      throw new PaymentsError("Payment not found", "PAYMENTS_NOT_FOUND");
    }
    assertStoreAccess(actor, existing.store_id);

    return NextResponse.json({ payment: existing });
  } catch (error) {
    return jsonError(error);
  }
}
