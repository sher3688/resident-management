import { and, eq, inArray } from "drizzle-orm";
import { syncRecordMappings } from "../drizzle/schema";

export interface SyncIdentityRequest {
  table: string;
  keyField: string;
  keyValue: unknown;
  sourceSystem: string;
  timestamp?: string;
  data?: Record<string, unknown>;
}

export interface SyncRecordMapping {
  id: number;
  localRecordId: string;
  sourceUpdatedAt: string | null;
}

/**
 * 下列資料表使用本機自增 ID，因此需以來源系統與來源記錄 ID 建立可重複使用的映射。
 */
export const mappedSyncTables = new Set([
  "residents",
  "emergency_contacts",
  "repair_requests",
  "renovation_applications",
  "resource_folders",
  "resource_files",
  "parkings",
  "parking_plates",
]);

export function usesRecordMapping(table: string): boolean {
  return mappedSyncTables.has(table);
}

export function getOriginRecordId(req: SyncIdentityRequest): string | null {
  const dataId = req.data?.id;
  const candidate = dataId ?? req.keyValue;
  if (candidate === undefined || candidate === null || candidate === "") {
    return null;
  }
  return String(candidate);
}

export async function findRecordMapping(
  db: any,
  req: SyncIdentityRequest,
): Promise<SyncRecordMapping | null> {
  const originRecordId = getOriginRecordId(req);
  if (!originRecordId) {
    return null;
  }

  const found = await db
    .select({
      id: syncRecordMappings.id,
      localRecordId: syncRecordMappings.localRecordId,
      sourceUpdatedAt: syncRecordMappings.sourceUpdatedAt,
    })
    .from(syncRecordMappings)
    .where(
      and(
        eq(syncRecordMappings.originSystem, req.sourceSystem),
        eq(syncRecordMappings.entityType, req.table),
        eq(syncRecordMappings.originRecordId, originRecordId),
      ),
    )
    .limit(1);

  if (!found[0]?.localRecordId) {
    return null;
  }

  return {
    id: Number(found[0].id),
    localRecordId: String(found[0].localRecordId),
    sourceUpdatedAt: found[0].sourceUpdatedAt ? String(found[0].sourceUpdatedAt) : null,
  };
}

export async function findMappedLocalId(
  db: any,
  req: SyncIdentityRequest,
): Promise<string | null> {
  return (await findRecordMapping(db, req))?.localRecordId ?? null;
}

/** Return true when the received event is older than or equal to the last applied source event. */
export function isDuplicateOrStaleEvent(
  mapping: SyncRecordMapping | null,
  incomingTimestamp?: string,
): boolean {
  if (!mapping?.sourceUpdatedAt || !incomingTimestamp) {
    return false;
  }

  const previousTime = Date.parse(mapping.sourceUpdatedAt);
  const incomingTime = Date.parse(incomingTimestamp);
  return Number.isFinite(previousTime) && Number.isFinite(incomingTime) && incomingTime <= previousTime;
}

export async function upsertRecordMapping(
  db: any,
  req: SyncIdentityRequest,
  localRecordId: string | number,
): Promise<void> {
  const originRecordId = getOriginRecordId(req);
  if (!originRecordId) {
    throw new Error(`Missing source record identifier for ${req.table}`);
  }

  const existing = await findRecordMapping(db, req);
  const values = {
    localRecordId: String(localRecordId),
    sourceUpdatedAt: req.timestamp ?? null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(syncRecordMappings)
      .set(values)
      .where(eq(syncRecordMappings.id, existing.id));
    return;
  }

  await db.insert(syncRecordMappings).values({
    originSystem: req.sourceSystem,
    entityType: req.table,
    originRecordId,
    ...values,
    createdAt: new Date(),
  });
}

export async function deleteRecordMapping(
  db: any,
  req: SyncIdentityRequest,
): Promise<void> {
  const originRecordId = getOriginRecordId(req);
  if (!originRecordId) {
    return;
  }

  await db
    .delete(syncRecordMappings)
    .where(
      and(
        eq(syncRecordMappings.originSystem, req.sourceSystem),
        eq(syncRecordMappings.entityType, req.table),
        eq(syncRecordMappings.originRecordId, originRecordId),
      ),
    );
}

/** Remove mappings for local child records deleted by a cascading parent operation. */
export async function deleteMappingsByLocalRecordIds(
  db: any,
  entityType: string,
  localRecordIds: Array<string | number>,
): Promise<void> {
  const ids = localRecordIds.map(String).filter(Boolean);
  if (ids.length === 0) {
    return;
  }

  await db
    .delete(syncRecordMappings)
    .where(
      and(
        eq(syncRecordMappings.entityType, entityType),
        inArray(syncRecordMappings.localRecordId, ids),
      ),
    );
}

/** Resolve a foreign-key value owned by the source system to the local mapped record ID. */
export async function resolveMappedParentId(
  db: any,
  sourceSystem: string,
  parentTable: string,
  sourceParentId: unknown,
): Promise<number | null> {
  if (sourceParentId === undefined || sourceParentId === null || sourceParentId === "") {
    return null;
  }

  const localRecordId = await findMappedLocalId(db, {
    table: parentTable,
    keyField: "id",
    keyValue: sourceParentId,
    sourceSystem,
    data: { id: sourceParentId },
  });

  if (!localRecordId || !Number.isSafeInteger(Number(localRecordId))) {
    return null;
  }

  return Number(localRecordId);
}

/** Remove only transport-specific identity from an incoming record before persistence. */
export function omitTransportFields(data: Record<string, unknown>): Record<string, unknown> {
  const cleanData = { ...data };
  delete cleanData.id;
  return cleanData;
}

/**
 * Return the generated primary key after inserting into either MySQL/TiDB or PostgreSQL through Drizzle.
 */
export async function insertAndGetId(
  db: any,
  table: any,
  values: Record<string, unknown>,
): Promise<number | null> {
  const insertQuery = db.insert(table).values(values);

  if (typeof insertQuery.returning === "function") {
    const returned = await insertQuery.returning({ id: table.id });
    const returnedId = returned?.[0]?.id;
    return returnedId === undefined || returnedId === null ? null : Number(returnedId);
  }

  const result = await insertQuery;
  const insertedId = result?.[0]?.insertId ?? result?.insertId;
  return insertedId === undefined || insertedId === null ? null : Number(insertedId);
}
