import { describe, expect, it } from "vitest";
import {
  getOriginRecordId,
  isDuplicateOrStaleEvent,
  omitTransportFields,
  usesRecordMapping,
} from "./sync-mapping";

describe("sync mapping rules", () => {
  it("uses a source record id from payload before a transport key", () => {
    expect(getOriginRecordId({
      table: "repair_requests",
      keyField: "id",
      keyValue: 11,
      sourceSystem: "resident-management",
      data: { id: 42 },
    })).toBe("42");

    expect(getOriginRecordId({
      table: "repair_requests",
      keyField: "id",
      keyValue: 11,
      sourceSystem: "resident-management",
      data: {},
    })).toBe("11");
  });

  it("recognizes every self-incrementing synchronized table that requires a mapping", () => {
    for (const table of [
      "residents",
      "emergency_contacts",
      "repair_requests",
      "renovation_applications",
      "resource_folders",
      "resource_files",
      "parkings",
      "parking_plates",
    ]) {
      expect(usesRecordMapping(table)).toBe(true);
    }
    expect(usesRecordMapping("invited_users")).toBe(false);
  });

  it("skips only duplicate or older source events when a mapping has a valid timestamp", () => {
    const mapping = {
      id: 1,
      localRecordId: "101",
      sourceUpdatedAt: "2026-07-23T00:00:01.000Z",
    };

    expect(isDuplicateOrStaleEvent(mapping, "2026-07-23T00:00:01.000Z")).toBe(true);
    expect(isDuplicateOrStaleEvent(mapping, "2026-07-23T00:00:00.000Z")).toBe(true);
    expect(isDuplicateOrStaleEvent(mapping, "2026-07-23T00:00:02.000Z")).toBe(false);
    expect(isDuplicateOrStaleEvent(mapping, undefined)).toBe(false);
  });

  it("does not persist a remote database id in local record values", () => {
    const source = { id: 55, unitNumber: "TEST-UNIT", description: "safe test value" };
    expect(omitTransportFields(source)).toEqual({ unitNumber: "TEST-UNIT", description: "safe test value" });
    expect(source).toEqual({ id: 55, unitNumber: "TEST-UNIT", description: "safe test value" });
  });
});
