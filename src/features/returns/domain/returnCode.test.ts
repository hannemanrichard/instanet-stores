import { generateReturnCode, RETURN_CODE_PATTERN } from "./returnCode";

describe("generateReturnCode", () => {
  it("matches RET- plus 6 alphanumeric characters", () => {
    const code = generateReturnCode();
    expect(code).toMatch(RETURN_CODE_PATTERN);
    expect(code.startsWith("RET-")).toBe(true);
    expect(code).toHaveLength(10);
  });

  it("generates distinct values", () => {
    const codes = new Set(Array.from({ length: 8 }, () => generateReturnCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
