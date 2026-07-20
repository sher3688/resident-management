import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createCtx(user?: any): TrpcContext {
  const resolvedUser = user === undefined ? {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    role: "admin",
    loginMethod: "password",
  } : user;

  return {
    user: resolvedUser,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("residents router", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.residents.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("list with search param returns an array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.residents.list({ search: "A101" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("list without auth returns empty array", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    const result = await caller.residents.list({});
    expect(Array.isArray(result)).toBe(true);
  });
})

describe("repairRequests router", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.repairRequests.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("list with status filter returns an array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.repairRequests.list({ status: "pending" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("list without auth should fail", async () => {
    const caller = appRouter.createCaller(createCtx(null));
    try {
      await caller.repairRequests.list({});
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });
})

describe("auth router", () => {
  it("me returns null when not authenticated", async () => {
    const ctx = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user when authenticated", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
  });
});
