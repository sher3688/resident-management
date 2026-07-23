import { asc, eq, gt, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import {
  coResidents,
  emergencyContacts,
  invitedUsers,
  parkings,
  parkingPlates,
  renovationApplications,
  repairRequests,
  residents,
  resourceFiles,
  resourceFolders,
  syncRecordMappings,
} from "../drizzle/schema";
import {
  handleSyncRequest,
  LOCAL_SYSTEM_ID,
  REMOTE_SYSTEM_ID,
  SYNC_API_KEY,
  SYNC_TARGET_URL,
  type SyncResponse,
} from "./sync-handler";

/**
 * 基準回填的處理順序會先完成父項映射，再處理所有仰賴該映射的子項。
 * 住戶的同住人隨住戶頁面傳送；其餘具獨立 CRUD 的子項則使用自己的頁面。
 */
export const baselineSyncTables = [
  "residents",
  "emergency_contacts",
  "parkings",
  "parking_plates",
  "repair_requests",
  "renovation_applications",
  "resource_folders",
  "resource_files",
  "invited_users",
] as const;

export type BaselineSyncTable = (typeof baselineSyncTables)[number];

export const baselinePageQuerySchema = z.object({
  table: z.enum(baselineSyncTables),
  cursor: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
}).strict();

export const baselineRunSchema = baselinePageQuerySchema;

export interface BaselinePage {
  table: BaselineSyncTable;
  records: Array<Record<string, unknown>>;
  nextCursor: number | null;
  hasMore: boolean;
}

export interface BaselineRunSummary {
  success: boolean;
  table: BaselineSyncTable;
  cursor: number;
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  nextCursor: number | null;
  hasMore: boolean;
  retryRequired: boolean;
  errors: string[];
  message: string;
}

export interface SyncMappingSummary {
  ready: boolean;
  originSystem: string;
  counts: Record<string, number>;
  message: string;
}

const DEFAULT_BATCH_LIMIT = 25;

function normalizeLimit(limit?: number): number {
  return Math.min(Math.max(limit ?? DEFAULT_BATCH_LIMIT, 1), 50);
}

async function listRowsById(db: any, entityTable: any, cursor: number, limit: number): Promise<any[]> {
  const query = db.select().from(entityTable);
  const ordered = cursor > 0
    ? query.where(gt(entityTable.id, cursor)).orderBy(asc(entityTable.id))
    : query.orderBy(asc(entityTable.id));
  return ordered.limit(limit + 1);
}

function toPage(table: BaselineSyncTable, rows: Array<Record<string, unknown>>, limit: number): BaselinePage {
  const hasMore = rows.length > limit;
  const records = rows.slice(0, limit);
  const lastId = records.at(-1)?.id;
  return {
    table,
    records,
    nextCursor: hasMore && typeof lastId === "number" ? lastId : null,
    hasMore,
  };
}

async function getResidentsPage(db: any, cursor: number, limit: number): Promise<BaselinePage> {
  // listRowsById 會多取得一筆，供 cursor 分頁正確判斷是否尚有下一頁。
  // 將住戶包裝為包含同住人的 payload 時，不能遺失這一筆 hasMore 資訊。
  const rows = await listRowsById(db, residents, cursor, limit);
  const hasMore = rows.length > limit;
  const pageRows = rows.slice(0, limit);
  const residentIds = pageRows.map((row: { id: number }) => row.id);
  const allCoResidents = residentIds.length > 0
    ? await db.select().from(coResidents).where(inArray(coResidents.residentId, residentIds))
    : [];

  const coResidentsByResidentId = new Map<number, Array<Record<string, unknown>>>();
  for (const coResident of allCoResidents) {
    const existing = coResidentsByResidentId.get(coResident.residentId) ?? [];
    existing.push(coResident);
    coResidentsByResidentId.set(coResident.residentId, existing);
  }

  const records = pageRows.map((row: Record<string, unknown>) => ({
    ...row,
    // 緊急聯絡人與車位在後續專屬頁面處理，避免基準回填造成子資料整批刪除。
    coResidents: coResidentsByResidentId.get(Number(row.id)) ?? [],
  }));
  const lastId = pageRows.at(-1)?.id;

  return {
    table: "residents",
    records,
    nextCursor: hasMore && typeof lastId === "number" ? lastId : null,
    hasMore,
  };
}

/**
 * 來源系統使用此函式分頁輸出既有資料。此函式只讀取資料，不會建立映射或改動任何業務資料。
 */
export async function getBaselinePage(
  table: BaselineSyncTable,
  cursor = 0,
  requestedLimit?: number,
): Promise<BaselinePage> {
  const db = await getDb();
  if (!db) {
    throw new Error("Synchronization database is unavailable");
  }

  const limit = normalizeLimit(requestedLimit);
  switch (table) {
    case "residents":
      return getResidentsPage(db, cursor, limit);
    case "emergency_contacts":
      return toPage(table, await listRowsById(db, emergencyContacts, cursor, limit), limit);
    case "parkings":
      return toPage(table, await listRowsById(db, parkings, cursor, limit), limit);
    case "parking_plates":
      return toPage(table, await listRowsById(db, parkingPlates, cursor, limit), limit);
    case "repair_requests":
      return toPage(table, await listRowsById(db, repairRequests, cursor, limit), limit);
    case "renovation_applications":
      return toPage(table, await listRowsById(db, renovationApplications, cursor, limit), limit);
    case "resource_folders":
      return toPage(table, await listRowsById(db, resourceFolders, cursor, limit), limit);
    case "resource_files":
      return toPage(table, await listRowsById(db, resourceFiles, cursor, limit), limit);
    case "invited_users":
      return toPage(table, await listRowsById(db, invitedUsers, cursor, limit), limit);
  }
}

function identityForRecord(table: BaselineSyncTable, record: Record<string, unknown>): { keyField: string; keyValue: unknown } | null {
  if (table === "invited_users") {
    return record.email ? { keyField: "email", keyValue: record.email } : null;
  }
  return record.id === undefined || record.id === null
    ? null
    : { keyField: "id", keyValue: record.id };
}

function timestampForRecord(record: Record<string, unknown>): string {
  const candidate = record.updatedAt ?? record.createdAt;
  if (candidate instanceof Date) {
    return candidate.toISOString();
  }
  if (typeof candidate === "string" && Number.isFinite(Date.parse(candidate))) {
    return candidate;
  }
  return new Date().toISOString();
}

function countResult(result: SyncResponse, summary: Pick<BaselineRunSummary, "inserted" | "updated" | "skipped">): void {
  if (result.action === "inserted") {
    summary.inserted += 1;
  } else if (result.action === "updated" || result.action === "upserted") {
    summary.updated += 1;
  } else {
    summary.skipped += 1;
  }
}

/**
 * 備援系統使用此函式主動向主系統讀取一頁資料，並逐筆以 baseline 模式寫入本機。
 * 不會呼叫 delete，也不會觸發回送同步；任何失敗都會停止在目前游標，供安全重試。
 */
export async function runBaselinePage(
  input: z.infer<typeof baselineRunSchema>,
): Promise<BaselineRunSummary> {
  const { table, cursor = 0 } = baselineRunSchema.parse(input);
  const limit = normalizeLimit(input.limit);
  const initial: BaselineRunSummary = {
    success: false,
    table,
    cursor,
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    nextCursor: null,
    hasMore: false,
    retryRequired: false,
    errors: [],
    message: "",
  };

  if (LOCAL_SYSTEM_ID !== "community-management") {
    return { ...initial, message: "Baseline import is only available on community-management" };
  }
  if (!SYNC_TARGET_URL || !SYNC_API_KEY) {
    return { ...initial, message: "Synchronization target or API key is not configured" };
  }

  const endpoint = new URL(`${SYNC_TARGET_URL.replace(/\/+$/, "")}/api/sync/baseline`);
  endpoint.searchParams.set("table", table);
  endpoint.searchParams.set("cursor", String(cursor));
  endpoint.searchParams.set("limit", String(limit));

  let page: BaselinePage;
  try {
    const response = await fetch(endpoint, {
      headers: {
        "X-Sync-Source": LOCAL_SYSTEM_ID,
        "X-Sync-Api-Key": SYNC_API_KEY,
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      return { ...initial, message: `Source baseline request failed with HTTP ${response.status}` };
    }
    page = await response.json() as BaselinePage;
  } catch (error) {
    return {
      ...initial,
      message: `Source baseline request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (page.table !== table || !Array.isArray(page.records)) {
    return { ...initial, message: "Source returned an invalid baseline page" };
  }

  const summary = { ...initial, hasMore: Boolean(page.hasMore) };
  for (const record of page.records) {
    const identity = identityForRecord(table, record);
    if (!identity) {
      summary.failed += 1;
      summary.errors.push(`${table}: missing source record identifier`);
      continue;
    }

    const result = await handleSyncRequest({
      operation: "create",
      table,
      data: record,
      keyField: identity.keyField,
      keyValue: identity.keyValue,
      sourceSystem: REMOTE_SYSTEM_ID,
      timestamp: timestampForRecord(record),
      mode: "baseline",
    });
    summary.processed += 1;

    if (!result.success) {
      summary.failed += 1;
      summary.errors.push(`${table}:${String(record.id ?? "record")} - ${result.message}`);
      continue;
    }
    countResult(result, summary);
  }

  if (summary.failed > 0) {
    return {
      ...summary,
      success: false,
      retryRequired: true,
      nextCursor: cursor,
      message: "Baseline page stopped because one or more records failed; retry the same cursor after review",
    };
  }

  return {
    ...summary,
    success: true,
    nextCursor: page.hasMore ? page.nextCursor : null,
    message: page.hasMore ? "Baseline page imported" : "Baseline table imported",
  };
}

/** 只回傳按資料表彙總的映射數量，不回傳任何個資或映射識別。 */
export async function getSyncMappingSummary(originSystem = REMOTE_SYSTEM_ID): Promise<SyncMappingSummary> {
  try {
    const db = await getDb();
    if (!db) {
      return { ready: false, originSystem, counts: {}, message: "Synchronization database is unavailable" };
    }
    const rows = await db
      .select({
        entityType: syncRecordMappings.entityType,
        recordCount: sql<number>`count(*)`,
      })
      .from(syncRecordMappings)
      .where(eq(syncRecordMappings.originSystem, originSystem))
      .groupBy(syncRecordMappings.entityType);

    const counts = Object.fromEntries(rows.map((row: { entityType: string; recordCount: number | string }) => [
      row.entityType,
      Number(row.recordCount),
    ]));
    return { ready: true, originSystem, counts, message: "Synchronization mapping summary is ready" };
  } catch (error) {
    return {
      ready: false,
      originSystem,
      counts: {},
      message: `Synchronization mapping summary is unavailable: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
