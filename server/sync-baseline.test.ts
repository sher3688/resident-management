import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  handleSyncRequest: vi.fn(),
}));

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

vi.mock("./sync-handler", () => ({
  LOCAL_SYSTEM_ID: "community-management",
  REMOTE_SYSTEM_ID: "resident-management",
  SYNC_API_KEY: "test-shared-key",
  SYNC_TARGET_URL: "https://primary.example.test",
  handleSyncRequest: state.handleSyncRequest,
}));

import { coResidents, residents } from "../drizzle/schema";
import { getDb } from "./db";
import { getBaselinePage, runBaselinePage } from "./sync-baseline";

const residentPage = {
  table: "residents",
  records: [
    { id: 101, unitNumber: "A-101", updatedAt: "2026-07-23T00:00:00.000Z" },
    { id: 102, unitNumber: "A-102", updatedAt: "2026-07-23T00:00:01.000Z" },
  ],
  nextCursor: 102,
  hasMore: true,
};

function stubSourcePage(page = residentPage) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => page,
  }));
}

describe("runBaselinePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("retries the same page through idempotent create/upsert handling and never emits delete", async () => {
    stubSourcePage();
    const importedRemoteIds = new Set<number>();
    state.handleSyncRequest.mockImplementation(async (request: { operation: string; data: { id: number } }) => {
      if (request.operation !== "create") {
        throw new Error("Baseline must never issue a delete or direct update operation");
      }
      const sourceId = request.data.id;
      if (importedRemoteIds.has(sourceId)) {
        return { success: true, message: "Already mapped", action: "skipped" };
      }
      importedRemoteIds.add(sourceId);
      return { success: true, message: "Inserted", action: "inserted" };
    });

    const first = await runBaselinePage({ table: "residents", cursor: 0, limit: 2 });
    const retry = await runBaselinePage({ table: "residents", cursor: 0, limit: 2 });

    expect(first).toMatchObject({ success: true, inserted: 2, skipped: 0, nextCursor: 102, hasMore: true });
    expect(retry).toMatchObject({ success: true, inserted: 0, skipped: 2, nextCursor: 102, hasMore: true });
    expect(importedRemoteIds).toEqual(new Set([101, 102]));
    expect(state.handleSyncRequest).toHaveBeenCalledTimes(4);
    expect(state.handleSyncRequest.mock.calls.every(([request]) => request.operation === "create")).toBe(true);
    expect(state.handleSyncRequest.mock.calls.every(([request]) => request.mode === "baseline")).toBe(true);
  });

  it("keeps the current cursor on partial failure so the same page can be safely retried", async () => {
    stubSourcePage();
    let failSecondRecord = true;
    const importedRemoteIds = new Set<number>();
    state.handleSyncRequest.mockImplementation(async (request: { data: { id: number } }) => {
      const sourceId = request.data.id;
      if (sourceId === 102 && failSecondRecord) {
        return { success: false, message: "Temporary database outage" };
      }
      if (importedRemoteIds.has(sourceId)) {
        return { success: true, message: "Already mapped", action: "skipped" };
      }
      importedRemoteIds.add(sourceId);
      return { success: true, message: "Inserted", action: "inserted" };
    });

    const interrupted = await runBaselinePage({ table: "residents", cursor: 0, limit: 2 });
    failSecondRecord = false;
    const resumed = await runBaselinePage({ table: "residents", cursor: interrupted.nextCursor ?? 0, limit: 2 });

    expect(interrupted).toMatchObject({
      success: false,
      processed: 2,
      inserted: 1,
      failed: 1,
      retryRequired: true,
      nextCursor: 0,
      hasMore: true,
    });
    expect(resumed).toMatchObject({
      success: true,
      inserted: 1,
      skipped: 1,
      failed: 0,
      retryRequired: false,
      nextCursor: 102,
      hasMore: true,
    });
    expect(importedRemoteIds).toEqual(new Set([101, 102]));
  });

  it("continues to a distinct next page using the returned cursor without replaying prior records", async () => {
    const pages = new Map<number, { table: string; records: Array<{ id: number; unitNumber: string; updatedAt: string }>; nextCursor: number | null; hasMore: boolean }>([
      [0, {
        table: "residents",
        records: [{ id: 201, unitNumber: "B-201", updatedAt: "2026-07-23T00:00:00.000Z" }],
        nextCursor: 201,
        hasMore: true,
      }],
      [201, {
        table: "residents",
        records: [{ id: 202, unitNumber: "B-202", updatedAt: "2026-07-23T00:00:01.000Z" }],
        nextCursor: null,
        hasMore: false,
      }],
    ]);
    const fetchMock = vi.fn(async (input: string | URL) => {
      const cursor = Number(new URL(String(input)).searchParams.get("cursor") ?? "0");
      return { ok: true, json: async () => pages.get(cursor) };
    });
    vi.stubGlobal("fetch", fetchMock);
    const importedRemoteIds = new Set<number>();
    state.handleSyncRequest.mockImplementation(async (request: { data: { id: number }; operation: string }) => {
      expect(request.operation).toBe("create");
      const sourceId = request.data.id;
      if (importedRemoteIds.has(sourceId)) {
        return { success: true, message: "Already mapped", action: "skipped" };
      }
      importedRemoteIds.add(sourceId);
      return { success: true, message: "Inserted", action: "inserted" };
    });

    const firstPage = await runBaselinePage({ table: "residents", cursor: 0, limit: 1 });
    const secondPage = await runBaselinePage({ table: "residents", cursor: firstPage.nextCursor ?? 0, limit: 1 });

    expect(firstPage).toMatchObject({ success: true, processed: 1, inserted: 1, nextCursor: 201, hasMore: true });
    expect(secondPage).toMatchObject({ success: true, processed: 1, inserted: 1, nextCursor: null, hasMore: false });
    expect(importedRemoteIds).toEqual(new Set([201, 202]));
    expect(fetchMock.mock.calls.map(([input]) => new URL(String(input)).searchParams.get("cursor"))).toEqual(["0", "201"]);
  });

  it("preserves resident page continuation after attaching co-residents", async () => {
    const sourceResidents = [
      { id: 1, unitNumber: "C-101" },
      { id: 2, unitNumber: "C-102" },
      { id: 3, unitNumber: "C-103" },
    ];
    const db = {
      select: () => ({
        from: (table: unknown) => {
          if (table === residents) {
            return {
              orderBy: () => ({ limit: async (limit: number) => sourceResidents.slice(0, limit) }),
              where: () => ({ orderBy: () => ({ limit: async (limit: number) => sourceResidents.filter((row) => row.id > 2).slice(0, limit) }) }),
            };
          }
          if (table === coResidents) {
            return { where: async () => [] };
          }
          throw new Error("Unexpected table");
        },
      }),
    };
    vi.mocked(getDb).mockResolvedValue(db as any);

    const firstPage = await getBaselinePage("residents", 0, 2);
    const secondPage = await getBaselinePage("residents", firstPage.nextCursor ?? 0, 2);

    expect(firstPage).toMatchObject({
      hasMore: true,
      nextCursor: 2,
      records: [{ id: 1, coResidents: [] }, { id: 2, coResidents: [] }],
    });
    expect(secondPage).toMatchObject({
      hasMore: false,
      nextCursor: null,
      records: [{ id: 3, coResidents: [] }],
    });
  });

  it("fails before importing when the source request is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const result = await runBaselinePage({ table: "residents", cursor: 0, limit: 2 });

    expect(result).toMatchObject({
      success: false,
      processed: 0,
      retryRequired: false,
      message: "Source baseline request failed with HTTP 503",
    });
    expect(state.handleSyncRequest).not.toHaveBeenCalled();
  });
});
