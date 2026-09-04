import type {
  CreateReturnInput,
  EligibleReturnOrder,
  ReturnEntity,
  ReturnStatus,
} from "./entities";

export interface ReturnsRepository {
  getByStoreId(storeId: number): Promise<ReturnEntity[]>;
  getByStoreIds(storeIds?: number[]): Promise<ReturnEntity[]>;
  getById(id: number): Promise<ReturnEntity | null>;
  getEligibleOrders(storeId: number): Promise<EligibleReturnOrder[]>;
  create(input: CreateReturnInput): Promise<ReturnEntity>;
  updateStatus(id: number, status: ReturnStatus): Promise<ReturnEntity>;
}
