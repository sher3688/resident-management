export type ResidentsExportFormat = "json" | "csv";

type ResidentExportRow = Record<string, unknown>;

const RESIDENT_EXPORT_HEADERS = [
  "id",
  "unitNumber",
  "ownerName",
  "ownerPhone",
  "address",
  "coResident1Name",
  "coResident1Phone",
  "coResident2Name",
  "coResident2Phone",
  "coResident3Name",
  "coResident3Phone",
  "coResident4Name",
  "coResident4Phone",
  "carParkingNumber",
  "carPlateNumber",
  "motorcycleParkingNumber",
  "motorcyclePlateNumber",
  "bicycleParkingNumber",
  "squareMeters",
  "waterMeterNumber",
  "electricityMeterNumber",
  "moveInDate",
  "emergencyContactName",
  "emergencyContactPhone",
  "emergencyContactRelation",
  "emergencyContact2Name",
  "emergencyContact2Phone",
  "emergencyContact2Relation",
  "notes",
  "createdAt",
  "updatedAt",
] as const;

export function resolveResidentsExportFormat(value: unknown): ResidentsExportFormat {
  return typeof value === "string" && value.toLowerCase() === "csv" ? "csv" : "json";
}

function serializeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  if (typeof value === "string") {
    return value.includes("\t") || value.includes("\n") || value.includes('"')
      ? `"${value.replace(/"/g, '""')}"`
      : value;
  }

  return String(value);
}

function serializeCsv(rows: ResidentExportRow[]): string {
  return [
    RESIDENT_EXPORT_HEADERS.join("\t"),
    ...rows.map((row) =>
      RESIDENT_EXPORT_HEADERS.map((header) => serializeCsvValue(row[header])).join("\t")
    ),
  ].join("\n");
}

export function serializeResidentsExport(
  rows: ResidentExportRow[],
  format: ResidentsExportFormat
): string {
  return format === "json" ? JSON.stringify(rows, null, 2) : serializeCsv(rows);
}

export function getResidentsExportMetadata(
  format: ResidentsExportFormat,
  date: Date
): { contentType: string; fileName: string } {
  const datePart = date.toISOString().split("T")[0];

  return format === "json"
    ? {
        contentType: "application/json; charset=utf-8",
        fileName: `residents_${datePart}.json`,
      }
    : {
        contentType: "text/csv; charset=utf-8",
        fileName: `residents_${datePart}.csv`,
      };
}
