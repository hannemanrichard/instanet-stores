import { clerkClient } from "@clerk/nextjs/server";
import { SupabaseStoreAssignmentService, SupabaseStoreService } from "../../data";
import type { StoreManagerProfile } from "../../domain";
import { StoreError } from "../../domain";
import type {
  StoreAssignmentRepository,
  StoreRepository,
} from "../../domain/repositories";
import { normalizeUserEmail } from "@/shared/utils/userEmail";

const STORES_MANAGER_ROLE = "stores_manager";
const STORE_ROLE = "store";

const toProfile = (
  email: string,
  fullName: string,
  storeIds: number[],
  stores: StoreManagerProfile["stores"]
): StoreManagerProfile => ({
  email,
  fullName,
  storeIds,
  stores,
});

export class StoreAssignmentApplicationService {
  constructor(
    private readonly storeAssignmentRepository: StoreAssignmentRepository,
    private readonly storeRepository: StoreRepository
  ) {}

  async listAssignedStoreIds(email: string): Promise<number[]> {
    try {
      return await this.storeAssignmentRepository.listStoreIdsByEmail(email);
    } catch {
      throw new StoreError(
        "Failed to load store assignments",
        "STORE_MANAGER_FETCH_FAILED"
      );
    }
  }

  async listManagers(): Promise<StoreManagerProfile[]> {
    try {
      const assignments = await this.storeAssignmentRepository.listAll();
      const byEmail = new Map<string, number[]>();
      for (const row of assignments) {
        const email = normalizeUserEmail(row.email);
        if (!email) continue;
        const current = byEmail.get(email) ?? [];
        current.push(row.store_id);
        byEmail.set(email, current);
      }

      const emails = [...byEmail.keys()];
      if (emails.length === 0) return [];

      const clerk = await clerkClient();
      const users = await clerk.users.getUserList({
        emailAddress: emails,
        limit: 100,
      });

      const stores = await this.storeRepository.getByIds(
        [...new Set(assignments.map((row) => row.store_id))]
      );
      const storeById = new Map(stores.map((store) => [store.id, store]));

      return emails.map((email) => {
        const user = users.data.find((item) =>
          item.emailAddresses.some(
            (address) => normalizeUserEmail(address.emailAddress) === email
          )
        );
        const storeIds = byEmail.get(email) ?? [];
        return toProfile(
          email,
          [user?.firstName, user?.lastName].filter(Boolean).join(" "),
          storeIds,
          storeIds
            .map((id) => storeById.get(id))
            .filter((store): store is NonNullable<typeof store> => Boolean(store))
        );
      });
    } catch (error) {
      if (error instanceof StoreError) throw error;
      throw new StoreError(
        "Failed to load managers",
        "STORE_MANAGER_FETCH_FAILED"
      );
    }
  }

  async assignManager(
    email: string,
    storeIds: number[]
  ): Promise<StoreManagerProfile> {
    const normalizedEmail = normalizeUserEmail(email);
    if (!normalizedEmail) {
      throw new StoreError("Email is required", "STORE_MANAGER_EMAIL_REQUIRED");
    }
    if (storeIds.length === 0) {
      throw new StoreError(
        "At least one store is required",
        "STORE_MANAGER_STORES_REQUIRED"
      );
    }

    const user = await this.requireClerkUserByEmail(normalizedEmail);
    const existingRole =
      typeof user.publicMetadata?.role === "string"
        ? user.publicMetadata.role
        : undefined;
    if (existingRole === "admin") {
      throw new StoreError(
        "Cannot change an admin into a stores manager",
        "STORE_MANAGER_ADMIN_FORBIDDEN"
      );
    }

    const uniqueStoreIds = [...new Set(storeIds)];
    const stores = await this.requireStores(uniqueStoreIds);

    const existingMetadata = (user.publicMetadata ?? {}) as Record<
      string,
      unknown
    >;
    const clerk = await clerkClient();
    await clerk.users.updateUser(user.id, {
      publicMetadata: {
        ...existingMetadata,
        role: STORES_MANAGER_ROLE,
      },
    });

    await this.storeAssignmentRepository.replaceAssignments(
      normalizedEmail,
      uniqueStoreIds
    );

    return toProfile(
      normalizedEmail,
      [user.firstName, user.lastName].filter(Boolean).join(" "),
      uniqueStoreIds,
      stores
    );
  }

  async updateAssignments(
    email: string,
    storeIds: number[]
  ): Promise<StoreManagerProfile> {
    const normalizedEmail = normalizeUserEmail(email);
    if (!normalizedEmail) {
      throw new StoreError(
        "Email is required",
        "STORE_MANAGER_EMAIL_REQUIRED"
      );
    }
    if (storeIds.length === 0) {
      throw new StoreError(
        "At least one store is required",
        "STORE_MANAGER_STORES_REQUIRED"
      );
    }

    const uniqueStoreIds = [...new Set(storeIds)];
    const stores = await this.requireStores(uniqueStoreIds);

    await this.storeAssignmentRepository.replaceAssignments(
      normalizedEmail,
      uniqueStoreIds
    );

    const user = await this.findClerkUserByEmail(normalizedEmail);

    return toProfile(
      normalizedEmail,
      [user?.firstName, user?.lastName].filter(Boolean).join(" "),
      uniqueStoreIds,
      stores
    );
  }

  async demoteManager(email: string): Promise<void> {
    const normalizedEmail = normalizeUserEmail(email);
    if (!normalizedEmail) {
      throw new StoreError(
        "Email is required",
        "STORE_MANAGER_EMAIL_REQUIRED"
      );
    }

    await this.storeAssignmentRepository.deleteByEmail(normalizedEmail);

    const user = await this.findClerkUserByEmail(normalizedEmail);
    if (!user) return;

    const existingRole =
      typeof user.publicMetadata?.role === "string"
        ? user.publicMetadata.role
        : undefined;
    if (existingRole === "admin") return;

    const existingMetadata = (user.publicMetadata ?? {}) as Record<
      string,
      unknown
    >;
    const clerk = await clerkClient();
    await clerk.users.updateUser(user.id, {
      publicMetadata: {
        ...existingMetadata,
        role: STORE_ROLE,
      },
    });
  }

  private async requireStores(storeIds: number[]) {
    const stores = await this.storeRepository.getByIds(storeIds);
    if (stores.length !== storeIds.length) {
      throw new StoreError("One or more stores were not found", "STORE_NOT_FOUND");
    }
    return stores;
  }

  private async findClerkUserByEmail(email: string) {
    const clerk = await clerkClient();
    const found = await clerk.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });
    return found.data[0] ?? null;
  }

  private async requireClerkUserByEmail(email: string) {
    const user = await this.findClerkUserByEmail(email);
    if (!user) {
      throw new StoreError(
        "User must sign in once before they can be made a manager",
        "STORE_MANAGER_NOT_FOUND"
      );
    }
    return user;
  }
}

const storeAssignmentService = new SupabaseStoreAssignmentService();
const storeService = new SupabaseStoreService();
export const storeAssignmentApplicationService =
  new StoreAssignmentApplicationService(storeAssignmentService, storeService);
