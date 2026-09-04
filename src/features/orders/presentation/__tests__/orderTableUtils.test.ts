import { getOrderStatusTone } from "../orderTableUtils";

describe("getOrderStatusTone", () => {
  it("maps order statuses to the expected pill tones", () => {
    expect(getOrderStatusTone("initial")).toBe("info");
    expect(getOrderStatusTone("processing")).toBe("warning");
    expect(getOrderStatusTone("returned")).toBe("error");
    expect(getOrderStatusTone("delivered")).toBe("success");
  });

  it("falls back to neutral for unknown statuses", () => {
    expect(getOrderStatusTone("archived")).toBe("neutral");
    expect(getOrderStatusTone(undefined)).toBe("neutral");
  });
});
