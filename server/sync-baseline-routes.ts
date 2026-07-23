import { Request, Response, Router } from "express";
import {
  baselinePageQuerySchema,
  baselineRunSchema,
  getBaselinePage,
  getSyncMappingSummary,
  runBaselinePage,
  type BaselinePage,
  type BaselineRunSummary,
  type BaselineSyncTable,
  type SyncMappingSummary,
} from "./sync-baseline";
import { LOCAL_SYSTEM_ID, REMOTE_SYSTEM_ID, SYNC_API_KEY } from "./sync-handler";

type BaselinePageReader = (
  table: BaselineSyncTable,
  cursor?: number,
  limit?: number,
) => Promise<BaselinePage>;
type BaselinePageRunner = (input: { table: BaselineSyncTable; cursor?: number; limit?: number }) => Promise<BaselineRunSummary>;
type MappingSummaryReader = () => Promise<SyncMappingSummary>;

export interface SyncBaselineRouterOptions {
  apiKey?: string;
  localSystemId?: string;
  remoteSystemId?: string;
  getPage?: BaselinePageReader;
  runPage?: BaselinePageRunner;
  getMappingSummary?: MappingSummaryReader;
}

function hasAuthorizedKey(req: Request, apiKey: string): boolean {
  const requestApiKey = req.headers["x-sync-api-key"];
  return typeof requestApiKey === "string" && Boolean(apiKey) && requestApiKey === apiKey;
}

function sourceHeader(req: Request): string | null {
  const source = req.headers["x-sync-source"];
  return typeof source === "string" && source.trim() ? source.trim() : null;
}

/**
 * 基準回填 API：
 * - GET /api/sync/baseline：僅由備援端向主端讀取一頁來源資料。
 * - POST /api/sync/baseline/run：僅由備援端在本機執行一頁無刪除回填。
 * - GET /api/sync/mappings/summary：只回傳表格映射數量，不回傳任何住戶或映射內容。
 */
export function createSyncBaselineRouter(options: SyncBaselineRouterOptions = {}): Router {
  const router = Router();
  const apiKey = options.apiKey ?? SYNC_API_KEY;
  const localSystemId = options.localSystemId ?? LOCAL_SYSTEM_ID;
  const remoteSystemId = options.remoteSystemId ?? REMOTE_SYSTEM_ID;
  const getPage = options.getPage ?? getBaselinePage;
  const runPage = options.runPage ?? runBaselinePage;
  const getMappingSummary = options.getMappingSummary ?? getSyncMappingSummary;

  router.get("/sync/baseline", async (req: Request, res: Response) => {
    if (!hasAuthorizedKey(req, apiKey)) {
      return res.status(401).json({ success: false, message: "Invalid API key" });
    }
    if (sourceHeader(req) !== remoteSystemId) {
      return res.status(403).json({ success: false, message: "Unexpected baseline source" });
    }

    const parsed = baselinePageQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid baseline query",
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }

    try {
      const { table, cursor = 0, limit } = parsed.data;
      const page = await getPage(table, cursor, limit);
      return res.status(200).json(page);
    } catch (error) {
      console.error("[SYNC] 基準匯出端點錯誤:", error instanceof Error ? error.message : String(error));
      return res.status(503).json({ success: false, message: "Baseline source is unavailable" });
    }
  });

  router.post("/sync/baseline/run", async (req: Request, res: Response) => {
    if (!hasAuthorizedKey(req, apiKey)) {
      return res.status(401).json({ success: false, message: "Invalid API key" });
    }
    // 只允許備援系統自行啟動回填，主系統與未知來源不可遠端驅動本機回填。
    if (sourceHeader(req) !== localSystemId) {
      return res.status(403).json({ success: false, message: "Baseline run must originate from this system" });
    }

    const parsed = baselineRunSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid baseline run body",
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }

    try {
      const result = await runPage(parsed.data);
      return res.status(result.success ? 200 : 422).json(result);
    } catch (error) {
      console.error("[SYNC] 基準回填端點錯誤:", error instanceof Error ? error.message : String(error));
      return res.status(500).json({ success: false, message: "Baseline import failed" });
    }
  });

  router.get("/sync/mappings/summary", async (req: Request, res: Response) => {
    if (!hasAuthorizedKey(req, apiKey)) {
      return res.status(401).json({ ready: false, message: "Invalid API key" });
    }
    const source = sourceHeader(req);
    if (source !== localSystemId && source !== remoteSystemId) {
      return res.status(403).json({ ready: false, message: "Unexpected mapping summary source" });
    }

    try {
      const result = await getMappingSummary();
      return res.status(result.ready ? 200 : 503).json(result);
    } catch (error) {
      console.error("[SYNC] 映射摘要端點錯誤:", error instanceof Error ? error.message : String(error));
      return res.status(503).json({ ready: false, message: "Synchronization mapping summary is unavailable" });
    }
  });

  return router;
}

export default createSyncBaselineRouter();
