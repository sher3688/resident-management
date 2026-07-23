import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock("./db", () => ({ getDb: getDbMock }));

import { handleSyncRequest, type SyncRequest } from "./sync-handler";

const validRequest: SyncRequest = {
  operation: "update",
  table: "repair_requests",
  data: { id: 501, unitNumber: "TEST-UNIT", repairDate: "2026-07-23", description: "handler test" },
  keyField: "id",
  keyValue: 501,
  sourceSystem: "resident-management",
  timestamp: "2026-07-23T00:00:00.000Z",
};

describe("handleSyncRequest", () => {
  beforeEach(() => {
    getDbMock.mockReset();
  });

  it("returns a controlled response when the database is unavailable", async () => {
    getDbMock.mockResolvedValue(null);

    await expect(handleSyncRequest(validRequest)).resolves.toEqual({
      success: false,
      message: "Database not available",
    });
  });

  it("returns a controlled response when obtaining a database connection throws", async () => {
    getDbMock.mockRejectedValue(new Error("connection refused"));

    await expect(handleSyncRequest(validRequest)).resolves.toMatchObject({
      success: false,
      message: "Internal error: connection refused",
    });
  });

  it("rejects an unsupported table without attempting database mutations", async () => {
    getDbMock.mockResolvedValue({});

    await expect(handleSyncRequest({ ...validRequest, table: "unsupported_table" })).resolves.toEqual({
      success: false,
      message: "Unknown table: unsupported_table",
    });
  });
});
