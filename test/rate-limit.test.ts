import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests within limit", () => {
    const limiter = rateLimit({ intervalMs: 60_000, maxRequests: 3 });

    const r1 = limiter("key-1");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter("key-1");
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter("key-1");
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests over limit", () => {
    const limiter = rateLimit({ intervalMs: 60_000, maxRequests: 2 });

    limiter("key-2");
    limiter("key-2");
    const r3 = limiter("key-2");

    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("tracks different keys independently", () => {
    const limiter = rateLimit({ intervalMs: 60_000, maxRequests: 2 });

    limiter("user-a");
    limiter("user-a");

    const r1 = limiter("user-b");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);

    const r2 = limiter("user-a");
    expect(r2.allowed).toBe(false);
  });

  it("resets after interval expires", async () => {
    const limiter = rateLimit({ intervalMs: 100, maxRequests: 1 });

    limiter("key-3");
    const r2 = limiter("key-3");
    expect(r2.allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 150));

    const r3 = limiter("key-3");
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });
});