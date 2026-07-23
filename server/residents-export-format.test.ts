import { describe, expect, it } from "vitest";
import {
  getResidentsExportMetadata,
  resolveResidentsExportFormat,
  serializeResidentsExport,
} from "./residents-export-format";

describe("resident backup export format contract", () => {
  const exportDate = new Date("2026-07-23T00:00:00.000Z");
  const rows = [
    {
      id: 1,
      unitNumber: "A1-2F",
      createdAt: new Date("2026-07-20T08:00:00.000Z"),
    },
  ];

  it("uses JSON by default and emits a parseable JSON array", () => {
    const format = resolveResidentsExportFormat(undefined);
    const body = serializeResidentsExport(rows, format);
    const metadata = getResidentsExportMetadata(format, exportDate);

    expect(format).toBe("json");
    expect(JSON.parse(body)).toEqual([
      {
        id: 1,
        unitNumber: "A1-2F",
        createdAt: "2026-07-20T08:00:00.000Z",
      },
    ]);
    expect(metadata).toEqual({
      contentType: "application/json; charset=utf-8",
      fileName: "residents_2026-07-23.json",
    });
  });

  it("preserves CSV as an explicit opt-in format", () => {
    const format = resolveResidentsExportFormat("csv");
    const body = serializeResidentsExport(rows, format);
    const metadata = getResidentsExportMetadata(format, exportDate);

    expect(format).toBe("csv");
    expect(body).toContain("unitNumber");
    expect(body).toContain("A1-2F");
    expect(metadata).toEqual({
      contentType: "text/csv; charset=utf-8",
      fileName: "residents_2026-07-23.csv",
    });
  });
});
