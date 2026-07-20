import { and, eq, like, or, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, residents, repairRequests, InsertResident, InsertRepairRequest, parkings, parkingPlates, InsertParkingPlate, operationLogs, userSessions, InsertOperationLog, InsertUserSession, invitedUsers, InsertInvitedUser, emergencyContacts, InsertEmergencyContact, EmergencyContact, renovationApplications, InsertRenovationApplication, resourceFolders, resourceFiles, coResidents, passwordUsers as passwordUsersTable } from "../drizzle/schema";
import { ENV } from './_core/env';

let _pool: Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

async function getPool(): Promise<Pool> {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
    });
  }
  return _pool;
}

export async function getDb() {
  if (!_db) {
    try {
      const pool = await getPool();
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Helper to get insert ID from PostgreSQL
async function getInsertId(db: any, table: any, data: any): Promise<number> {
  const result = await db.insert(table).values(data).returning({ id: table.id });
  return result[0]?.id;
}

// ─── User helpers ─────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: any = { openId: user.openId, name: user.name || '', email: user.email || '' };
    
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    
    if (existing.length > 0) {
      // Update existing user
      const updateData: any = {};
      if (user.name) updateData.name = user.name;
      if (user.email) updateData.email = user.email;
      if (user.loginMethod) updateData.loginMethod = user.loginMethod;
      if (user.role !== undefined) updateData.role = user.role;
      if (user.lastSignedIn !== undefined) updateData.lastSignedIn = user.lastSignedIn;
      if (!updateData.lastSignedIn) updateData.lastSignedIn = new Date();
      updateData.updatedAt = new Date();
      await db.update(users).set(updateData).where(eq(users.openId, user.openId));
    } else {
      // Insert new user
      if (user.lastSignedIn === undefined) values.lastSignedIn = new Date();
      if (user.role === undefined && user.openId === ENV.ownerOpenId) values.role = 'admin';
      if (values.lastSignedIn === undefined) values.lastSignedIn = new Date();
      values.createdAt = new Date();
      values.updatedAt = new Date();
      await db.insert(users).values(values);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Residents helpers ────────────────────────────────────────────────────────
export async function listResidents(search?: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all residents
  let residentsData;
  if (search && search.trim()) {
    const keyword = `%${search.trim()}%`;
    residentsData = await db.select().from(residents).where(
      or(
        like(residents.unitNumber, keyword),
        like(residents.ownerName, keyword),
        like(residents.ownerPhone, keyword),
        like(residents.coResident1Name, keyword),
        like(residents.coResident2Name, keyword),
        like(residents.coResident3Name, keyword),
        like(residents.coResident4Name, keyword),
        like(residents.emergencyContactName, keyword),
        like(residents.emergencyContactPhone, keyword),
      )
    ).orderBy(residents.unitNumber);
  } else {
    residentsData = await db.select().from(residents).orderBy(residents.unitNumber);
  }
  
  // Get all emergency contacts in one query
  const allEmergencyContacts = await db.select().from(emergencyContacts);
  
  // Map emergency contacts by resident ID
  const contactsByResidentId = new Map<number, typeof allEmergencyContacts>();
  for (const contact of allEmergencyContacts) {
    if (!contactsByResidentId.has(contact.residentId)) {
      contactsByResidentId.set(contact.residentId, []);
    }
    contactsByResidentId.get(contact.residentId)!.push(contact);
  }
  
  // Add emergency contacts to each resident
  return residentsData.map(resident => ({
    ...resident,
    emergencyContacts: contactsByResidentId.get(resident.id) || [],
  }));
}

export async function getResidentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(residents).where(eq(residents.id, id)).limit(1);
  return result[0];
}

export async function createResident(data: Omit<InsertResident, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData: any = { ...data };
  const newId = await getInsertId(db, residents, insertData);
  const created = await getResidentById(newId);
  return { insertId: newId, ...created };
}

export async function updateResident(id: number, data: Partial<Omit<InsertResident, 'id' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { ...data, updatedAt: new Date() };
  await db.update(residents).set(updateData).where(eq(residents.id, id));
  // 返回更新後的資料
  return getResidentById(id);
}

export async function deleteResident(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(residents).where(eq(residents.id, id));
}

// ─── Parking helpers ──────────────────────────────────────────────────────────
export async function getParkingsByResidentId(residentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(parkings).where(eq(parkings.residentId, residentId));
}

export async function getParkingPlatesByParkingId(parkingId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(parkingPlates).where(eq(parkingPlates.parkingId, parkingId));
}

export async function createParking(data: { residentId: number; type: 'car' | 'motorcycle' | 'bicycle'; number: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData: any = { ...data };
  const newId = await getInsertId(db, parkings, insertData);
  return { insertId: newId };
}

export async function updateParking(id: number, data: { number?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { ...data, updatedAt: new Date() };
  return await db.update(parkings).set(updateData).where(eq(parkings.id, id));
}

export async function deleteParking(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // 先刪除所有相關的牌照
  await db.delete(parkingPlates).where(eq(parkingPlates.parkingId, id));
  // 再刪除停車位
  return await db.delete(parkings).where(eq(parkings.id, id));
}

export async function addParkingPlate(parkingId: number, plate: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData: any = { parkingId, plate };
  const newId = await getInsertId(db, parkingPlates, insertData);
  return { insertId: newId };
}

export async function deleteParkingPlate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(parkingPlates).where(eq(parkingPlates.id, id));
}

// ─── Emergency Contacts helpers ───────────────────────────────────────────────
export async function getEmergencyContactsByResidentId(residentId: number): Promise<EmergencyContact[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select().from(emergencyContacts).where(eq(emergencyContacts.residentId, residentId));
    console.log(`[DEBUG] getEmergencyContactsByResidentId: residentId=${residentId}, found ${result?.length || 0} contacts`);
    return result || [];
  } catch (error) {
    console.error(`[ERROR] getEmergencyContactsByResidentId: Failed to fetch for residentId ${residentId}:`, error);
    return [];
  }
}

export async function createEmergencyContact(data: Omit<InsertEmergencyContact, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData: any = { ...data };
  const newId = await getInsertId(db, emergencyContacts, insertData);
  return { insertId: newId };
}

export async function updateEmergencyContact(id: number, data: Partial<Omit<InsertEmergencyContact, 'id' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { ...data, updatedAt: new Date() };
  return await db.update(emergencyContacts).set(updateData).where(eq(emergencyContacts.id, id));
}

export async function deleteEmergencyContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(emergencyContacts).where(eq(emergencyContacts.id, id));
}

export async function deleteEmergencyContactsByResidentId(residentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(emergencyContacts).where(eq(emergencyContacts.residentId, residentId));
}

// ─── Repair Requests helpers ──────────────────────────────────────────────────
export async function listRepairRequests(filters?: { status?: string; unitNumber?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status && filters.status !== 'all') {
    conditions.push(eq(repairRequests.status, filters.status as any));
  }
  if (conditions.length > 0) {
    return await db.select().from(repairRequests).where(and(...conditions)).orderBy(repairRequests.createdAt);
  }
  return await db.select().from(repairRequests).orderBy(repairRequests.createdAt);
}

export async function getRepairRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(repairRequests).where(eq(repairRequests.id, id)).limit(1);
  return result[0];
}

export async function createRepairRequest(data: Omit<InsertRepairRequest, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData: any = { ...data };
  const newId = await getInsertId(db, repairRequests, insertData);
  return await getRepairRequestById(newId);
}

export async function updateRepairRequest(id: number, data: Partial<Omit<InsertRepairRequest, 'id' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { ...data, updatedAt: new Date() };
  await db.update(repairRequests).set(updateData).where(eq(repairRequests.id, id));
  // 返回更新後的完整紀錄
  return await db.select().from(repairRequests).where(eq(repairRequests.id, id)).then(rows => rows[0]);
}

export async function deleteRepairRequest(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(repairRequests).where(eq(repairRequests.id, id));
}

// ─── Admin management helpers ─────────────────────────────────────────────────
export async function listAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(users.createdAt);
}

