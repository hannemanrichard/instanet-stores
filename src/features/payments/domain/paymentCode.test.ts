import { generatePaymentCode, PAYMENT_CODE_PATTERN } from "./paymentCode";

describe("generatePaymentCode", () => {
  it("matches PMT- plus 6 alphanumeric characters", () => {
    const code = generatePaymentCode();
    expect(code).toMatch(PAYMENT_CODE_PATTERN);
    expect(code.startsWith("PMT-")).toBe(true);
    expect(code).toHaveLength(10);
  });

  it("generates distinct values", () => {
    const codes = new Set(Array.from({ length: 8 }, () => generatePaymentCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
