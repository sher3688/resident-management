import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

export const regulationSettingsRouter = router({
  // 取得目前規約 PDF URL（任何登入者都可讀）
  getRegulation: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.execute(
      `SELECT key, value, description, updated_at FROM system_settings WHERE key = 'regulation_pdf_url'`
    );
    const rows = (result as any).rows || [];
    if (rows.length === 0) {
      return { pdfUrl: null, description: null, updatedAt: null };
    }
    const row = rows[0];
    return {
      pdfUrl: row.value,
      description: row.description,
      updatedAt: row.updated_at,
    };
  }),

  // 更新規約 PDF URL（需要 admin 權限）
  updateRegulation: adminProcedure
    .input(
      z.object({
        pdfUrl: z.string().min(1, "PDF URL 不能為空"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const desc = escapeSql(input.description || "住戶管理規約 PDF 網址");
      const url = escapeSql(input.pdfUrl);
      await db.execute(
        `INSERT INTO system_settings (key, value, description)
         VALUES ('regulation_pdf_url', '${url}', '${desc}')
         ON CONFLICT (key) DO UPDATE SET value = '${url}', updated_at = NOW()`
      );
      return { success: true };
    }),
});
