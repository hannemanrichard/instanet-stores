import { normalizeUserEmail, resolveUserEmail } from "./userEmail";

describe("normalizeUserEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeUserEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });

  it("returns empty for non-strings", () => {
    expect(normalizeUserEmail(undefined)).toBe("");
    expect(normalizeUserEmail(null)).toBe("");
  });
});

describe("resolveUserEmail", () => {
  it("prefers the primary email", () => {
    expect(
      resolveUserEmail({
        primaryEmailAddress: { emailAddress: "Primary@Shop.com" },
        emailAddresses: [{ emailAddress: "other@shop.com" }],
      })
    ).toBe("primary@shop.com");
  });

  it("falls back to the first email address", () => {
    expect(
      resolveUserEmail({
        emailAddresses: [{ emailAddress: "Store@Shop.com" }],
      })
    ).toBe("store@shop.com");
  });
});
