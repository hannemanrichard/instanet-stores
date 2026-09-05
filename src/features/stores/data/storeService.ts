import { supabaseServer as supabase } from "@/infrastructure/supabase/server";
import type { Database } from "@/infrastructure/supabase/types";
import { DatabaseWrapper } from "@/shared/utils/databaseWrapper";
import { withPerformanceTracking } from "@/shared/utils/performanceMonitor";
import type { StoreEntity, UpsertStoreInput } from "../domain";
import type { StoreRepository } from "../domain/repositories";
import {
  clearInflightStoreByEmail,
  getCachedStoreByEmail,
  getInflightStoreByEmail,
  invalidateCachedStoreByEmail,
  setCachedStoreByEmail,
  setInflightStoreByEmail,
} from "./storeCache";

type Tables = Database["public"]["Tables"];
type StoreRow = Tables["stores"]["Row"];

const normalizeComparable = (value: string | null | undefined) =>
  (value ?? "").trim();

export class SupabaseStoreService implements StoreRepository {
  private readonly tableName = "stores";

  async getByEmail(email: string): Promise<StoreEntity | null> {
    return withPerformanceTracking("StoreService", "getByEmail", async () => {
      const normalized = email.trim().toLowerCase();
      if (!normalized) return null;

      const cached = getCachedStoreByEmail(normalized);
      if (cached !== undefined) {
        return cached;
      }

      const inflight = getInflightStoreByEmail(normalized);
      if (inflight) {
        return inflight;
      }

      const loadStore = (async () => {
        const row = await DatabaseWrapper.executeQuery(
          async () => {
            const { data, error } = await supabase
              .from(this.tableName)
              .select("*")
              .ilike("email", normalized)
              .maybeSingle();

            if (error) throw error;
            return { data, error };
          },
          {
            operation: "getByEmail",
            table: this.tableName,
            metadata: { email: normalized },
          }
        );

        const store = row ? this.mapRowToEntity(row) : null;
        setCachedStoreByEmail(normalized, store);
        return store;
      })();

      setInflightStoreByEmail(normalized, loadStore);

      try {
        return await loadStore;
      } finally {
        clearInflightStoreByEmail(normalized);
      }
    });
  }

  async getById(id: number): Promise<StoreEntity | null> {
    return withPerformanceTracking("StoreService", "getById", async () => {
      const row = await DatabaseWrapper.executeQuery(
        async () => {
          const { data, error } = await supabase
            .from(this.tableName)
            .select("*")
            .eq("id", id)
            .maybeSingle();

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "getById",
          table: this.tableName,
          metadata: { id },
        }
      );

      return row ? this.mapRowToEntity(row) : null;
    });
  }

  async getByIds(ids: number[]): Promise<StoreEntity[]> {
    return withPerformanceTracking("StoreService", "getByIds", async () => {
      const uniqueIds = [...new Set(ids.filter((id) => Number.isFinite(id)))];
      if (uniqueIds.length === 0) return [];

      const rows = await DatabaseWrapper.executeQuery(
        async () => {
          const { data, error } = await supabase
            .from(this.tableName)
            .select("*")
            .in("id", uniqueIds)
            .order("created_at", { ascending: false });

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "getByIds",
          table: this.tableName,
          metadata: { ids: uniqueIds },
        }
      );

      return rows.map(this.mapRowToEntity);
    });
  }

  async getAll(): Promise<StoreEntity[]> {
    return withPerformanceTracking("StoreService", "getAll", async () => {
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
          operation: "getAll",
          table: this.tableName,
        }
      );

      return rows.map(this.mapRowToEntity);
    });
  }

  async upsertByEmail(data: UpsertStoreInput): Promise<StoreEntity> {
    return withPerformanceTracking(
      "StoreService",
      "upsertByEmail",
      async () => {
        const email = data.email.trim().toLowerCase();
        const existing = await this.getByEmail(email);

        if (existing) {
          const nextFullname = data.fullname ?? existing.fullname ?? null;
          const nextUsername = data.username ?? existing.username ?? null;
          const nextAvatar = data.avatar ?? existing.avatar ?? null;

          const isUnchanged =
            normalizeComparable(existing.fullname) ===
              normalizeComparable(nextFullname) &&
            normalizeComparable(existing.username) ===
              normalizeComparable(nextUsername) &&
            normalizeComparable(existing.avatar) ===
              normalizeComparable(nextAvatar);

          if (isUnchanged) {
            setCachedStoreByEmail(email, existing);
            return existing;
          }

          const row = await DatabaseWrapper.executeMutation(
            async () => {
              const { data: updated, error } = await supabase
                .from(this.tableName)
                .update({
                  fullname: nextFullname,
                  username: nextUsername,
                  avatar: nextAvatar,
                })
                .eq("id", existing.id)
                .select()
                .single();

              if (error) throw error;
              return { data: updated, error };
            },
            {
              operation: "upsertByEmail.update",
              table: this.tableName,
              metadata: { email },
              auditLog: {
                enabled: true,
                action: "UPDATE",
                recordId: existing.id,
              },
            }
          );

          const updated = this.mapRowToEntity(row);
          setCachedStoreByEmail(email, updated);
          return updated;
        }

        const row = await DatabaseWrapper.executeMutation(
          async () => {
            const { data: created, error } = await supabase
              .from(this.tableName)
              .insert({
                email,
                fullname: data.fullname ?? null,
                username: data.username ?? email.split("@")[0] ?? null,
                avatar: data.avatar ?? null,
                status: "active",
              })
              .select()
              .single();

            if (error) throw error;
            return { data: created, error };
          },
          {
            operation: "upsertByEmail.insert",
            table: this.tableName,
            metadata: { email },
            auditLog: {
              enabled: true,
              action: "INSERT",
            },
          }
        );

        const created = this.mapRowToEntity(row);
        setCachedStoreByEmail(email, created);
        return created;
      }
    );
  }

  async updateStatus(id: number, status: string): Promise<StoreEntity> {
    return withPerformanceTracking("StoreService", "updateStatus", async () => {
      const row = await DatabaseWrapper.executeMutation(
        async () => {
          const { data, error } = await supabase
            .from(this.tableName)
            .update({ status })
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;
          return { data, error };
        },
        {
          operation: "updateStatus",
          table: this.tableName,
          metadata: { id, status },
          auditLog: {
            enabled: true,
            action: "UPDATE",
            recordId: id,
          },
        }
      );

      invalidateCachedStoreByEmail((row.email ?? "").trim().toLowerCase());
      return this.mapRowToEntity(row);
    });
  }

  private mapRowToEntity = (row: StoreRow): StoreEntity => ({
    id: row.id,
    email: row.email ?? undefined,
    fullname: row.fullname ?? undefined,
    username: row.username ?? undefined,
    avatar: row.avatar ?? undefined,
    status: row.status,
    created_at: row.created_at,
  });
}
