/**
 * 同步 API 路由 - community-management
 *
 * 端點：POST /api/sync
 * 僅接受具備共享 API 金鑰、來源可驗證且請求格式完整的資料同步事件。
 */

import { Request, Response, Router } from "express";
import { z } from "zod";
import {
  handleSyncRequest,
  checkSyncStorage,
  LOCAL_SYSTEM_ID,
  REMOTE_SYSTEM_ID,
  SYNC_API_KEY,
  type SyncRequest,
  type SyncResponse,
  type SyncStorageHealth,
} from "./sync-handler";

const syncTables = [
  "residents",
  "emergency_contacts",
  "repair_requests",
  "renovation_applications",
  "resource_folders",
  "resource_files",
  "invited_users",
  "parkings",
  "parking_plates",
] as const;

export const syncRequestSchema = z.object({
  operation: z.enum(["create", "update", "delete"]),
  table: z.enum(syncTables),
  data: z.record(z.string(), z.unknown()),
  keyField: z.string().trim().min(1).max(64),
  keyValue: z.unknown().refine(
    (value) => value !== undefined && value !== null && value !== "",
    "keyValue is required",
  ),
  sourceSystem: z.string().trim().min(1).max(64),
  timestamp: z.string().refine(
    (value) => Number.isFinite(Date.parse(value)),
    "timestamp must be a valid ISO-compatible date",
  ),
}).strict();

export type ValidatedSyncRequest = z.infer<typeof syncRequestSchema>;

type SyncHandler = (request: SyncRequest) => Promise<SyncResponse>;
type SyncStorageChecker = () => Promise<SyncStorageHealth>;

export interface SyncRouterOptions {
  apiKey?: string;
  localSystemId?: string;
  remoteSystemId?: string;
  handleRequest?: SyncHandler;
  checkStorage?: SyncStorageChecker;
}

/**
 * 建立同步路由；選項僅供測試注入，正式使用預設集中環境設定。
 */
export function createSyncRouter(options: SyncRouterOptions = {}): Router {
  const router = Router();
  const apiKey = options.apiKey ?? SYNC_API_KEY;
  const localSystemId = options.localSystemId ?? LOCAL_SYSTEM_ID;
  const remoteSystemId = options.remoteSystemId ?? REMOTE_SYSTEM_ID;
  const handleRequest = options.handleRequest ?? handleSyncRequest;
  const checkStorage = options.checkStorage ?? checkSyncStorage;

  router.get("/sync/health", async (req: Request, res: Response) => {
    try {
      const requestApiKey = req.headers["x-sync-api-key"];
      if (typeof requestApiKey !== "string" || !apiKey || requestApiKey !== apiKey) {
        return res.status(401).json({ ready: false, message: "Invalid API key" });
      }

      const result = await checkStorage();
      return res.status(result.ready ? 200 : 503).json(result);
    } catch (error) {
      console.error("[SYNC] 健康檢查端點錯誤:", error);
      return res.status(503).json({ ready: false, message: "Synchronization mapping storage is unavailable" });
    }
  });

  router.post("/sync", async (req: Request, res: Response) => {
    try {
      const requestApiKey = req.headers["x-sync-api-key"];
      if (typeof requestApiKey !== "string" || !apiKey || requestApiKey !== apiKey) {
        return res.status(401).json({ success: false, message: "Invalid API key" });
      }

      const headerSource = req.headers["x-sync-source"];
      if (typeof headerSource !== "string" || !headerSource) {
        return res.status(400).json({ success: false, message: "Missing X-Sync-Source header" });
      }

      const parsed = syncRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request body",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        });
      }

      const syncRequest = parsed.data as SyncRequest;
      if (headerSource !== syncRequest.sourceSystem) {
        return res.status(400).json({ success: false, message: "Sync source header and body do not match" });
      }

      // 跳過本機回送事件，防止「A → B → A」造成無限同步迴圈。
      if (headerSource === localSystemId) {
        return res.json({ success: true, message: "Skipped - source is self", action: "skipped" });
      }

      if (headerSource !== remoteSystemId) {
        return res.status(403).json({ success: false, message: "Unexpected sync source" });
      }

      const result = await handleRequest(syncRequest);
      return res.status(result.success ? 200 : 422).json(result);
    } catch (error) {
      console.error("[SYNC] 同步端點錯誤:", error);
      return res.status(500).json({
        success: false,
        message: "Internal synchronization error",
      });
    }
  });

  return router;
}

export default createSyncRouter();
