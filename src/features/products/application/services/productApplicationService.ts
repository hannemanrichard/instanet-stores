import {
  SupabaseProductItemService,
  SupabaseProductPageAssetService,
  SupabaseProductPageImageService,
  SupabaseProductPageItemService,
  SupabaseProductPageService,
  SupabaseProductService,
  SupabaseProductPageTestimonialService,
} from "../../data";
import type {
  ProductCatalogEntry,
  ProductEntity,
  ProductInventoryAdjustment,
  ProductInventorySnapshot,
  ProductItemEntity,
  ProductPageAssetEntity,
  ProductPageEntity,
  ProductPageItemEntity,
  ProductPageWithRelations,
} from "../../domain";
import { ProductError, ProductItemError, ProductPageError } from "../../domain";
import type {
  CreateProductPageAssetInput,
  ProductItemRepository,
  ProductPageAssetRepository,
  ProductPageImageRepository,
  ProductPageItemRepository,
  ProductPageRepository,
  ProductPageTestimonialRepository,
  ProductRepository,
} from "../../domain/repositories";

export interface CreateProductVariantInput
  extends Omit<ProductItemEntity, "id" | "product_id" | "quantity"> {
  initialQuantity?: number;
}

export interface CreateProductPayload {
  product: Omit<ProductEntity, "id" | "created_at" | "updated_at">;
  items?: CreateProductVariantInput[];
  page?: Omit<ProductPageEntity, "id" | "created_at" | "updated_at">;
  pageItems?: ProductPageItemEntity[];
  pageGallery?: string[];
  pageTestimonials?: string[];
}

export interface CreateProductPagePayload {
  page: Omit<ProductPageEntity, "id" | "created_at" | "updated_at">;
  itemIds?: number[];
  gallery?: string[];
  testimonials?: string[];
}

export interface UpdateProductPagePayload {
  page?: Partial<ProductPageEntity>;
  itemIds?: number[];
  gallery?: string[];
  testimonials?: string[];
}

export interface UpdateProductPayload {
  product?: Partial<ProductEntity>;
  items?: Array<Partial<ProductItemEntity> & { id: number }>;
  page?: Partial<ProductPageEntity> & { id: number };
  pageItems?: ProductPageItemEntity[];
  pageGallery?: {
    pageId: number;
    urls: string[];
  };
  pageTestimonials?: {
    pageId: number;
    testimonials: string[];
  };
}

