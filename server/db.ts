import { and, eq, like, or, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, residents, repairRequests, InsertResident, InsertRepairRequest, parkings, parkingPlates, InsertParkingPlate, operationLogs, userSessions, InsertOperationLog, InsertUserSession, invitedUsers, InsertInvitedUser, emergencyContacts, InsertEmergencyContact, EmergencyContact } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ─────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId, name: user.name || '', email: user.email || '' };
    const updateSet: Record<string, unknown> = {};
    if (user.name) updateSet.name = user.name;
    if (user.email) updateSet.email = user.email;
    if (user.loginMethod) updateSet.loginMethod = user.loginMethod;

    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
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
  const result = await db.insert(residents).values(data);
  return result;
}

export async function updateResident(id: number, data: Partial<Omit<InsertResident, 'id' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(residents).set(data).where(eq(residents.id, id));
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
  const result = await db.insert(parkings).values(data);
  // Drizzle 返回 [ResultSetHeader, undefined]，insertId 在 result[0].insertId
  return { insertId: (result as any)[0]?.insertId };
}

export async function updateParking(id: number, data: { number?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(parkings).set(data).where(eq(parkings.id, id));
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
  const result = await db.insert(parkingPlates).values({ parkingId, plate });
  // Drizzle 返回 [ResultSetHeader, undefined]，insertId 在 result[0].insertId
  return { insertId: (result as any)[0]?.insertId };
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
  const result = await db.insert(emergencyContacts).values(data);
  return { insertId: (result as any)[0]?.insertId };
}

export async function updateEmergencyContact(id: number, data: Partial<Omit<InsertEmergencyContact, 'id' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(emergencyContacts).set(data).where(eq(emergencyContacts.id, id));
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
  return await db.insert(repairRequests).values(data);
}

export async function updateRepairRequest(id: number, data: Partial<Omit<InsertRepairRequest, 'id' | 'createdAt' | 'updatedAt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(repairRequests).set(data).where(eq(repairRequests.id, id));
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
  return await db.update(users).set({ role }).where(eq(users.openId, openId));
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
      await db.insert(residents).values(resident);
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
      await db.insert(repairRequests).values(request);
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
    await db.insert(operationLogs).values(log);
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
    const result = await db.insert(userSessions).values(session);
    return result[0].insertId || null;
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

  const result = await db.insert(invitedUsers).values({
    email,
    name,
    role,
    invitedBy,
    notes,
    status: "pending",
  });

  return result;
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

  await db.update(invitedUsers).set(updates).where(eq(invitedUsers.id, id));

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
