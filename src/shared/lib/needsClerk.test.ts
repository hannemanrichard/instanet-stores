import { needsClerk } from "./needsClerk";

describe("needsClerk", () => {
  it("loads Clerk on the landing page and terms", () => {
    expect(needsClerk("/")).toBe(true);
    expect(needsClerk("/terms")).toBe(true);
  });

  it("loads Clerk on dashboard and auth routes", () => {
    expect(needsClerk("/dashboard")).toBe(true);
    expect(needsClerk("/dashboard/orders")).toBe(true);
    expect(needsClerk("/sign-in")).toBe(true);
    expect(needsClerk("/sign-up")).toBe(true);
    expect(needsClerk("/sign-out")).toBe(true);
  });

  it("skips Clerk on the customer storefront", () => {
    expect(needsClerk(null)).toBe(false);
    expect(needsClerk("/search")).toBe(false);
    expect(needsClerk("/products/some-slug")).toBe(false);
    expect(needsClerk("/thank-you")).toBe(false);
  });
});
