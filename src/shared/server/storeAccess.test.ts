import {
  assertStoreAccess,
  ForbiddenError,
  resolveScopeStoreIds,
} from "./storeAccess";

describe("resolveScopeStoreIds", () => {
  it("lets admin see all stores when no id is requested", () => {
    expect(
      resolveScopeStoreIds({ role: "admin", storeIds: null }, null)
    ).toBeUndefined();
  });

  it("lets admin filter to a requested store", () => {
    expect(
      resolveScopeStoreIds({ role: "admin", storeIds: null }, 4)
    ).toEqual([4]);
  });

  it("locks a store user to their assigned store and ignores client storeId", () => {
    expect(
      resolveScopeStoreIds({ role: "store", storeIds: [2] }, 99)
    ).toEqual([2]);
  });

  it("returns the store user's own id when omitted", () => {
    expect(
      resolveScopeStoreIds({ role: "store", storeIds: [2] }, null)
    ).toEqual([2]);
  });

  it("lets a manager use all assigned stores", () => {
    expect(
      resolveScopeStoreIds(
        { role: "stores_manager", storeIds: [3, 8] },
        null
      )
    ).toEqual([3, 8]);
  });

  it("lets a manager filter to an assigned store", () => {
    expect(
      resolveScopeStoreIds(
        { role: "stores_manager", storeIds: [3, 8] },
        8
      )
    ).toEqual([8]);
  });

  it("rejects a manager requesting an unassigned store", () => {
    expect(() =>
      resolveScopeStoreIds(
        { role: "stores_manager", storeIds: [3, 8] },
        12
      )
    ).toThrow(ForbiddenError);
  });

  it("returns an empty list when a manager has no assignments", () => {
    expect(
      resolveScopeStoreIds({ role: "stores_manager", storeIds: [] }, null)
    ).toEqual([]);
  });
});

describe("assertStoreAccess", () => {
  it("allows admin for any store id", () => {
    expect(() =>
      assertStoreAccess({ role: "admin", storeIds: null }, 99)
    ).not.toThrow();
  });

  it("rejects a missing store id", () => {
    expect(() =>
      assertStoreAccess({ role: "admin", storeIds: null }, null)
    ).toThrow(ForbiddenError);
  });

  it("rejects a manager for an unassigned store", () => {
    expect(() =>
      assertStoreAccess({ role: "stores_manager", storeIds: [1] }, 2)
    ).toThrow(ForbiddenError);
  });
});