export class ProductApplicationService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly itemRepository: ProductItemRepository,
    private readonly pageRepository: ProductPageRepository,
    private readonly pageItemRepository: ProductPageItemRepository,
    private readonly pageImageRepository: ProductPageImageRepository,
    private readonly pageTestimonialRepository: ProductPageTestimonialRepository,
    private readonly pageAssetRepository: ProductPageAssetRepository
  ) { }

  async getCatalog(searchTerm?: string): Promise<ProductCatalogEntry[]> {
    try {
      if (searchTerm && searchTerm.trim()) {
        return await this.productRepository.search(searchTerm.trim());
      }
      return await this.productRepository.getCatalog();
    } catch {
      throw new ProductError(
        "Failed to load product catalog",
        "PRODUCT_CATALOG_FETCH_FAILED"
      );
    }
  }

  async getProductPageBySlug(
    slug: string
  ): Promise<ProductPageWithRelations | null> {
    try {
      if (!slug.trim()) {
        return null;
      }
      return await this.pageRepository.getBySlug(slug.trim());
    } catch {
      throw new ProductPageError(
        "Failed to load product page",
        "PRODUCT_PAGE_FETCH_FAILED"
      );
    }
  }

  async getProductPageById(pageId: number): Promise<ProductPageEntity | null> {
    try {
      if (!pageId) return null;
      return await this.pageRepository.getById(pageId);
    } catch {
      throw new ProductPageError(
        "Failed to load product page",
        "PRODUCT_PAGE_FETCH_FAILED"
      );
    }
  }

  async listOpsProductPages(
    storeIds?: number[],
    term?: string
  ): Promise<ProductPageEntity[]> {
    try {
      const pages = term?.trim()
        ? await this.pageRepository.searchPages(term.trim())
        : await this.pageRepository.getActivePages();

      if (storeIds === undefined) return pages;
      if (storeIds.length === 0) return [];

      const products = await this.productRepository.getByStoreIds(storeIds);
      const allowedIds = new Set(products.map((product) => product.id));
      return pages.filter((page) => allowedIds.has(page.product_id));
    } catch {
      throw new ProductPageError(
        "Failed to search product pages",
        "PRODUCT_PAGE_SEARCH_FAILED"
      );
    }
  }

  async getActiveProductPages(): Promise<ProductPageEntity[]> {
    try {
      return await this.pageRepository.getActivePages();
    } catch {
      throw new ProductPageError(
        "Failed to load active product pages",
        "PRODUCT_PAGE_FETCH_FAILED"
      );
    }
  }

  async searchProductPages(term: string): Promise<ProductPageEntity[]> {
    try {
      if (!term.trim()) {
        return await this.pageRepository.getActivePages();
      }
      return await this.pageRepository.searchPages(term.trim());
    } catch {
      throw new ProductPageError(
        "Failed to search product pages",
        "PRODUCT_PAGE_SEARCH_FAILED"
      );
    }
  }

  async getAdminProducts(): Promise<ProductEntity[]> {
    try {
      return await this.productRepository.getAll();
    } catch {
      throw new ProductError("Failed to load products", "PRODUCT_FETCH_FAILED");
    }
  }

  async getProductsByStoreId(storeId: number): Promise<ProductEntity[]> {
    return this.getProductsByStoreIds([storeId]);
  }

  async getProductsByStoreIds(storeIds: number[]): Promise<ProductEntity[]> {
    try {
      if (storeIds.length === 0) return [];
      return await this.productRepository.getByStoreIds(storeIds);
    } catch {
      throw new ProductError(
        "Failed to load store products",
        "PRODUCT_FETCH_FAILED"
      );
    }
  }

  async getProductById(productId: number): Promise<ProductEntity | null> {
    try {
      if (!productId) {
        return null;
      }
      return await this.productRepository.getById(productId);
    } catch {
      throw new ProductError(
        "Failed to load product",
        "PRODUCT_FETCH_FAILED"
      );
    }
  }

  async getProductItems(productId: number): Promise<ProductItemEntity[]> {
    try {
      return await this.itemRepository.getByProductId(productId);
    } catch {
      throw new ProductItemError(
        "Failed to load product items",
        "PRODUCT_ITEMS_FETCH_FAILED"
      );
    }
  }

  async getProductInventory(
    productId: number
  ): Promise<ProductInventorySnapshot> {
    try {
      return await this.productRepository.getInventorySnapshot(productId);
    } catch {
      throw new ProductError(
        "Failed to load product inventory",
        "PRODUCT_INVENTORY_FETCH_FAILED"
      );
    }
  }

  async createProductWithRelations(payload: CreateProductPayload): Promise<{
    product: ProductEntity;
    items: ProductItemEntity[];
    page?: ProductPageEntity;
  }> {
    try {
      const product = await this.productRepository.create(payload.product);
      const createdItems: ProductItemEntity[] = [];

      if (payload.items?.length) {
        for (const variant of payload.items) {
          const { initialQuantity = 0, ...itemData } = variant;
          const createdItem = await this.itemRepository.create({
            ...itemData,
            product_id: product.id,
          });

          await this.itemRepository.ensureInventory(
            createdItem.id,
            initialQuantity ?? 0
          );

          createdItem.quantity = initialQuantity ?? 0;
          createdItems.push(createdItem);
        }
      }

      let createdPage: ProductPageEntity | undefined;
      if (payload.page) {
        createdPage = await this.pageRepository.create({
          ...payload.page,
          product_id: product.id,
        });

        if (payload.pageItems?.length) {
          await this.pageItemRepository.upsertItems(
            createdPage.id,
            payload.pageItems
          );
        }

        if (payload.pageGallery) {
          await this.pageImageRepository.replaceForPage(
            createdPage.id,
            payload.pageGallery
          );
        }

        if (payload.pageTestimonials) {
          await this.pageTestimonialRepository.replaceForPage(
            createdPage.id,
            payload.pageTestimonials
          );
        }
      }

      return {
        product,
        items: createdItems,
        page: createdPage,
      };
    } catch {
      throw new ProductError(
        "Failed to create product",
        "PRODUCT_CREATE_FAILED"
      );
    }
  }

  async createProductPage(
    payload: CreateProductPagePayload
  ): Promise<ProductPageWithRelations> {
    try {
      const page = await this.pageRepository.create(payload.page);

      if (payload.itemIds) {
        const pageItems = payload.itemIds.map((itemId, index) => ({
          product_page_id: page.id,
          item_id: itemId,
          display_order: index,
        }));
        await this.pageItemRepository.upsertItems(page.id, pageItems);
      }

      await this.pageImageRepository.replaceForPage(
        page.id,
        payload.gallery ?? []
      );

      await this.pageTestimonialRepository.replaceForPage(
        page.id,
        payload.testimonials ?? []
      );

      const withRelations = await this.pageRepository.getBySlug(page.slug);
      if (!withRelations) {
        throw new Error("Failed to load created product page");
      }

      return withRelations;
    } catch {
      throw new ProductPageError(
        "Failed to create product page",
        "PRODUCT_PAGE_CREATE_FAILED"
      );
    }
  }

  async updateProductPage(
    pageId: number,
    payload: Partial<ProductPageEntity>
  ): Promise<ProductPageEntity> {
    try {
      if (!pageId) {
        throw new ProductPageError(
          "Missing product page identifier",
          "PRODUCT_PAGE_UPDATE_FAILED"
        );
      }

      await this.pageRepository.update(pageId, payload);
      const updatedPage = await this.pageRepository.getById(pageId);

      if (!updatedPage) {
        throw new ProductPageError(
          "Product page not found after update",
          "PRODUCT_PAGE_UPDATE_FAILED"
        );
      }

      return updatedPage;
    } catch {
      throw new ProductPageError(
        "Failed to update product page",
        "PRODUCT_PAGE_UPDATE_FAILED"
      );
    }
  }

  async updateProductPageWithRelations(
    pageId: number,
    payload: UpdateProductPagePayload
  ): Promise<ProductPageWithRelations> {
    try {
      if (!pageId) {
        throw new ProductPageError(
          "Missing product page identifier",
          "PRODUCT_PAGE_UPDATE_FAILED"
        );
      }

      if (payload.page) {
        await this.pageRepository.update(pageId, payload.page);
      }

      if (payload.itemIds !== undefined) {
        const pageItems = payload.itemIds.map((itemId, index) => ({
          product_page_id: pageId,
          item_id: itemId,
          display_order: index,
        }));
        await this.pageItemRepository.upsertItems(pageId, pageItems);
      }

      if (payload.gallery !== undefined) {
        await this.pageImageRepository.replaceForPage(pageId, payload.gallery);
      }

      if (payload.testimonials !== undefined) {
        await this.pageTestimonialRepository.replaceForPage(pageId, payload.testimonials);
      }

      const updatedPage = await this.pageRepository.getBySlug(
        (await this.pageRepository.getById(pageId))?.slug ?? ""
      );

      if (!updatedPage) {
        throw new ProductPageError(
          "Product page not found after update",
          "PRODUCT_PAGE_UPDATE_FAILED"
        );
      }

      return updatedPage;
    } catch {
      throw new ProductPageError(
        "Failed to update product page",
        "PRODUCT_PAGE_UPDATE_FAILED"
      );
    }
  }

  async deleteProductPage(pageId: number): Promise<void> {
    try {
      if (!pageId) {
        throw new ProductPageError(
          "Missing product page identifier",
          "PRODUCT_PAGE_DELETE_FAILED"
        );
      }

      await this.pageItemRepository.deleteByPageId(pageId);
      await this.pageImageRepository.deleteByPageId(pageId);
      await this.pageTestimonialRepository.deleteByPageId(pageId);
      await this.pageAssetRepository.deleteByPageId(pageId);
      await this.pageRepository.delete(pageId);
    } catch {
      throw new ProductPageError(
        "Failed to delete product page",
        "PRODUCT_PAGE_DELETE_FAILED"
      );
    }
  }

  async addProductItem(
    productId: number,
    variant: CreateProductVariantInput
  ): Promise<ProductItemEntity> {
    try {
      const { initialQuantity = 0, ...itemData } = variant;
      const createdItem = await this.itemRepository.create({
        ...itemData,
        product_id: productId,
      });

      await this.itemRepository.ensureInventory(
        createdItem.id,
        initialQuantity ?? 0
      );
      createdItem.quantity = initialQuantity ?? 0;

      return createdItem;
    } catch {
      throw new ProductItemError(
        "Failed to add product variant",
        "PRODUCT_ITEM_CREATE_FAILED"
      );
    }
  }

  async updateProductWithRelations(
    productId: number,
    payload: UpdateProductPayload
  ): Promise<void> {
    try {
      if (payload.product) {
        await this.productRepository.update(productId, payload.product);
      }

      if (payload.items?.length) {
        await Promise.all(
          payload.items.map((item) =>
            this.itemRepository.update(item.id, {
              ...item,
              product_id: productId,
            })
          )
        );
      }

      if (payload.page) {
        await this.pageRepository.update(payload.page.id, payload.page);
      }

      if (payload.page?.id && payload.pageItems) {
        await this.pageItemRepository.upsertItems(
          payload.page.id,
          payload.pageItems
        );
      }

      if (payload.pageGallery) {
        await this.pageImageRepository.replaceForPage(
          payload.pageGallery.pageId,
          payload.pageGallery.urls
        );
      }

      if (payload.pageTestimonials) {
        await this.pageTestimonialRepository.replaceForPage(
          payload.pageTestimonials.pageId,
          payload.pageTestimonials.testimonials
        );
      }
    } catch {
      throw new ProductError(
        "Failed to update product",
        "PRODUCT_UPDATE_FAILED"
      );
    }
  }

  async deleteProduct(productId: number): Promise<void> {
    try {
      const pages = await this.pageRepository.getAll();
      const page = pages.find((entry) => entry.product_id === productId);

      if (page) {
        await this.pageItemRepository.deleteByPageId(page.id);
        await this.pageImageRepository.deleteByPageId(page.id);
        await this.pageTestimonialRepository.deleteByPageId(page.id);
        await this.pageAssetRepository.deleteByPageId(page.id);
        await this.pageRepository.delete(page.id);
      }

      const items = await this.itemRepository.getByProductId(productId);
      await Promise.all(
        items.map((item) => this.itemRepository.delete(item.id))
      );

      await this.productRepository.delete(productId);
    } catch {
      throw new ProductError(
        "Failed to delete product",
        "PRODUCT_DELETE_FAILED"
      );
    }
  }

  async bulkUpdateInventory(
    productId: number,
    adjustments: ProductInventoryAdjustment[]
  ): Promise<ProductInventorySnapshot> {
    try {
      await this.itemRepository.bulkUpdateQuantities(productId, adjustments);
      return await this.productRepository.getInventorySnapshot(productId);
    } catch {
      throw new ProductItemError(
        "Failed to update inventory",
        "PRODUCT_INVENTORY_UPDATE_FAILED"
      );
    }
  }

  async getProductPageAssets(pageId: number): Promise<ProductPageAssetEntity[]> {
    try {
      if (!pageId) {
        throw new ProductPageError(
          "Missing product page identifier",
          "PRODUCT_PAGE_ASSETS_FETCH_FAILED"
        );
      }
      return await this.pageAssetRepository.getByPageId(pageId);
    } catch {
      throw new ProductPageError(
        "Failed to load product page assets",
        "PRODUCT_PAGE_ASSETS_FETCH_FAILED"
      );
    }
  }

  async createProductPageAsset(
    input: CreateProductPageAssetInput
  ): Promise<ProductPageAssetEntity> {
    try {
      if (!input.product_page_id || !input.url.trim()) {
        throw new ProductPageError(
          "Valid page id and url are required",
          "PRODUCT_PAGE_ASSET_CREATE_FAILED"
        );
      }
      return await this.pageAssetRepository.create({
        ...input,
        url: input.url.trim(),
        file_name: input.file_name?.trim() || null,
      });
    } catch {
      throw new ProductPageError(
        "Failed to add product page asset",
        "PRODUCT_PAGE_ASSET_CREATE_FAILED"
      );
    }
  }

  async createProductPageAssets(
    items: CreateProductPageAssetInput[]
  ): Promise<ProductPageAssetEntity[]> {
    try {
      if (!items.length) return [];
      return await this.pageAssetRepository.createMany(
        items.map((item) => ({
          ...item,
          url: item.url.trim(),
          file_name: item.file_name?.trim() || null,
        }))
      );
    } catch {
      throw new ProductPageError(
        "Failed to add product page assets",
        "PRODUCT_PAGE_ASSET_CREATE_FAILED"
      );
    }
  }

  async deleteProductPageAsset(assetId: number): Promise<void> {
    try {
      if (!assetId) {
        throw new ProductPageError(
          "Missing asset identifier",
          "PRODUCT_PAGE_ASSET_DELETE_FAILED"
        );
      }
      await this.pageAssetRepository.deleteById(assetId);
    } catch {
      throw new ProductPageError(
        "Failed to delete product page asset",
        "PRODUCT_PAGE_ASSET_DELETE_FAILED"
      );
    }
  }
}

const productService = new SupabaseProductService();
const productItemService = new SupabaseProductItemService();
const productPageService = new SupabaseProductPageService();
const productPageItemService = new SupabaseProductPageItemService();
const productPageImageService = new SupabaseProductPageImageService();
const productPageTestimonialService = new SupabaseProductPageTestimonialService();
const productPageAssetService = new SupabaseProductPageAssetService();

export const productApplicationService = new ProductApplicationService(
  productService,
  productItemService,
  productPageService,
  productPageItemService,
  productPageImageService,
  productPageTestimonialService,
  productPageAssetService
);
