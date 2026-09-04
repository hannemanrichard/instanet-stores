import { resolveDashboardHomeScope } from "../domain/dashboardHomeScope";

describe("resolveDashboardHomeScope", () => {
  it("uses the whole platform for admin", () => {
    expect(resolveDashboardHomeScope("admin")).toBe("platform");
  });

  it("scopes a stores manager to assigned stores", () => {
    expect(resolveDashboardHomeScope("stores_manager")).toBe("assigned");
  });

  it("keeps a store user on their own store", () => {
    expect(resolveDashboardHomeScope("store")).toBe("store");
    expect(resolveDashboardHomeScope(null)).toBe("store");
  });
});
