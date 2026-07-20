import { Router } from "express";
import { getDb } from "./db";

export const residentsExportRouter = Router();

/**
 * GET /api/residents/export
 * 匯出所有住戶資料為 CSV 格式
 */
residentsExportRouter.get("/export", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const { residents: residentsTable } = await import("../drizzle/schema");
    const { sql } = await import("drizzle-orm");

    // 查詢所有住戶資料，按戶號排序
    const rows = await db
      .select()
      .from(residentsTable)
      .orderBy(residentsTable.unitNumber);

    // 定義 CSV 欄位
    const headers = [
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
    ];

    // 轉換資料為 CSV 格式
    const csv = [
      headers.join("\t"), // 使用 Tab 作為分隔符以支援中文
      ...rows.map((row: any) =>
        headers
          .map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return "";
            // 處理日期類型
            if (value instanceof Date) {
              return value.toISOString().split('T')[0]; // 格式: YYYY-MM-DD
            }
            if (typeof value === "string") {
              // 移除換行符並用引號包圍包含特殊字符的值
              return value.includes("\t") || value.includes("\n") || value.includes('"')
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            }
            return String(value);
          })
          .join("\t")
      ),
    ].join("\n");

    // 設定回應標頭
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="residents_${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.setHeader("Content-Length", Buffer.byteLength(csv, "utf-8"));

    // 發送 CSV 資料
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export residents data" });
  }
});
