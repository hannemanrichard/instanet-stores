import { NextRequest, NextResponse } from "next/server";
import { dashboardSalesService } from "@/features/dashboard/application/services/dashboardSalesService";
import type {
  DashboardDateRange,
  DashboardDateRangePreset,
} from "@/features/dashboard/domain/dashboardSales";
import { requireDashboardActor } from "@/shared/server/requireDashboardActor";
import { resolveScopeStoreIds } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";

const isPreset = (value: string | null): value is DashboardDateRangePreset =>
  value === "last_7_days" ||
  value === "last_14_days" ||
  value === "last_30_days" ||
  value === "last_90_days" ||
  value === "this_month";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireDashboardActor();
    const fromDate = req.nextUrl.searchParams.get("from");
    const toDate = req.nextUrl.searchParams.get("to");
    const presetParam = req.nextUrl.searchParams.get("preset");
    const storeIdParam = req.nextUrl.searchParams.get("storeId");
    const requestedStoreId = storeIdParam ? Number(storeIdParam) : null;

    if (!fromDate || !toDate || !isPreset(presetParam)) {
      return NextResponse.json(
        { error: "A valid date range is required" },
        { status: 400 }
      );
    }

    const storeIds = resolveScopeStoreIds(actor, requestedStoreId);
    const range: DashboardDateRange = {
      fromDate,
      toDate,
      preset: presetParam,
    };

    const storeId =
      actor.role === "store" ? actor.store.id : requestedStoreId ?? undefined;

    const result = await dashboardSalesService.getHomeMetrics(
      range,
      storeId,
      storeIds ?? undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
