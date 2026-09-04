import { SupabaseStoreService } from "../../data";
import type { StoreEntity, UpsertStoreInput } from "../../domain";
import { StoreError } from "../../domain";
import type { StoreRepository } from "../../domain/repositories";

export class StoreApplicationService {
  constructor(private readonly storeRepository: StoreRepository) {}

  async getByEmail(email: string): Promise<StoreEntity | null> {
    try {
      if (!email.trim()) return null;
      return await this.storeRepository.getByEmail(email.trim());
    } catch {
      throw new StoreError("Failed to load store", "STORE_FETCH_FAILED");
    }
  }

  async getById(id: number): Promise<StoreEntity | null> {
    try {
      return await this.storeRepository.getById(id);
    } catch {
      throw new StoreError("Failed to load store", "STORE_FETCH_FAILED");
    }
  }

  async getAll(): Promise<StoreEntity[]> {
    try {
      return await this.storeRepository.getAll();
    } catch {
      throw new StoreError("Failed to load stores", "STORE_FETCH_FAILED");
    }
  }

  async getByIds(ids: number[]): Promise<StoreEntity[]> {
    try {
      if (ids.length === 0) return [];
      return await this.storeRepository.getByIds(ids);
    } catch {
      throw new StoreError("Failed to load stores", "STORE_FETCH_FAILED");
    }
  }

  async getOrCreateStore(input: UpsertStoreInput): Promise<StoreEntity> {
    try {
      if (!input.email.trim()) {
        throw new StoreError(
          "Store email is required",
          "STORE_EMAIL_REQUIRED"
        );
      }
      return await this.storeRepository.upsertByEmail(input);
    } catch (error) {
      if (error instanceof StoreError) throw error;
      throw new StoreError("Failed to resolve store", "STORE_UPSERT_FAILED");
    }
  }

  async updateStatus(id: number, status: string): Promise<StoreEntity> {
    try {
      if (!status.trim()) {
        throw new StoreError("Status is required", "STORE_STATUS_REQUIRED");
      }
      return await this.storeRepository.updateStatus(id, status.trim());
    } catch (error) {
      if (error instanceof StoreError) throw error;
      throw new StoreError(
        "Failed to update store status",
        "STORE_STATUS_UPDATE_FAILED"
      );
    }
  }
}

const storeService = new SupabaseStoreService();
export const storeApplicationService = new StoreApplicationService(
  storeService
);
