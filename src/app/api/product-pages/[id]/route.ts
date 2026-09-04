import { NextRequest, NextResponse } from "next/server";
import { productApplicationService } from "@/features/products/application/services/productApplicationService";
import type { UpdateProductPagePayload } from "@/features/products/application/services/productApplicationService";
import type { ProductPageEntity } from "@/features/products/domain";
import { ProductPageError } from "@/features/products/domain";
import { requireStoreOpsActor } from "@/shared/server/requireDashboardActor";
import { assertActorProductPageAccess } from "@/shared/server/productStoreAccess";
import { jsonError } from "@/shared/server/jsonError";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireStoreOpsActor();
    const pageId = Number((await context.params).id);
    if (!pageId || Number.isNaN(pageId)) {
      throw new ProductPageError(
        "Valid page id is required",
        "PRODUCT_PAGE_INVALID_ID"
      );
    }

    await assertActorProductPageAccess(actor, pageId);

    const body = (await req.json()) as {
      mode?: "simple" | "relations";
      payload?: UpdateProductPagePayload | Partial<ProductPageEntity>;
    };

    if (body.mode === "simple") {
      const page = await productApplicationService.updateProductPage(
        pageId,
        (body.payload ?? {}) as Partial<ProductPageEntity>
      );
      return NextResponse.json({ page });
    }

    const page = await productApplicationService.updateProductPageWithRelations(
      pageId,
      (body.payload ?? {}) as UpdateProductPagePayload
    );
    return NextResponse.json({ page });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireStoreOpsActor();
    const pageId = Number((await context.params).id);
    if (!pageId || Number.isNaN(pageId)) {
      throw new ProductPageError(
        "Valid page id is required",
        "PRODUCT_PAGE_INVALID_ID"
      );
    }

    await assertActorProductPageAccess(actor, pageId);
    await productApplicationService.deleteProductPage(pageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
