/**
 * 雙向同步處理邏輯 - community-management (MySQL)
 *
 * 自增 ID 僅在本機資料庫有效。此模組使用 sync_record_mappings 保存來源系統
 * 記錄與本機記錄的對應，讓 create → update → delete 在兩個資料庫 ID 不同時仍可正確執行。
 */

import { getDb } from "./db";
import { ENV } from "./_core/env";
import {
  deleteMappingsByLocalRecordIds,
  deleteRecordMapping,
  findRecordMapping,
  getOriginRecordId,
  insertAndGetId,
  isDuplicateOrStaleEvent,
  omitTransportFields,
  resolveMappedParentId,
  upsertRecordMapping,
} from "./sync-mapping";

const SYNC_API_KEY = ENV.syncApiKey;
const SYNC_TARGET_URL = ENV.syncTargetUrl.replace(/\/+$/, "");
const LOCAL_SYSTEM_ID = ENV.syncSystemId;
const REMOTE_SYSTEM_ID = LOCAL_SYSTEM_ID === "community-management" ? "resident-management" : "community-management";

type SyncOperation = "create" | "update" | "delete";

export interface SyncRequest {
  operation: SyncOperation;
  table: string;
  data: Record<string, any>;
  keyField: string;
  keyValue: unknown;
  sourceSystem: string;
  timestamp: string;
}

export interface SyncResponse {
  success: boolean;
  message: string;
  action?: "inserted" | "updated" | "deleted" | "skipped" | "upserted";
}

/**
 * 將本機異動安全傳送至另一系統。缺少部署環境設定或遠端失敗時不影響原本的 CRUD。
 */
