import { NextRequest, NextResponse } from "next/server";
import { inventoryApplicationService } from "@/features/inventory/application/services/inventoryApplicationService";
import { productApplicationService } from "@/features/products/application/services/productApplicationService";
import { InventoryError } from "@/features/inventory/domain";
import { requireDashboardActor } from "@/shared/server/requireDashboardActor";
import { resolveScopeStoreIds } from "@/shared/server/storeAccess";
import { jsonError } from "@/shared/server/jsonError";

export async function GET(req: NextRequest) {
  try {
    const actor = await requireDashboardActor();
    const fromDate = req.nextUrl.searchParams.get("fromDate")?.trim() ?? "";
    const toDate = req.nextUrl.searchParams.get("toDate")?.trim() ?? "";
    const storeIdParam = req.nextUrl.searchParams.get("storeId");
    const requestedStoreId = storeIdParam ? Number(storeIdParam) : null;
    const storeIds = resolveScopeStoreIds(actor, requestedStoreId);

    if (!fromDate || !toDate) {
      throw new InventoryError(
        "fromDate and toDate are required",
        "INVENTORY_DATE_RANGE_REQUIRED"
      );
    }

    const soldUnits =
      await inventoryApplicationService.getNumberOfUnitsSoldByDateRange({
        fromDate,
        toDate,
      });

    if (storeIds === undefined) {
      return NextResponse.json({ soldUnits });
    }

    const products =
      await productApplicationService.getProductsByStoreIds(storeIds);
    const allowedNames = new Set(
      products.map((product) => product.name.trim().toLowerCase())
    );
    const scopedSoldUnits = soldUnits.filter((row) =>
      allowedNames.has(row.key.trim().toLowerCase())
    );

    return NextResponse.json({ soldUnits: scopedSoldUnits });
  } catch (error) {
    return jsonError(error);
  }
}
