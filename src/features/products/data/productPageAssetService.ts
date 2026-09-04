import { supabaseServer as supabase } from "@/infrastructure/supabase/server";
import type { Database } from "@/infrastructure/supabase/types";
import { DatabaseWrapper } from "@/shared/utils/databaseWrapper";
import { withPerformanceTracking } from "@/shared/utils/performanceMonitor";
import type {
  ProductPageAssetEntity,
  ProductPageAssetMediaType,
} from "../domain";
import type {
  CreateProductPageAssetInput,
  ProductPageAssetRepository,
} from "../domain/repositories";

type Tables = Database["public"]["Tables"];
type ProductPageAssetRow = Tables["product_page_assets"]["Row"];
type ProductPageAssetInsert = Tables["product_page_assets"]["Insert"];

const normalizeMediaType = (value: string): ProductPageAssetMediaType =>
  value === "video" ? "video" : "image";

export class SupabaseProductPageAssetService
  implements ProductPageAssetRepository
{
  private readonly tableName = "product_page_assets";

  async getByPageId(pageId: number): Promise<ProductPageAssetEntity[]> {
    return withPerformanceTracking(
      "ProductPageAssetService",
      "getByPageId",
      async () => {
        const rows = await DatabaseWrapper.executeQuery(
          async () => {
            const { data, error } = await supabase
              .from(this.tableName)
              .select("*")
              .eq("product_page_id", pageId)
              .order("id", { ascending: true });

            if (error) throw error;
            return { data, error };
          },
          {
            operation: "getByPageId",
            table: this.tableName,
            metadata: { pageId },
          }
        );

        return rows.map(this.mapRowToEntity);
      }
    );
  }

  async create(
    data: CreateProductPageAssetInput
  ): Promise<ProductPageAssetEntity> {
    return withPerformanceTracking(
      "ProductPageAssetService",
      "create",
      async () => {
        const payload: ProductPageAssetInsert = {
          product_page_id: data.product_page_id,
          url: data.url,
          media_type: data.media_type,
          file_name: data.file_name ?? null,
        };

        const row = await DatabaseWrapper.executeMutation(
          async () => {
            const { data: created, error } = await supabase
              .from(this.tableName)
              .insert(payload)
              .select()
              .single();

            if (error) throw error;
            return { data: created, error };
          },
          {
            operation: "create",
            table: this.tableName,
            metadata: { pageId: data.product_page_id },
            auditLog: {
              enabled: true,
              action: "INSERT",
              newValues: payload,
            },
          }
        );

        return this.mapRowToEntity(row);
      }
    );
  }

  async createMany(
    items: CreateProductPageAssetInput[]
  ): Promise<ProductPageAssetEntity[]> {
    return withPerformanceTracking(
      "ProductPageAssetService",
      "createMany",
      async () => {
        if (!items.length) return [];

        const payload: ProductPageAssetInsert[] = items.map((item) => ({
          product_page_id: item.product_page_id,
          url: item.url,
          media_type: item.media_type,
          file_name: item.file_name ?? null,
        }));

        const rows = await DatabaseWrapper.executeMutation(
          async () => {
            const { data, error } = await supabase
              .from(this.tableName)
              .insert(payload)
              .select();

            if (error) throw error;
            return { data, error };
          },
          {
            operation: "createMany",
            table: this.tableName,
            metadata: { count: items.length },
            auditLog: {
              enabled: true,
              action: "INSERT",
              newValues: { count: items.length },
            },
          }
        );

        return rows.map(this.mapRowToEntity);
      }
    );
  }

  async deleteById(id: number): Promise<void> {
    return withPerformanceTracking(
      "ProductPageAssetService",
      "deleteById",
      async () => {
        await DatabaseWrapper.executeMutation(
          async () => {
            const { error } = await supabase
              .from(this.tableName)
              .delete()
              .eq("id", id);

            if (error) throw error;
            return { data: { id }, error };
          },
          {
            operation: "deleteById",
            table: this.tableName,
            metadata: { id },
            auditLog: {
              enabled: true,
              action: "DELETE",
              recordId: id,
            },
          }
        );
      }
    );
  }

  async deleteByPageId(pageId: number): Promise<void> {
    return withPerformanceTracking(
      "ProductPageAssetService",
      "deleteByPageId",
      async () => {
        await DatabaseWrapper.executeMutation(
          async () => {
            const { error } = await supabase
              .from(this.tableName)
              .delete()
              .eq("product_page_id", pageId);

            if (error) throw error;
            return { data: { pageId }, error };
          },
          {
            operation: "deleteByPageId",
            table: this.tableName,
            metadata: { pageId },
            auditLog: {
              enabled: true,
              action: "DELETE",
              recordId: pageId,
            },
          }
        );
      }
    );
  }

  private mapRowToEntity = (
    row: ProductPageAssetRow
  ): ProductPageAssetEntity => ({
    id: row.id,
    product_page_id: row.product_page_id,
    url: row.url,
    media_type: normalizeMediaType(row.media_type),
    file_name: row.file_name,
  });
}
