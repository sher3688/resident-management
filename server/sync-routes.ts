/**
 * 同步 API 路由 - resident-management
 * 
 * 端點：POST /api/sync
 * 用途：接收來自另一個系統（community-management）的同步資料推送
 * 驗證：使用 X-Sync-Api-Key 標頭進行 API Key 驗證
 */

import { Router, Request, Response } from "express";
import { handleSyncRequest, SYNC_API_KEY } from "./sync-handler";

const router = Router();

router.post("/sync", async (req: Request, res: Response) => {
  try {
    // 1. 驗證 API Key
    const apiKey = req.headers["x-sync-api-key"];
    if (!apiKey || apiKey !== SYNC_API_KEY) {
      return res.status(401).json({ success: false, message: "Invalid API key" });
    }

    // 2. 檢查來源標頭（防循環）
    const syncSource = req.headers["x-sync-source"];
    if (syncSource === "resident-management") {
      return res.json({ success: true, message: "Skipped - source is self", action: "skipped" });
    }

    // 3. 解析請求
    const syncReq = req.body;
    if (!syncReq.operation || !syncReq.table || !syncReq.data) {
      return res.status(400).json({ success: false, message: "Invalid request body" });
    }

    // 4. 處理同步請求
    const result = await handleSyncRequest(syncReq);

    // 5. 返回結果
    res.json(result);
  } catch (error) {
    console.error("[SYNC] 同步端點錯誤:", error);
    res.status(500).json({
      success: false,
      message: `Internal error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

export default router;
