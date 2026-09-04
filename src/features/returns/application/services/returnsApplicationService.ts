import { SupabaseReturnsService } from "../../data";
import type {
  CreateReturnInput,
  EligibleReturnOrder,
  ReturnEntity,
  ReturnStatus,
} from "../../domain";
import { ReturnsError } from "../../domain";
import type { ReturnsRepository } from "../../domain/repositories";

export class ReturnsApplicationService {
  constructor(private readonly returnsRepository: ReturnsRepository) {}

  async getByStoreId(storeId: number): Promise<ReturnEntity[]> {
    return this.getByStoreIds([storeId]);
  }

  async getByStoreIds(storeIds?: number[]): Promise<ReturnEntity[]> {
    try {
      return await this.returnsRepository.getByStoreIds(storeIds);
    } catch (error) {
      if (error instanceof ReturnsError) throw error;
      throw new ReturnsError("Failed to load returns", "RETURNS_FETCH_FAILED");
    }
  }

  async getById(id: number): Promise<ReturnEntity | null> {
    try {
      if (!id) {
        throw new ReturnsError("Return id is required", "RETURNS_ID_REQUIRED");
      }
      return await this.returnsRepository.getById(id);
    } catch (error) {
      if (error instanceof ReturnsError) throw error;
      throw new ReturnsError("Failed to load return", "RETURNS_FETCH_FAILED");
    }
  }

  async getEligibleOrders(storeId: number): Promise<EligibleReturnOrder[]> {
    try {
      if (!storeId) {
        throw new ReturnsError("Store id is required", "RETURNS_STORE_REQUIRED");
      }
      return await this.returnsRepository.getEligibleOrders(storeId);
    } catch (error) {
      if (error instanceof ReturnsError) throw error;
      throw new ReturnsError(
        "Failed to load eligible return orders",
        "RETURNS_ELIGIBLE_FETCH_FAILED"
      );
    }
  }

  async createReturn(input: CreateReturnInput): Promise<ReturnEntity> {
    try {
      if (!input.store_id) {
        throw new ReturnsError("Store id is required", "RETURNS_STORE_REQUIRED");
      }
      if (!input.order_ids?.length) {
        throw new ReturnsError(
          "At least one order is required",
          "RETURNS_ORDERS_REQUIRED"
        );
      }

      const eligible = await this.returnsRepository.getEligibleOrders(
        input.store_id
      );
      const eligibleIds = new Set(eligible.map((order) => order.id));
      const invalid = input.order_ids.filter((id) => !eligibleIds.has(id));
      if (invalid.length) {
        throw new ReturnsError(
          `Orders not eligible for return batch: ${invalid.join(", ")}`,
          "RETURNS_ORDERS_INVALID"
        );
      }

      return await this.returnsRepository.create(input);
    } catch (error) {
      if (error instanceof ReturnsError) throw error;
      throw new ReturnsError("Failed to create return", "RETURNS_CREATE_FAILED");
    }
  }

  async markCollected(id: number): Promise<ReturnEntity> {
    try {
      return await this.returnsRepository.updateStatus(id, "collected");
    } catch (error) {
      if (error instanceof ReturnsError) throw error;
      throw new ReturnsError(
        "Failed to mark return as collected",
        "RETURNS_COLLECT_FAILED"
      );
    }
  }

  async updateStatus(id: number, status: ReturnStatus): Promise<ReturnEntity> {
    try {
      return await this.returnsRepository.updateStatus(id, status);
    } catch (error) {
      if (error instanceof ReturnsError) throw error;
      throw new ReturnsError(
        "Failed to update return status",
        "RETURNS_STATUS_UPDATE_FAILED"
      );
    }
  }
}

const returnsService = new SupabaseReturnsService();
export const returnsApplicationService = new ReturnsApplicationService(
  returnsService
);
