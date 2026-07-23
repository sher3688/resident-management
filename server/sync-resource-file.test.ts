import { beforeEach, describe, expect, it, vi } from "vitest";
import { resourceFiles } from "../drizzle/schema";

const state = vi.hoisted(() => ({
  db: null as any,
  resolvedParentIds: [] as unknown[],
  updatedValues: null as Record<string, unknown> | null,
  mappedLocalId: null as number | null,
}));

vi.mock("./db", () => ({
  getDb: vi.fn(async () => state.db),
}));

vi.mock("./sync-mapping", () => ({
  deleteMappingsByLocalRecordIds: vi.fn(async () => undefined),
  deleteRecordMapping: vi.fn(async () => undefined),
  findRecordMapping: vi.fn(async () => null),
  getOriginRecordId: (request: { data?: Record<string, unknown>; keyValue?: unknown }) =>
    request.data?.id === undefined || request.data.id === null
      ? (request.keyValue === undefined || request.keyValue === null ? null : String(request.keyValue))
      : String(request.data.id),
  insertAndGetId: vi.fn(async () => 1),
  isDuplicateOrStaleEvent: vi.fn(() => false),
  omitTransportFields: (data: Record<string, unknown>) => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...values } = data;
    return values;
  },
  resolveMappedParentId: vi.fn(async (_db: unknown, _source: string, _table: string, sourceId: unknown) => {
    state.resolvedParentIds.push(sourceId);
    if (sourceId !== 1) {
      throw new Error(`Unexpected parent source id ${String(sourceId)}`);
    }
    return 30001;
  }),
  upsertRecordMapping: vi.fn(async (_db: unknown, _request: unknown, localId: number) => {
    state.mappedLocalId = localId;
  }),
}));

import { handleSyncRequest } from "./sync-handler";

function createResourceFileDb() {
  const existingFile = { id: 70001 };
  return {
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          limit: async () => table === resourceFiles ? [existingFile] : [],
        }),
      }),
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => {
          if (table === resourceFiles) {
            state.updatedValues = values;
          }
        },
      }),
    }),
  };
}

describe("resource file parent mapping", () => {
  beforeEach(() => {
    state.db = createResourceFileDb();
    state.resolvedParentIds = [];
    state.updatedValues = null;
    state.mappedLocalId = null;
  });

  it("uses the source folder id for natural matching and only writes the resolved local folder id", async () => {
    const result = await handleSyncRequest({
      operation: "create",
      table: "resource_files",
      data: {
        id: 42,
        folderId: 1,
        name: "baseline-resource.pdf",
        fileUrl: "https://example.test/baseline-resource.pdf",
        updatedAt: "2026-07-23T00:00:00.000Z",
      },
      keyField: "id",
      keyValue: 42,
      sourceSystem: "resident-management",
      timestamp: "2026-07-23T00:00:00.000Z",
      mode: "baseline",
    });

    expect(result).toMatchObject({ success: true, action: "upserted" });
    expect(state.resolvedParentIds).toEqual([1, 1]);
    expect(state.updatedValues).toMatchObject({ folderId: 30001, name: "baseline-resource.pdf" });
    expect(state.mappedLocalId).toBe(70001);
  });
});
