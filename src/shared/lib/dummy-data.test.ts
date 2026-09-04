import { isDummyDataEnabled } from "./dummy-data";

describe("isDummyDataEnabled", () => {
  const original = process.env.NEXT_PUBLIC_USE_DUMMY_DATA;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_USE_DUMMY_DATA;
    } else {
      process.env.NEXT_PUBLIC_USE_DUMMY_DATA = original;
    }
  });

  it("is disabled by default", () => {
    delete process.env.NEXT_PUBLIC_USE_DUMMY_DATA;
    expect(isDummyDataEnabled()).toBe(false);
  });

  it("is enabled only when NEXT_PUBLIC_USE_DUMMY_DATA=true", () => {
    process.env.NEXT_PUBLIC_USE_DUMMY_DATA = "true";
    expect(isDummyDataEnabled()).toBe(true);
  });

  it("stays disabled for other flag values", () => {
    process.env.NEXT_PUBLIC_USE_DUMMY_DATA = "false";
    expect(isDummyDataEnabled()).toBe(false);
  });
});
