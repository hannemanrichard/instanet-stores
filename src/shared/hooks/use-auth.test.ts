import { resolveDashboardRole, CATALOG_ROLES } from "./use-auth";

describe("resolveDashboardRole", () => {
  it("returns null when signed out", () => {
    expect(resolveDashboardRole("admin", false)).toBeNull();
  });

  it("keeps admin as assigned in Clerk", () => {
    expect(resolveDashboardRole("admin", true)).toBe("admin");
  });

  it("keeps stores_manager as assigned in-app", () => {
    expect(resolveDashboardRole("stores_manager", true)).toBe("stores_manager");
  });

  it("maps store and legacy partner to store", () => {
    expect(resolveDashboardRole("store", true)).toBe("store");
    expect(resolveDashboardRole("partner", true)).toBe("store");
    expect(resolveDashboardRole(undefined, true)).toBe("store");
  });
});

describe("CATALOG_ROLES", () => {
  it("includes admin and stores managers only", () => {
    expect(CATALOG_ROLES).toEqual(["admin", "stores_manager"]);
  });
});