export async function syncToRemote(
  operation: SyncOperation,
  table: string,
  data: Record<string, any>,
  keyField: string,
  keyValue: unknown,
): Promise<void> {
  if (!SYNC_TARGET_URL || !SYNC_API_KEY) {
    console.warn("[SYNC] 缺少 SYNC_TARGET_URL 或 SYNC_API_KEY，跳過同步");
    return;
  }

  try {
    const response = await fetch(`${SYNC_TARGET_URL}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sync-Source": LOCAL_SYSTEM_ID,
        "X-Sync-Api-Key": SYNC_API_KEY,
      },
      body: JSON.stringify({
        operation,
        table,
        data,
        keyField,
        keyValue,
        sourceSystem: LOCAL_SYSTEM_ID,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[SYNC] 同步失敗: ${table} ${operation} - ${response.status}: ${errorText}`);
      return;
    }

    console.log(`[SYNC] 同步成功: ${table} ${operation}`);
  } catch (error) {
    console.warn(`[SYNC] 同步請求異常: ${table} ${operation} - ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** 處理接收到的同步請求。 */
export async function handleSyncRequest(req: SyncRequest): Promise<SyncResponse> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    switch (req.table) {
      case "residents":
        return await syncResident(db, req);
      case "emergency_contacts":
        return await syncEmergencyContact(db, req);
      case "repair_requests":
        return await syncRepairRequest(db, req);
      case "renovation_applications":
        return await syncRenovationApplication(db, req);
      case "resource_folders":
        return await syncResourceFolder(db, req);
      case "resource_files":
        return await syncResourceFile(db, req);
      case "invited_users":
        return await syncInvitedUser(db, req);
      case "parkings":
        return await syncParking(db, req);
      case "parking_plates":
        return await syncParkingPlate(db, req);
      default:
        return { success: false, message: `Unknown table: ${req.table}` };
    }
  } catch (error) {
    console.error(`[SYNC] 處理同步請求失敗: ${req.table} ${req.operation}`, error);
    return { success: false, message: `Internal error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

function preparedData(data: Record<string, any>): Record<string, any> {
  const values = omitTransportFields(data ?? {});
  // 時間戳以本機寫入時間為準；來源事件時間存放於映射表，供衝突與重播判斷使用。
  delete values.createdAt;
  delete values.updatedAt;
  return values;
}

async function requireMappedParentId(
  db: any,
  sourceSystem: string,
  parentTable: string,
  sourceParentId: unknown,
  field: string,
): Promise<number> {
  const localId = await resolveMappedParentId(db, sourceSystem, parentTable, sourceParentId);
  if (localId === null) {
    throw new Error(`Missing mapped ${parentTable} for ${field}=${String(sourceParentId)}`);
  }
  return localId;
}

type DataTransformer = (data: Record<string, any>) => Promise<Record<string, any>>;
type ExistingFinder = (data: Record<string, any>) => Promise<{ id: number } | null>;

/**
 * 共用的自增 ID 資料表同步實作。
 *
 * 1. 先以 (sourceSystem, entityType, sourceRecordId) 查映射。
 * 2. 沒有映射時，僅使用明確的自然鍵做一次安全比對；找不到則建立本機新記錄。
 * 3. 以接收時間戳拒絕重複或過時事件，並在成功後更新映射。
 */
async function syncMappedRecord(
  db: any,
  req: SyncRequest,
  entityTable: any,
  label: string,
  transform?: DataTransformer,
  findExisting?: ExistingFinder,
): Promise<SyncResponse> {
  if (!getOriginRecordId(req)) {
    return { success: false, message: `${label} requires a source record id` };
  }

  const mapping = await findRecordMapping(db, req);
  if (isDuplicateOrStaleEvent(mapping, req.timestamp)) {
    return { success: true, message: "Skipped - duplicate or stale source event", action: "skipped" };
  }

  if (req.operation === "delete") {
    // 未建立來源映射時不能安全判斷本機哪一筆應刪除；採取 no-op 而非自然鍵猜測，避免誤刪。
    if (!mapping) {
      return { success: true, message: `Skipped - no mapping for ${label} delete`, action: "skipped" };
    }

    const { eq } = await import("drizzle-orm");
    await db.delete(entityTable).where(eq(entityTable.id, Number(mapping.localRecordId)));
    await deleteRecordMapping(db, req);
    return { success: true, message: `${label} deleted`, action: "deleted" };
  }

  let values = preparedData(req.data);
  if (transform) {
    values = await transform(values);
  }

  let localRecordId: number | null = mapping ? Number(mapping.localRecordId) : null;
  if (!localRecordId && findExisting) {
    const naturalMatch = await findExisting(values);
    localRecordId = naturalMatch?.id ?? null;
  }

  if (localRecordId !== null) {
    const { eq } = await import("drizzle-orm");
    await db.update(entityTable).set(values).where(eq(entityTable.id, localRecordId));
    await upsertRecordMapping(db, req, localRecordId);
    return { success: true, message: `${label} updated`, action: mapping ? "updated" : "upserted" };
  }

  const insertedId = await insertAndGetId(db, entityTable, values);
  if (insertedId === null) {
    throw new Error(`Unable to determine local id after inserting ${label}`);
  }

  await upsertRecordMapping(db, req, insertedId);
  return { success: true, message: `${label} inserted`, action: "inserted" };
}

// ─── 住戶同步 ──────────────────────────────────────────────────────────────────────

async function syncResident(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { residents, coResidents, emergencyContacts, parkings, parkingPlates } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const unitNumber = req.data?.unitNumber;
  if (!unitNumber) {
    return { success: false, message: "Missing unitNumber" };
  }

  const mapping = await findRecordMapping(db, req);
  if (isDuplicateOrStaleEvent(mapping, req.timestamp)) {
    return { success: true, message: "Skipped - duplicate or stale source event", action: "skipped" };
  }

  const existing = mapping
    ? await db.select().from(residents).where(eq(residents.id, Number(mapping.localRecordId))).limit(1)
    : await db.select().from(residents).where(eq(residents.unitNumber, unitNumber)).limit(1);
  const resident = existing[0] ?? null;

  if (req.operation === "delete") {
    // 單位號不是跨系統不可變 ID；沒有映射時不可用它猜測並刪除本機住戶。
    if (!mapping) {
      return { success: true, message: "Skipped - no mapping for resident delete", action: "skipped" };
    }

    if (resident) {
      const parkingRows = await db.select({ id: parkings.id }).from(parkings).where(eq(parkings.residentId, resident.id));
      const parkingIds = parkingRows.map((row: { id: number }) => row.id);
      const contactRows = await db.select({ id: emergencyContacts.id }).from(emergencyContacts).where(eq(emergencyContacts.residentId, resident.id));
      const contactIds = contactRows.map((row: { id: number }) => row.id);
      const coResidentRows = await db.select({ id: coResidents.id }).from(coResidents).where(eq(coResidents.residentId, resident.id));

      for (const parkingId of parkingIds) {
        await db.delete(parkingPlates).where(eq(parkingPlates.parkingId, parkingId));
      }
      await db.delete(parkings).where(eq(parkings.residentId, resident.id));
      await db.delete(emergencyContacts).where(eq(emergencyContacts.residentId, resident.id));
      await db.delete(coResidents).where(eq(coResidents.residentId, resident.id));
      await db.delete(residents).where(eq(residents.id, resident.id));

      await deleteMappingsByLocalRecordIds(db, "parking_plates", parkingIds);
      await deleteMappingsByLocalRecordIds(db, "parkings", parkingIds);
      await deleteMappingsByLocalRecordIds(db, "emergency_contacts", contactIds);
      await deleteMappingsByLocalRecordIds(db, "co_residents", coResidentRows.map((row: { id: number }) => row.id));
    }

    await deleteRecordMapping(db, req);
    return { success: true, message: "Resident deleted", action: "deleted" };
  }

  const residentData = preparedData(req.data);
  delete residentData.emergencyContacts;
  delete residentData.coResidents;
  delete residentData.parkings;

  let residentId: number;
  if (resident) {
    // 防止尚無映射的舊資料被較舊來源事件覆蓋。
    if (!mapping && resident.updatedAt && req.data.updatedAt && new Date(resident.updatedAt).getTime() > new Date(req.data.updatedAt).getTime()) {
      await upsertRecordMapping(db, req, resident.id);
      return { success: true, message: "Skipped - local resident is newer", action: "skipped" };
    }
    await db.update(residents).set(residentData).where(eq(residents.id, resident.id));
    residentId = resident.id;
  } else {
    const insertedId = await insertAndGetId(db, residents, residentData);
    if (insertedId === null) {
      throw new Error("Unable to determine local resident id after insert");
    }
    residentId = insertedId;
  }
  await upsertRecordMapping(db, req, residentId);

  if (Array.isArray(req.data.coResidents)) {
    await db.delete(coResidents).where(eq(coResidents.residentId, residentId));
    for (const coResident of req.data.coResidents) {
      if (!coResident?.name) continue;
      await db.insert(coResidents).values({
        residentId,
        name: coResident.name,
        phone: coResident.phone ?? null,
      });
    }
  }

  if (Array.isArray(req.data.emergencyContacts)) {
    const oldContacts = await db.select({ id: emergencyContacts.id }).from(emergencyContacts).where(eq(emergencyContacts.residentId, residentId));
    await db.delete(emergencyContacts).where(eq(emergencyContacts.residentId, residentId));
    await deleteMappingsByLocalRecordIds(db, "emergency_contacts", oldContacts.map((row: { id: number }) => row.id));

    for (const contact of req.data.emergencyContacts) {
      if (!contact?.name) continue;
      const contactId = await insertAndGetId(db, emergencyContacts, {
        residentId,
        name: contact.name,
        phone: contact.phone ?? null,
        relationship: contact.relationship ?? contact.relation ?? null,
        address: contact.address ?? null,
      });
      if (contactId !== null && contact.id !== undefined && contact.id !== null) {
        await upsertRecordMapping(db, { ...req, table: "emergency_contacts", keyField: "id", keyValue: contact.id, data: contact }, contactId);
      }
    }
  }

  if (Array.isArray(req.data.parkings)) {
    const oldParkings = await db.select({ id: parkings.id }).from(parkings).where(eq(parkings.residentId, residentId));
    const oldParkingIds = oldParkings.map((row: { id: number }) => row.id);
    for (const parkingId of oldParkingIds) {
      await db.delete(parkingPlates).where(eq(parkingPlates.parkingId, parkingId));
    }
    await db.delete(parkings).where(eq(parkings.residentId, residentId));
    await deleteMappingsByLocalRecordIds(db, "parking_plates", oldParkingIds);
    await deleteMappingsByLocalRecordIds(db, "parkings", oldParkingIds);

    for (const parking of req.data.parkings) {
      if (!parking?.type || !parking?.number) continue;
      const parkingId = await insertAndGetId(db, parkings, {
        residentId,
        type: parking.type,
        number: parking.number,
        plate: parking.plate ?? null,
      });
      if (parkingId === null) continue;
      if (parking.id !== undefined && parking.id !== null) {
        await upsertRecordMapping(db, { ...req, table: "parkings", keyField: "id", keyValue: parking.id, data: parking }, parkingId);
      }
      const plates = Array.isArray(parking.plates) ? parking.plates : Array.isArray(parking.parkingPlates) ? parking.parkingPlates : [];
      for (const plate of plates) {
        if (!plate?.plate) continue;
        const plateId = await insertAndGetId(db, parkingPlates, { parkingId, plate: plate.plate });
        if (plateId !== null && plate.id !== undefined && plate.id !== null) {
          await upsertRecordMapping(db, { ...req, table: "parking_plates", keyField: "id", keyValue: plate.id, data: plate }, plateId);
        }
      }
    }
  }

  return { success: true, message: resident ? "Resident updated" : "Resident inserted", action: resident ? "updated" : "inserted" };
}

// ─── 自增 ID 子資料同步 ───────────────────────────────────────────────────────────

async function syncEmergencyContact(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { emergencyContacts } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    emergencyContacts,
    "Emergency contact",
    async (data) => ({
      ...data,
      residentId: await requireMappedParentId(db, req.sourceSystem, "residents", data.residentId, "residentId"),
    }),
    async (data) => {
      const residentId = await requireMappedParentId(db, req.sourceSystem, "residents", data.residentId, "residentId");
      const matches = await db.select({ id: emergencyContacts.id }).from(emergencyContacts).where(and(eq(emergencyContacts.residentId, residentId), eq(emergencyContacts.name, data.name))).limit(2);
      return matches.length === 1 ? matches[0] : null;
    },
  );
}

async function syncRepairRequest(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { repairRequests } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    repairRequests,
    "Repair request",
    undefined,
    async (data) => {
      const matches = await db.select({ id: repairRequests.id }).from(repairRequests).where(and(eq(repairRequests.unitNumber, data.unitNumber), eq(repairRequests.repairDate, data.repairDate), eq(repairRequests.description, data.description))).limit(2);
      return matches.length === 1 ? matches[0] : null;
    },
  );
}

