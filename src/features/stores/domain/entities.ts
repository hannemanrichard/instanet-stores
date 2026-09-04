export interface StoreEntity {
  id: number;
  email?: string;
  fullname?: string;
  username?: string;
  avatar?: string;
  status: string;
  created_at: string;
}

export interface UpsertStoreInput {
  email: string;
  fullname?: string;
  username?: string;
  avatar?: string;
}

export interface StoreAssignment {
  email: string;
  store_id: number;
  created_at: string;
}

export interface StoreManagerProfile {
  email: string;
  fullName: string;
  storeIds: number[];
  stores: StoreEntity[];
}