export async function updateUserRole(openId: string, role: 'admin' | 'user') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.openId, openId));
}

// ─── Backup helpers ──────────────────────────────────────────────────────────
export async function backupAllData() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const residentsData = await db.select().from(residents);
  const repairRequestsData = await db.select().from(repairRequests);
  
  return {
    timestamp: new Date().toISOString(),
    residents: residentsData,
    repairRequests: repairRequestsData,
    totalRecords: residentsData.length + repairRequestsData.length,
  };
}

export async function restoreResidents(data: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];
  
  for (const resident of data) {
    try {
      const { id, createdAt, updatedAt, ...insertData } = resident;
      await db.insert(residents).values(insertData);
      successCount++;
    } catch (error: any) {
      errorCount++;
      errors.push(`戶號 ${resident.unitNumber}: ${error.message}`);
    }
  }
  
  return { successCount, errorCount, errors };
}

export async function restoreRepairRequests(data: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];
  
  for (const request of data) {
    try {
      const { id, createdAt, updatedAt, ...insertData } = request;
      await db.insert(repairRequests).values(insertData);
      successCount++;
    } catch (error: any) {
      errorCount++;
      errors.push(`報修 ${request.unitNumber}: ${error.message}`);
    }
  }
  
  return { successCount, errorCount, errors };
}