async function syncRenovationApplication(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { renovationApplications } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    renovationApplications,
    "Renovation application",
    undefined,
    async (data) => {
      const matches = await db.select({ id: renovationApplications.id }).from(renovationApplications).where(and(eq(renovationApplications.unitNumber, data.unitNumber), eq(renovationApplications.applicationDate, data.applicationDate), eq(renovationApplications.constructionContent, data.constructionContent))).limit(2);
      return matches.length === 1 ? matches[0] : null;
    },
  );
}

async function syncResourceFolder(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { resourceFolders } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    resourceFolders,
    "Resource folder",
    undefined,
    async (data) => {
      const matches = await db.select({ id: resourceFolders.id }).from(resourceFolders).where(eq(resourceFolders.name, data.name)).limit(2);
      return matches.length === 1 ? matches[0] : null;
    },
  );
}

async function syncResourceFile(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { resourceFiles } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    resourceFiles,
    "Resource file",
    async (data) => ({
      ...data,
      folderId: await requireMappedParentId(db, req.sourceSystem, "resource_folders", data.folderId, "folderId"),
    }),
    async (data) => {
      const folderId = await requireMappedParentId(db, req.sourceSystem, "resource_folders", data.folderId, "folderId");
      const matches = await db.select({ id: resourceFiles.id }).from(resourceFiles).where(and(eq(resourceFiles.folderId, folderId), eq(resourceFiles.name, data.name), eq(resourceFiles.fileUrl, data.fileUrl))).limit(2);
      return matches.length === 1 ? matches[0] : null;
    },
  );
}

