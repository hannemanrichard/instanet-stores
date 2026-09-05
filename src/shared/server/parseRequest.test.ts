import { parsePositiveIntParam, ValidationError } from "./parseRequest";

describe("parsePositiveIntParam", () => {
  it("returns a parsed positive integer", () => {
    expect(parsePositiveIntParam("12", "leadId")).toBe(12);
  });

  it("throws a validation error for invalid values", () => {
    expect(() => parsePositiveIntParam("0", "leadId")).toThrow(ValidationError);
    expect(() => parsePositiveIntParam("abc", "leadId")).toThrow(
      "leadId must be a positive integer"
    );
  });
});
