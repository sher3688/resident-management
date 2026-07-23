import { Router } from "express";
import { getDb } from "./db";
import {
  getResidentsExportMetadata,
  resolveResidentsExportFormat,
  serializeResidentsExport,
} from "./residents-export-format";

export const residentsExportRouter = Router();

/**
 * GET /api/residents/export
 * 預設匯出所有住戶資料為 JSON；透過 ?format=csv 可明確要求 CSV。
 */
residentsExportRouter.get("/export", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { residents: residentsTable } = await import("../drizzle/schema");

    // 查詢所有住戶資料，按戶號排序。
    const rows = await db
      .select()
      .from(residentsTable)
      .orderBy(residentsTable.unitNumber);

    const rawFormat = Array.isArray(req.query.format) ? req.query.format[0] : req.query.format;
    const format = resolveResidentsExportFormat(rawFormat);
    const body = serializeResidentsExport(rows as Record<string, unknown>[], format);
    const { contentType, fileName } = getResidentsExportMetadata(format, new Date());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", Buffer.byteLength(body, "utf-8"));

    return res.send(body);
  } catch (error) {
    console.error("Export error:", error);
    return res.status(500).json({ error: "Failed to export residents data" });
  }
});
