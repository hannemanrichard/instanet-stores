import { supabaseServer as supabase } from "@/infrastructure/supabase/server";
import type { Database } from "@/infrastructure/supabase/types";
import { DatabaseWrapper } from "@/shared/utils/databaseWrapper";
import { withPerformanceTracking } from "@/shared/utils/performanceMonitor";
import { normalizeUserEmail } from "@/shared/utils/userEmail";
import type { StoreAssignment } from "../domain";
import type { StoreAssignmentRepository } from "../domain/repositories";

type Tables = Database["public"]["Tables"];
type StoreAssignmentRow = Tables["store_assignments"]["Row"];

export class SupabaseStoreAssignmentService implements StoreAssignmentRepository {
  private readonly tableName = "store_assignments";

  async listAll(): Promise<StoreAssignment[]> {
    return withPerformanceTracking(
      "StoreAssignmentService",
      "listAll",
      async () => {
        const rows = await DatabaseWrapper.executeQuery(
          async () => {
            const { data, error } = await supabase
              .from(this.tableName)
              .select("*")
              .order("created_at", { ascending: false });

            if (error) throw error;
            return { data, error };
          },
          {
            operation: "listAll",
            table: this.tableName,
          }
        );

        return rows.map(this.mapRow);
      }
    );
  }

  async listStoreIdsByEmail(email: string): Promise<number[]> {
    return withPerformanceTracking(
      "StoreAssignmentService",
      "listStoreIdsByEmail",
      async () => {
        const normalizedEmail = normalizeUserEmail(email);
        if (!normalizedEmail) return [];

        const rows = await DatabaseWrapper.executeQuery(
          async () => {
            const { data, error } = await supabase
              .from(this.tableName)
              .select("store_id")
              .eq("email", normalizedEmail);

            if (error) throw error;
            return { data, error };
          },
          {
            operation: "listStoreIdsByEmail",
            table: this.tableName,
            metadata: { email: normalizedEmail },
          }
        );

        return rows.map((row) => row.store_id);
      }
    );
  }

  async listByStoreId(storeId: number): Promise<StoreAssignment[]> {
    return withPerformanceTracking(
      "StoreAssignmentService",
      "listByStoreId",
      async () => {
        const rows = await DatabaseWrapper.executeQuery(
          async () => {
            const { data, error } = await supabase
              .from(this.tableName)
              .select("*")
              .eq("store_id", storeId);

            if (error) throw error;
            return { data, error };
          },
          {
            operation: "listByStoreId",
            table: this.tableName,
            metadata: { storeId },
          }
        );

        return rows.map(this.mapRow);
      }
    );
  }

  async replaceAssignments(
    email: string,
    storeIds: number[]
  ): Promise<StoreAssignment[]> {
    return withPerformanceTracking(
      "StoreAssignmentService",
      "replaceAssignments",
      async () => {
        const normalizedEmail = normalizeUserEmail(email);
        await this.deleteByEmail(normalizedEmail);

        const uniqueIds = [...new Set(storeIds.filter((id) => Number.isFinite(id)))];
        if (!normalizedEmail || uniqueIds.length === 0) return [];

        const rows = await DatabaseWrapper.executeMutation(
          async () => {
            const { data, error } = await supabase
              .from(this.tableName)
              .insert(
                uniqueIds.map((store_id) => ({
                  email: normalizedEmail,
                  store_id,
                }))
              )
              .select();

            if (error) throw error;
            return { data, error };
          },
          {
            operation: "replaceAssignments.insert",
            table: this.tableName,
            metadata: { email: normalizedEmail, storeIds: uniqueIds },
            auditLog: {
              enabled: true,
              action: "INSERT",
            },
          }
        );

        return (rows as StoreAssignmentRow[]).map(this.mapRow);
      }
    );
  }

  async deleteByEmail(email: string): Promise<void> {
    return withPerformanceTracking(
      "StoreAssignmentService",
      "deleteByEmail",
      async () => {
        const normalizedEmail = normalizeUserEmail(email);
        if (!normalizedEmail) return;

        await DatabaseWrapper.executeMutation(
          async () => {
            const { data, error } = await supabase
              .from(this.tableName)
              .delete()
              .eq("email", normalizedEmail)
              .select();

            if (error) throw error;
            return { data, error };
          },
          {
            operation: "deleteByEmail",
            table: this.tableName,
            metadata: { email: normalizedEmail },
            auditLog: {
              enabled: true,
              action: "DELETE",
            },
          }
        );
      }
    );
  }

  private mapRow = (row: StoreAssignmentRow): StoreAssignment => ({
    email: row.email,
    store_id: row.store_id,
    created_at: row.created_at,
  });
}
