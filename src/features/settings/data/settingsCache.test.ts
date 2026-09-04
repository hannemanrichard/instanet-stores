import {
  getCachedSettingsMap,
  invalidateSettingsMapCache,
  setCachedSettingsMap,
} from "./settingsCache";

describe("settingsCache", () => {
  beforeEach(() => {
    invalidateSettingsMapCache();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns null when empty", () => {
    expect(getCachedSettingsMap()).toBeNull();
  });

  it("stores and returns the map until TTL expires", () => {
    const map = { facebook_pixel_id: "123" };
    setCachedSettingsMap(map);

    expect(getCachedSettingsMap()).toEqual(map);

    jest.advanceTimersByTime(5 * 60 * 1000);
    expect(getCachedSettingsMap()).toBeNull();
  });

  it("clears the cache on invalidate", () => {
    setCachedSettingsMap({ tiktok_pixel_id: "abc" });
    invalidateSettingsMapCache();
    expect(getCachedSettingsMap()).toBeNull();
  });
});
