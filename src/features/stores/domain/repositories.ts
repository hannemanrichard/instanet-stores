import type {
  StoreEntity,
  StoreAssignment,
  UpsertStoreInput,
} from "./entities";

export interface StoreRepository {
  getByEmail(email: string): Promise<StoreEntity | null>;
  getById(id: number): Promise<StoreEntity | null>;
  getByIds(ids: number[]): Promise<StoreEntity[]>;
  getAll(): Promise<StoreEntity[]>;
  upsertByEmail(data: UpsertStoreInput): Promise<StoreEntity>;
  updateStatus(id: number, status: string): Promise<StoreEntity>;
}

export interface StoreAssignmentRepository {
  listAll(): Promise<StoreAssignment[]>;
  listStoreIdsByEmail(email: string): Promise<number[]>;
  listByStoreId(storeId: number): Promise<StoreAssignment[]>;
  replaceAssignments(
    email: string,
    storeIds: number[]
  ): Promise<StoreAssignment[]>;
  deleteByEmail(email: string): Promise<void>;
}
