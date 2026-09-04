import { NextRequest, NextResponse } from "next/server";
import { productApplicationService } from "@/features/products/application/services/productApplicationService";
import type { ProductPageAssetMediaType } from "@/features/products/domain";
import { ProductPageError } from "@/features/products/domain";
import { requireStoreOpsActor } from "@/shared/server/requireDashboardActor";
import { assertActorProductPageAccess } from "@/shared/server/productStoreAccess";
import { jsonError } from "@/shared/server/jsonError";

const parsePageId = async (params: Promise<{ id: string }>) => {
  const pageId = Number((await params).id);
  if (!pageId || Number.isNaN(pageId)) {
    throw new ProductPageError(
      "Valid page id is required",
      "PRODUCT_PAGE_INVALID_ID"
    );
  }
  return pageId;
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireStoreOpsActor();
    const pageId = await parsePageId(context.params);
    await assertActorProductPageAccess(actor, pageId);
    const assets = await productApplicationService.getProductPageAssets(pageId);
    return NextResponse.json({ assets });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireStoreOpsActor();
    const pageId = await parsePageId(context.params);
    await assertActorProductPageAccess(actor, pageId);
    const body = (await req.json()) as {
      url?: string;
      media_type?: ProductPageAssetMediaType;
      file_name?: string | null;
      assets?: Array<{
        url: string;
        media_type: ProductPageAssetMediaType;
        file_name?: string | null;
      }>;
    };

    if (Array.isArray(body.assets) && body.assets.length > 0) {
      const assets = await productApplicationService.createProductPageAssets(
        body.assets.map((asset) => ({
          product_page_id: pageId,
          url: asset.url,
          media_type: asset.media_type === "video" ? "video" : "image",
          file_name: asset.file_name ?? null,
        }))
      );
      return NextResponse.json({ assets }, { status: 201 });
    }

    if (!body.url?.trim()) {
      throw new ProductPageError(
        "Asset url is required",
        "PRODUCT_PAGE_ASSET_CREATE_FAILED"
      );
    }

    const asset = await productApplicationService.createProductPageAsset({
      product_page_id: pageId,
      url: body.url,
      media_type: body.media_type === "video" ? "video" : "image",
      file_name: body.file_name ?? null,
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireStoreOpsActor();
    const pageId = await parsePageId(context.params);
    await assertActorProductPageAccess(actor, pageId);

    const assetId = Number(req.nextUrl.searchParams.get("assetId"));
    if (!assetId || Number.isNaN(assetId)) {
      throw new ProductPageError(
        "Valid assetId query param is required",
        "PRODUCT_PAGE_ASSET_DELETE_FAILED"
      );
    }

    await productApplicationService.deleteProductPageAsset(assetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
