import { NextRequest, NextResponse } from "next/server";
import { productApplicationService } from "@/features/products/application/services/productApplicationService";
import type { CreateProductPagePayload } from "@/features/products/application/services/productApplicationService";
import { requireStoreOpsActor } from "@/shared/server/requireDashboardActor";
import { resolveScopeStoreIds } from "@/shared/server/storeAccess";
import { assertActorProductAccess } from "@/shared/server/productStoreAccess";
import { jsonError } from "@/shared/server/jsonError";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const activeOnly = req.nextUrl.searchParams.get("active") === "1";
    const opsScope = req.nextUrl.searchParams.get("scope") === "ops";

    if (opsScope) {
      const actor = await requireStoreOpsActor();
      const storeIds = resolveScopeStoreIds(actor, null);
      const pages = await productApplicationService.listOpsProductPages(
        storeIds,
        q
      );
      return NextResponse.json({ pages });
    }

    if (activeOnly && !q) {
      const pages = await productApplicationService.getActiveProductPages();
      return NextResponse.json({ pages });
    }

    const pages = await productApplicationService.searchProductPages(q);
    return NextResponse.json({ pages });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireStoreOpsActor();
    const payload = (await req.json()) as CreateProductPagePayload;
    await assertActorProductAccess(actor, payload.page.product_id);
    const page = await productApplicationService.createProductPage(payload);
    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