// ─── Operation Logs helpers ────────────────────────────────────────────────────

/**
 * 記錄操作日誌
 */
export async function logOperation(log: InsertOperationLog): Promise<void> {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot log operation: database not available"); return; }
  try {
    await db.insert(operationLogs).values(log as any);
  } catch (error) {
    console.error("[Database] Failed to log operation:", error);
    // Don't throw - logging failures shouldn't break the main operation
  }
}

/**
 * 獲取用戶的操作日誌
 */
export async function getOperationLogsByUserId(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get operation logs: database not available"); return []; }
  try {
    const logs = await db.select()
      .from(operationLogs)
      .where(eq(operationLogs.userId, userId))
      .orderBy((t) => t.createdAt)
      .limit(limit);
    return logs;
  } catch (error) {
    console.error("[Database] Failed to get operation logs:", error);
    return [];
  }
}

/**
 * 獲取特定模塊的操作日誌
 */
export async function getOperationLogsByModule(module: string, limit: number = 100) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get operation logs: database not available"); return []; }
  try {
    const logs = await db.select()
      .from(operationLogs)
      .where(eq(operationLogs.module, module))
      .orderBy((t) => t.createdAt)
      .limit(limit);
    return logs;
  } catch (error) {
    console.error("[Database] Failed to get operation logs:", error);
    return [];
  }
}

// ─── User Sessions helpers ────────────────────────────────────────────────────
/**
 * 創建用戶登入時段
 */
export async function createUserSession(session: InsertUserSession): Promise<number | null> {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot create session: database not available"); return null; }
  try {
    const insertData: any = { ...session };
    const newId = await getInsertId(db, userSessions, insertData);
    return newId || null;
  } catch (error) {
    console.error("[Database] Failed to create session:", error);
    return null;
  }
}

/**
 * 獲取用戶的活躍登入時段
 */
export async function getActiveSessionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get sessions: database not available"); return []; }
  try {
    const sessions = await db.select()
      .from(userSessions)
      .where(and(eq(userSessions.userId, userId), eq(userSessions.isActive, 1)));
    return sessions;
  } catch (error) {
    console.error("[Database] Failed to get sessions:", error);
    return [];
  }
}

/**
 * 登出用戶會話
 */
export async function logoutUserSession(sessionId: number): Promise<void> {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot logout session: database not available"); return; }
  try {
    await db.update(userSessions)
      .set({ isActive: 0, logoutAt: new Date() })
      .where(eq(userSessions.id, sessionId));
  } catch (error) {
    console.error("[Database] Failed to logout session:", error);
  }
}

/**
 * 檢查用戶是否有活躍的登入會話（用於帳號限制）
 */
export async function hasActiveSession(userId: number): Promise<boolean> {
  const sessions = await getActiveSessionsByUserId(userId);
  return sessions.length > 0;
}

/**
 * 強制登出用戶的所有會話
 */