async function syncParking(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { parkings } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    parkings,
    "Parking",
    async (data) => ({
      ...data,
      residentId: await requireMappedParentId(db, req.sourceSystem, "residents", data.residentId, "residentId"),
    }),
    async (data) => {
      const residentId = await requireMappedParentId(db, req.sourceSystem, "residents", data.residentId, "residentId");
      const matches = await db.select({ id: parkings.id }).from(parkings).where(and(eq(parkings.residentId, residentId), eq(parkings.type, data.type), eq(parkings.number, data.number))).limit(2);
      return matches.length === 1 ? matches[0] : null;
    },
  );
}

async function syncParkingPlate(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { parkingPlates } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    parkingPlates,
    "Parking plate",
    async (data) => ({
      ...data,
      parkingId: await requireMappedParentId(db, req.sourceSystem, "parkings", data.parkingId, "parkingId"),
    }),
    async (data) => {
      const parkingId = await requireMappedParentId(db, req.sourceSystem, "parkings", data.parkingId, "parkingId");
      const matches = await db.select({ id: parkingPlates.id }).from(parkingPlates).where(and(eq(parkingPlates.parkingId, parkingId), eq(parkingPlates.plate, data.plate))).limit(2);
      return matches.length === 1 ? matches[0] : null;
    },
  );
}

// ─── 使用穩定自然鍵的資料同步 ────────────────────────────────────────────────────

async function syncInvitedUser(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { invitedUsers } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const email = req.keyField === "email" ? req.keyValue : req.data?.email;
  if (!email) {
    return { success: false, message: "Invited user requires an email identifier" };
  }

  if (req.operation === "delete") {
    await db.delete(invitedUsers).where(eq(invitedUsers.email, String(email)));
    return { success: true, message: "Invited user deleted", action: "deleted" };
  }

  const values = preparedData(req.data);
  const existing = await db.select({ id: invitedUsers.id }).from(invitedUsers).where(eq(invitedUsers.email, String(email))).limit(1);
  if (existing[0]) {
    await db.update(invitedUsers).set(values).where(eq(invitedUsers.id, existing[0].id));
    return { success: true, message: "Invited user updated", action: "updated" };
  }

  await db.insert(invitedUsers).values(values);
  return { success: true, message: "Invited user inserted", action: "inserted" };
}

export { LOCAL_SYSTEM_ID, REMOTE_SYSTEM_ID, SYNC_API_KEY, SYNC_TARGET_URL };
