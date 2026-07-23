/**
 * 雙向同步處理邏輯 - resident-management (PostgreSQL)
 * 
 * 這個模組提供兩個功能：
 * 1. 接收同步請求：當另一個系統推送資料過來時，寫入本地資料庫
 * 2. 發送同步請求：當本地資料被修改時，推送到另一個系統
 */

import { getDb } from "./db";

// ─── 配置 ──────────────────────────────────────────────────────────────────────
const SYNC_API_KEY = process.env.SYNC_API_KEY || "meishu-qa-sync-key-2026";
const SYNC_TARGET_URL = process.env.SYNC_TARGET_URL || "";

// ─── 發送同步請求 ──────────────────────────────────────────────────────────────────

/**
 * 發送同步請求到另一個系統
 * @param operation - 操作類型：create, update, delete
 * @param table - 資料表名稱
 * @param data - 資料內容
 * @param keyField - 唯一識別欄位
 * @param keyValue - 唯一識別值
 */
export async function syncToRemote(
  operation: "create" | "update" | "delete",
  table: string,
  data: any,
  keyField: string,
  keyValue: any
): Promise<void> {
  if (!SYNC_TARGET_URL) {
    console.log("[SYNC] 未設定 SYNC_TARGET_URL，跳過同步");
    return;
  }

  try {
    const response = await fetch(`${SYNC_TARGET_URL}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sync-Source": "resident-management",
        "X-Sync-Api-Key": SYNC_API_KEY,
      },
      body: JSON.stringify({
        operation,
        table,
        data,
        keyField,
        keyValue,
        sourceSystem: "resident-management",
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10000), // 10秒超時
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[SYNC] 同步失敗: ${table} ${operation} - ${response.status}: ${errorText}`);
    } else {
      console.log(`[SYNC] 同步成功: ${table} ${operation} (keyField=${keyField}, keyValue=${keyValue})`);
    }
  } catch (error) {
    // 同步失敗不影響主流程
    console.warn(`[SYNC] 同步請求異常: ${table} ${operation} - ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ─── 接收同步請求處理 ──────────────────────────────────────────────────────────────────

interface SyncRequest {
  operation: "create" | "update" | "delete";
  table: string;
  data: any;
  keyField: string;
  keyValue: any;
  sourceSystem: string;
  timestamp: string;
}

interface SyncResponse {
  success: boolean;
  message: string;
  action?: "inserted" | "updated" | "deleted" | "skipped" | "upserted";
}

/**
 * 處理接收到的同步請求
 */
export async function handleSyncRequest(req: SyncRequest): Promise<SyncResponse> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  try {
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

// ─── 住戶同步 ──────────────────────────────────────────────────────────────────────

async function syncResident(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { residents, coResidents, emergencyContacts, parkings, parkingPlates } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  // 使用 unitNumber 作為唯一識別
  const unitNumber = req.data.unitNumber;
  if (!unitNumber) {
    return { success: false, message: "Missing unitNumber" };
  }

  const existing = await db.select()
    .from(residents)
    .where(eq(residents.unitNumber, unitNumber))
    .limit(1);

  const existingRecord = existing[0] || null;
  const newData = req.data;

  // 衝突解決：如果本地資料較新，跳過
  if (existingRecord && existingRecord.updatedAt && newData.updatedAt) {
    const localTime = new Date(existingRecord.updatedAt).getTime();
    const remoteTime = new Date(newData.updatedAt).getTime();
    if (localTime >= remoteTime) {
      console.log(`[SYNC] 住戶 ${unitNumber} 本地資料較新，跳過同步`);
      return { success: true, message: "Skipped - local data is newer", action: "skipped" };
    }
  }

  // 準備住戶資料（排除關聯資料）
  const residentData = { ...newData };
  delete residentData.emergencyContacts;
  delete residentData.coResidents;
  delete residentData.parkings;
  delete residentData.id; // 避免 ID 衝突

  if (req.operation === "delete") {
    if (existingRecord) {
      // 先刪除關聯資料
      await db.delete(coResidents).where(eq(coResidents.residentId, existingRecord.id));
      await db.delete(parkingPlates).where(eq(parkingPlates.parkingId, 0)); // 需要 join
      await db.delete(emergencyContacts).where(eq(emergencyContacts.residentId, existingRecord.id));
      
      // 刪除停車位
      const residentParkings = await db.select({ id: parkings.id })
        .from(parkings)
        .where(eq(parkings.residentId, existingRecord.id));
      for (const p of residentParkings) {
        await db.delete(parkingPlates).where(eq(parkingPlates.parkingId, p.id));
      }
      await db.delete(parkings).where(eq(parkings.residentId, existingRecord.id));
      
      // 刪除住戶
      await db.delete(residents).where(eq(residents.id, existingRecord.id));
    }
    return { success: true, message: "Resident deleted", action: "deleted" };
  }

  // upsert 邏輯
  if (existingRecord) {
    // 更新現有住戶
    await db.update(residents)
      .set(residentData)
      .where(eq(residents.id, existingRecord.id));

    // 更新緊急聯絡人
    if (newData.emergencyContacts) {
      await db.delete(emergencyContacts).where(eq(emergencyContacts.residentId, existingRecord.id));
      for (const contact of newData.emergencyContacts) {
        await db.insert(emergencyContacts).values({
          residentId: existingRecord.id,
          name: contact.name,
          phone: contact.phone || null,
          relationship: contact.relation || null,
          address: contact.address || null,
        });
      }
    }

    return { success: true, message: "Resident updated", action: "updated" };
  } else {
    // 新增住戶
    const insertResult = await db.insert(residents).values(residentData);
    const insertedId = (insertResult as any)?.[0]?.insertId || (insertResult as any)?.insertId;

    // 新增緊急聯絡人
    if (newData.emergencyContacts && insertedId) {
      for (const contact of newData.emergencyContacts) {
        if (contact.name) {
          await db.insert(emergencyContacts).values({
            residentId: insertedId,
            name: contact.name,
            phone: contact.phone || null,
            relationship: contact.relation || null,
            address: contact.address || null,
          });
        }
      }
    }

    return { success: true, message: "Resident inserted", action: "inserted" };
  }
}

// ─── 緊急聯絡人同步 ─────────────────────────────────────────────────────────────────

async function syncEmergencyContact(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { emergencyContacts } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  if (req.operation === "delete") {
    await db.delete(emergencyContacts).where(eq(emergencyContacts.id, req.keyValue));
    return { success: true, message: "Emergency contact deleted", action: "deleted" };
  }

  // 使用 residentId + name 查找
  const existing = await db.select()
    .from(emergencyContacts)
    .where(
      and(
        eq(emergencyContacts.residentId, req.data.residentId),
        eq(emergencyContacts.name, req.data.name)
      )
    )
    .limit(1);

  const data = { ...req.data };
  delete data.id;

  if (existing[0]) {
    await db.update(emergencyContacts)
      .set(data)
      .where(eq(emergencyContacts.id, existing[0].id));
    return { success: true, message: "Emergency contact updated", action: "updated" };
  } else {
    await db.insert(emergencyContacts).values(data);
    return { success: true, message: "Emergency contact inserted", action: "inserted" };
  }
}

// ─── 報修同步 ──────────────────────────────────────────────────────────────────────

async function syncRepairRequest(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { repairRequests } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  if (req.operation === "delete") {
    // 嘗試用 ID 刪除，如果失敗用 unitNumber+description 匹配
    const deleted = await db.delete(repairRequests)
      .where(eq(repairRequests.id, req.keyValue))
      .returning({ id: repairRequests.id });
    if (deleted.length === 0) {
      // 回退到業務鍵匹配
      await db.delete(repairRequests)
        .where(eq(repairRequests.id, req.data.id));
    }
    return { success: true, message: "Repair request deleted", action: "deleted" };
  }

  const data = { ...req.data };
  delete data.id;

  const existing = await db.select()
    .from(repairRequests)
    .where(eq(repairRequests.id, req.keyValue))
    .limit(1);

  if (existing[0]) {
    await db.update(repairRequests)
      .set(data)
      .where(eq(repairRequests.id, existing[0].id));
    return { success: true, message: "Repair request updated", action: "updated" };
  } else {
    await db.insert(repairRequests).values(data);
    return { success: true, message: "Repair request inserted", action: "inserted" };
  }
}

// ─── 裝修申請同步 ──────────────────────────────────────────────────────────────────

async function syncRenovationApplication(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { renovationApplications } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  if (req.operation === "delete") {
    await db.delete(renovationApplications).where(eq(renovationApplications.id, req.keyValue));
    return { success: true, message: "Renovation application deleted", action: "deleted" };
  }

  const data = { ...req.data };
  delete data.id;

  const existing = await db.select()
    .from(renovationApplications)
    .where(eq(renovationApplications.id, req.keyValue))
    .limit(1);

  if (existing[0]) {
    await db.update(renovationApplications)
      .set(data)
      .where(eq(renovationApplications.id, existing[0].id));
    return { success: true, message: "Renovation application updated", action: "updated" };
  } else {
    await db.insert(renovationApplications).values(data);
    return { success: true, message: "Renovation application inserted", action: "inserted" };
  }
}

// ─── 資源資料夾同步 ────────────────────────────────────────────────────────────────

async function syncResourceFolder(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { resourceFolders } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  if (req.operation === "delete") {
    await db.delete(resourceFolders).where(eq(resourceFolders.id, req.keyValue));
    return { success: true, message: "Resource folder deleted", action: "deleted" };
  }

  const data = { ...req.data };
  delete data.id;

  const existing = await db.select()
    .from(resourceFolders)
    .where(eq(resourceFolders.id, req.keyValue))
    .limit(1);

  if (existing[0]) {
    await db.update(resourceFolders)
      .set(data)
      .where(eq(resourceFolders.id, existing[0].id));
    return { success: true, message: "Resource folder updated", action: "updated" };
  } else {
    await db.insert(resourceFolders).values(data);
    return { success: true, message: "Resource folder inserted", action: "inserted" };
  }
}

// ─── 資源檔案同步 ──────────────────────────────────────────────────────────────────

async function syncResourceFile(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { resourceFiles } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  if (req.operation === "delete") {
    await db.delete(resourceFiles).where(eq(resourceFiles.id, req.keyValue));
    return { success: true, message: "Resource file deleted", action: "deleted" };
  }

  const data = { ...req.data };
  delete data.id;

  const existing = await db.select()
    .from(resourceFiles)
    .where(eq(resourceFiles.id, req.keyValue))
    .limit(1);

  if (existing[0]) {
    await db.update(resourceFiles)
      .set(data)
      .where(eq(resourceFiles.id, existing[0].id));
    return { success: true, message: "Resource file updated", action: "updated" };
  } else {
    await db.insert(resourceFiles).values(data);
    return { success: true, message: "Resource file inserted", action: "inserted" };
  }
}

// ─── 受邀人員同步 ──────────────────────────────────────────────────────────────────

async function syncInvitedUser(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { invitedUsers } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  if (req.operation === "delete") {
    await db.delete(invitedUsers).where(eq(invitedUsers.id, req.keyValue));
    return { success: true, message: "Invited user deleted", action: "deleted" };
  }

  const data = { ...req.data };
  delete data.id;

  // 使用 email 作為唯一識別
  if (data.email) {
    const existing = await db.select()
      .from(invitedUsers)
      .where(eq(invitedUsers.email, data.email))
      .limit(1);

    if (existing[0]) {
      await db.update(invitedUsers)
        .set(data)
        .where(eq(invitedUsers.id, existing[0].id));
      return { success: true, message: "Invited user updated", action: "updated" };
    }
  }

  await db.insert(invitedUsers).values(data);
  return { success: true, message: "Invited user inserted", action: "inserted" };
}

// ─── 停車位同步 ────────────────────────────────────────────────────────────────────

async function syncParking(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { parkings } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  if (req.operation === "delete") {
    await db.delete(parkings).where(eq(parkings.id, req.keyValue));
    return { success: true, message: "Parking deleted", action: "deleted" };
  }

  const data = { ...req.data };
  delete data.id;

  const existing = await db.select()
    .from(parkings)
    .where(eq(parkings.id, req.keyValue))
    .limit(1);

  if (existing[0]) {
    await db.update(parkings)
      .set(data)
      .where(eq(parkings.id, existing[0].id));
    return { success: true, message: "Parking updated", action: "updated" };
  } else {
    await db.insert(parkings).values(data);
    return { success: true, message: "Parking inserted", action: "inserted" };
  }
}

// ─── 停車牌照同步 ──────────────────────────────────────────────────────────────────

async function syncParkingPlate(db: any, req: SyncRequest): Promise<SyncResponse> {
  const { parkingPlates } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  if (req.operation === "delete") {
    await db.delete(parkingPlates).where(eq(parkingPlates.id, req.keyValue));
    return { success: true, message: "Parking plate deleted", action: "deleted" };
  }

  const data = { ...req.data };
  delete data.id;

  const existing = await db.select()
    .from(parkingPlates)
    .where(eq(parkingPlates.id, req.keyValue))
    .limit(1);

  if (existing[0]) {
    await db.update(parkingPlates)
      .set(data)
      .where(eq(parkingPlates.id, existing[0].id));
    return { success: true, message: "Parking plate updated", action: "updated" };
  } else {
    await db.insert(parkingPlates).values(data);
    return { success: true, message: "Parking plate inserted", action: "inserted" };
  }
}

// ─── 導出函數 ──────────────────────────────────────────────────────────────────────

export { SYNC_API_KEY, SYNC_TARGET_URL };
export type { SyncRequest, SyncResponse };
