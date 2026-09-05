import { consumeRateLimit, resetRateLimitStore } from "./rateLimit";

describe("consumeRateLimit", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows requests within the configured limit", () => {
    const first = consumeRateLimit({
      key: "test",
      limit: 2,
      windowMs: 1000,
      now: 1,
    });
    const second = consumeRateLimit({
      key: "test",
      limit: 2,
      windowMs: 1000,
      now: 2,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
  });

  it("blocks requests after the configured limit", () => {
    consumeRateLimit({ key: "test", limit: 1, windowMs: 1000, now: 1 });
    const blocked = consumeRateLimit({
      key: "test",
      limit: 1,
      windowMs: 1000,
      now: 2,
    });

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);
  });

  it("resets after the time window elapses", () => {
    consumeRateLimit({ key: "test", limit: 1, windowMs: 1000, now: 1 });
    const reset = consumeRateLimit({
      key: "test",
      limit: 1,
      windowMs: 1000,
      now: 1002,
    });

    expect(reset.allowed).toBe(true);
    expect(reset.remaining).toBe(0);
  });
});
