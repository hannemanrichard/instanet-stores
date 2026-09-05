import { DatabaseWrapper } from "@/shared/utils/databaseWrapper";
import { withPerformanceTracking } from "@/shared/utils/performanceMonitor";
import { SupabaseStoreService } from "../../data/storeService";
import { resetStoreCache } from "../../data/storeCache";

jest.mock("@/shared/utils/databaseWrapper");
jest.mock("@/shared/utils/performanceMonitor");
jest.mock("@/infrastructure/supabase/server", () => ({
  supabaseServer: {
    from: jest.fn(),
  },
}));

const mockDatabaseWrapper = DatabaseWrapper as jest.Mocked<typeof DatabaseWrapper>;
const mockWithPerformanceTracking = withPerformanceTracking as jest.MockedFunction<
  typeof withPerformanceTracking
>;

describe("SupabaseStoreService", () => {
  let service: SupabaseStoreService;

  beforeEach(() => {
    jest.clearAllMocks();
    resetStoreCache();
    service = new SupabaseStoreService();
    mockWithPerformanceTracking.mockImplementation(
      async (_className: string, _method: string, fn: () => Promise<unknown>) => fn()
    );
  });

  describe("upsertByEmail", () => {
    it("returns the existing store without updating when profile fields are unchanged", async () => {
      const existingStore = {
        id: 3,
        email: "hannemanrichard7@gmail.com",
        fullname: "Richard Hanneman",
        username: "hannemanrichard7",
        avatar: "https://example.com/avatar.png",
        status: "active",
        created_at: "2026-09-05T00:00:00.000Z",
      };

      mockDatabaseWrapper.executeQuery.mockResolvedValue(existingStore as any);

      const result = await service.upsertByEmail({
        email: "hannemanrichard7@gmail.com",
        fullname: "Richard Hanneman",
        username: "hannemanrichard7",
        avatar: "https://example.com/avatar.png",
      });

      expect(result).toEqual(existingStore);
      expect(mockDatabaseWrapper.executeMutation).not.toHaveBeenCalled();
    });
  });

  describe("getByEmail", () => {
    it("reuses the cached store for repeated lookups", async () => {
      const store = {
        id: 3,
        email: "hannemanrichard7@gmail.com",
        fullname: "Richard Hanneman",
        username: "hannemanrichard7",
        avatar: "https://example.com/avatar.png",
        status: "active",
        created_at: "2026-09-05T00:00:00.000Z",
      };

      mockDatabaseWrapper.executeQuery.mockResolvedValue(store as any);

      const first = await service.getByEmail("hannemanrichard7@gmail.com");
      const second = await service.getByEmail("hannemanrichard7@gmail.com");

      expect(first).toEqual(store);
      expect(second).toEqual(store);
      expect(mockDatabaseWrapper.executeQuery).toHaveBeenCalledTimes(1);
    });
  });
});