export async function forceLogoutAllSessions(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot force logout: database not available"); return; }
  try {
    await db.update(userSessions)
      .set({ isActive: 0, logoutAt: new Date() })
      .where(eq(userSessions.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to force logout:", error);
  }
}


// ─── 受邀人員管理 ────────────────────────────────────────────────────────────────

/**
 * 添加受邀人員
 */
export async function addInvitedUser(
  email: string,
  name: string,
  role: "admin" | "user" = "user",
  invitedBy?: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const insertData: any = {
    email,
    name,
    role,
    invitedBy,
    notes,
    status: "pending",
  };
  return getInsertId(db, invitedUsers, insertData);
}

/**
 * 獲取所有受邀人員
 */
export async function getAllInvitedUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(invitedUsers).orderBy(desc(invitedUsers.invitedAt));
}

/**
 * 根據郵箱獲取受邀人員
 */
export async function getInvitedUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(invitedUsers)
    .where(eq(invitedUsers.email, email));

  return result[0];
}

/**
 * 更新受邀人員
 */
export async function updateInvitedUser(
  id: number,
  updates: Partial<InsertInvitedUser>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { ...updates, updatedAt: new Date() };
  await db.update(invitedUsers).set(updateData).where(eq(invitedUsers.id, id));

  return getInvitedUserById(id);
}

/**
 * 根據 ID 獲取受邀人員
 */
export async function getInvitedUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(invitedUsers)
    .where(eq(invitedUsers.id, id));

  return result[0];
}

/**
 * 刪除受邀人員
 */
export async function deleteInvitedUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(invitedUsers).where(eq(invitedUsers.id, id));

  return true;
}

/**
 * 檢查郵箱是否在白名單中
 */
export async function isEmailInvited(email: string) {
  const invited = await getInvitedUserByEmail(email);
  return !!invited;
}

// ─── Renovation Applications helpers ──────────────────────────────────────────
export async function listRenovationApplications(filters?: { status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status && filters.status !== 'all') {
    conditions.push(eq(renovationApplications.status, filters.status as any));
  }
  if (conditions.length > 0) {
    return await db.select().from(renovationApplications).where(and(...conditions)).orderBy(renovationApplications.createdAt);
  }
  return await db.select().from(renovationApplications).orderBy(renovationApplications.createdAt);
}

export async function getRenovationApplicationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(renovationApplications).where(eq(renovationApplications.id, id)).limit(1);
  return result[0];
}

export async function createRenovationApplication(data: Omit<InsertRenovationApplication, 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData: any = { ...data };
  const newId = await getInsertId(db, renovationApplications, insertData);
  return await getRenovationApplicationById(newId);
}

export async function updateRenovationApplication(id: number, data: Partial<Omit<InsertRenovationApplication, 'id' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { ...data, updatedAt: new Date() };
  await db.update(renovationApplications).set(updateData).where(eq(renovationApplications.id, id));
  return await getRenovationApplicationById(id);
}

export async function deleteRenovationApplication(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(renovationApplications).where(eq(renovationApplications.id, id));
}

// ─── Resource Library helpers ──────────────────────────────────────────────────
export async function listResourceFolders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resourceFolders).orderBy(resourceFolders.createdAt);
}

export async function getResourceFolderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resourceFolders).where(eq(resourceFolders.id, id)).limit(1);
  return result[0];
}

export async function createResourceFolder(data: { name: string; description?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData: any = { name: data.name, description: data.description || null };
  const newId = await getInsertId(db, resourceFolders, insertData);
  return await getResourceFolderById(newId);
}

export async function updateResourceFolder(id: number, data: { name?: string; description?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { ...data, updatedAt: new Date() };
  await db.update(resourceFolders).set(updateData).where(eq(resourceFolders.id, id));
  return await getResourceFolderById(id);
}

export async function deleteResourceFolder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete all files in the folder first
  await db.delete(resourceFiles).where(eq(resourceFiles.folderId, id));
  return await db.delete(resourceFolders).where(eq(resourceFolders.id, id));
}

export async function listResourceFilesByFolderId(folderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resourceFiles).where(eq(resourceFiles.folderId, folderId)).orderBy(resourceFiles.createdAt);
}

export async function getResourceFileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resourceFiles).where(eq(resourceFiles.id, id)).limit(1);
  return result[0];
}

export async function createResourceFile(data: { folderId: number; name: string; fileUrl: string; fileSize?: number; fileType?: string; uploadedBy?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData: any = { ...data };
  const newId = await getInsertId(db, resourceFiles, insertData);
  return await getResourceFileById(newId);
}

export async function deleteResourceFile(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(resourceFiles).where(eq(resourceFiles.id, id));
}
