import type {
  ProductCatalogEntry,
  ProductEntity,
  ProductInventoryAdjustment,
  ProductInventorySnapshot,
  ProductItemEntity,
  ProductPageAssetEntity,
  ProductPageAssetMediaType,
  ProductPageEntity,
  ProductPageImageEntity,
  ProductPageItemEntity,
  ProductPageTestimonialEntity,
  ProductPageWithRelations,
} from "./entities";

export interface ProductRepository {
  getAll(): Promise<ProductEntity[]>;
  getById(id: number): Promise<ProductEntity | null>;
  getByStoreId(storeId: number): Promise<ProductEntity[]>;
  getByStoreIds(storeIds: number[]): Promise<ProductEntity[]>;
  create(
    data: Omit<ProductEntity, "id" | "created_at" | "updated_at">
  ): Promise<ProductEntity>;
  update(id: number, data: Partial<ProductEntity>): Promise<ProductEntity>;
  delete(id: number): Promise<void>;
  search(term: string): Promise<ProductCatalogEntry[]>;
  getCatalog(): Promise<ProductCatalogEntry[]>;
  getInventorySnapshot(productId: number): Promise<ProductInventorySnapshot>;
}

export interface ProductItemRepository {
  getByProductId(productId: number): Promise<ProductItemEntity[]>;
  getById(itemId: number): Promise<ProductItemEntity | null>;
  create(
    data: Omit<ProductItemEntity, "id" | "quantity">
  ): Promise<ProductItemEntity>;
  update(
    id: number,
    data: Partial<ProductItemEntity>
  ): Promise<ProductItemEntity>;
  delete(id: number): Promise<void>;
  bulkUpdateQuantities(
    productId: number,
    adjustments: ProductInventoryAdjustment[]
  ): Promise<void>;
  /** Creates inventory row for a new item (client path until products API migration). */
  ensureInventory(itemId: number, quantity?: number): Promise<void>;
}

export interface ProductPageRepository {
  getAll(): Promise<ProductPageEntity[]>;
  getActivePages(): Promise<ProductPageEntity[]>;
  getById(id: number): Promise<ProductPageEntity | null>;
  getBySlug(slug: string): Promise<ProductPageWithRelations | null>;
  create(
    data: Omit<ProductPageEntity, "id" | "created_at" | "updated_at">
  ): Promise<ProductPageEntity>;
  update(
    id: number,
    data: Partial<ProductPageEntity>
  ): Promise<ProductPageEntity>;
  delete(id: number): Promise<void>;
  searchPages(term: string): Promise<ProductPageEntity[]>;
}

export interface ProductPageItemRepository {
  getByPageId(pageId: number): Promise<ProductPageItemEntity[]>;
  upsertItems(
    pageId: number,
    items: ProductPageItemEntity[]
  ): Promise<ProductPageItemEntity[]>;
  deleteByPageId(pageId: number): Promise<void>;
}

export interface ProductPageImageRepository {
  getByPageId(pageId: number): Promise<ProductPageImageEntity[]>;
  replaceForPage(
    pageId: number,
    urls: string[]
  ): Promise<ProductPageImageEntity[]>;
  deleteByPageId(pageId: number): Promise<void>;
}

export interface ProductPageTestimonialRepository {
  getByPageId(pageId: number): Promise<ProductPageTestimonialEntity[]>;
  replaceForPage(pageId: number, urls: string[]): Promise<ProductPageTestimonialEntity[]>;
  deleteByPageId(pageId: number): Promise<void>;
}

export interface CreateProductPageAssetInput {
  product_page_id: number;
  url: string;
  media_type: ProductPageAssetMediaType;
  file_name?: string | null;
}

export interface ProductPageAssetRepository {
  getByPageId(pageId: number): Promise<ProductPageAssetEntity[]>;
  create(data: CreateProductPageAssetInput): Promise<ProductPageAssetEntity>;
  createMany(
    items: CreateProductPageAssetInput[]
  ): Promise<ProductPageAssetEntity[]>;
  deleteById(id: number): Promise<void>;
  deleteByPageId(pageId: number): Promise<void>;
}