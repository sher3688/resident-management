var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      syncTargetUrl: process.env.SYNC_TARGET_URL ?? "",
      syncApiKey: process.env.SYNC_API_KEY ?? "",
      // Vercel 主系統預設為 resident-management；Manus Space 備援系統預設為 community-management。
      // 可透過 SYNC_SYSTEM_ID 覆寫，以支援未來遷移或測試環境。
      syncSystemId: process.env.SYNC_SYSTEM_ID ?? (process.env.VERCEL ? "resident-management" : "community-management")
    };
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  CONSTRUCTION_TYPES_REQUIRING_DEPOSIT: () => CONSTRUCTION_TYPES_REQUIRING_DEPOSIT,
  CONSTRUCTION_TYPE_RENOVATION: () => CONSTRUCTION_TYPE_RENOVATION,
  DECORATION_DEPOSIT_STATUS: () => DECORATION_DEPOSIT_STATUS,
  auditLogs: () => auditLogs,
  coResidents: () => coResidents,
  decorationDepositStatusEnum: () => decorationDepositStatusEnum,
  emergencyContacts: () => emergencyContacts,
  invitedStatusEnum: () => invitedStatusEnum,
  invitedUsers: () => invitedUsers,
  loginMethodEnum: () => loginMethodEnum,
  operationLogStatusEnum: () => operationLogStatusEnum,
  operationLogs: () => operationLogs,
  parkingPlates: () => parkingPlates,
  parkingTypeEnum: () => parkingTypeEnum,
  parkings: () => parkings,
  passwordUsers: () => passwordUsers,
  renovationApplications: () => renovationApplications,
  renovationStatusEnum: () => renovationStatusEnum,
  repairRequests: () => repairRequests,
  repairStatusEnum: () => repairStatusEnum,
  residents: () => residents,
  resourceFiles: () => resourceFiles,
  resourceFolders: () => resourceFolders,
  roleEnum: () => roleEnum,
  syncRecordMappings: () => syncRecordMappings,
  userSessions: () => userSessions,
  users: () => users
});
import { pgTable, pgEnum, varchar, integer, serial, timestamp, text, jsonb, date, index, uniqueIndex } from "drizzle-orm/pg-core";
var parkingTypeEnum, repairStatusEnum, loginMethodEnum, roleEnum, renovationStatusEnum, decorationDepositStatusEnum, operationLogStatusEnum, invitedStatusEnum, residents, coResidents, parkings, parkingPlates, emergencyContacts, repairRequests, auditLogs, passwordUsers, users, renovationApplications, operationLogs, userSessions, invitedUsers, resourceFolders, resourceFiles, CONSTRUCTION_TYPE_RENOVATION, CONSTRUCTION_TYPES_REQUIRING_DEPOSIT, DECORATION_DEPOSIT_STATUS, syncRecordMappings;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    parkingTypeEnum = pgEnum("parking_type", ["car", "motorcycle", "bicycle"]);
    repairStatusEnum = pgEnum("repair_status", ["pending", "in_progress", "completed", "cancelled", "resident_self_repair"]);
    loginMethodEnum = pgEnum("login_method", ["email", "password"]);
    roleEnum = pgEnum("role", ["admin", "user"]);
    renovationStatusEnum = pgEnum("renovation_status", ["pending", "approved", "completed", "rejected"]);
    decorationDepositStatusEnum = pgEnum("decoration_deposit_status", ["notPaid", "paid", "refunded"]);
    operationLogStatusEnum = pgEnum("operation_log_status", ["success", "failure"]);
    invitedStatusEnum = pgEnum("invited_status", ["pending", "accepted", "rejected"]);
    residents = pgTable("residents", {
      id: serial("id").primaryKey(),
      // 戶號
      unitNumber: varchar("unitNumber", { length: 32 }).notNull(),
      // 區權人（所有人）
      ownerName: varchar("ownerName", { length: 64 }).notNull(),
      ownerPhone: varchar("ownerPhone", { length: 32 }),
      // 同住人（最多四位）- 保留以支援舊資料
      coResident1Name: varchar("coResident1Name", { length: 64 }),
      coResident1Phone: varchar("coResident1Phone", { length: 32 }),
      coResident2Name: varchar("coResident2Name", { length: 64 }),
      coResident2Phone: varchar("coResident2Phone", { length: 32 }),
      coResident3Name: varchar("coResident3Name", { length: 64 }),
      coResident3Phone: varchar("coResident3Phone", { length: 32 }),
      coResident4Name: varchar("coResident4Name", { length: 64 }),
      coResident4Phone: varchar("coResident4Phone", { length: 32 }),
      // 車位
      carParkingNumber: varchar("carParkingNumber", { length: 32 }),
      carPlateNumber: varchar("carPlateNumber", { length: 32 }),
      motorcycleParkingNumber: varchar("motorcycleParkingNumber", { length: 32 }),
      motorcyclePlateNumber: varchar("motorcyclePlateNumber", { length: 32 }),
      bicycleParkingNumber: varchar("bicycleParkingNumber", { length: 32 }),
      // 住戶住所
      address: text("address"),
      // 緊急連絡人（第一位）
      emergencyContactName: varchar("emergencyContactName", { length: 64 }),
      emergencyContactPhone: varchar("emergencyContactPhone", { length: 32 }),
      emergencyContactRelation: varchar("emergencyContactRelation", { length: 32 }),
      emergencyContactAddress: text("emergencyContactAddress"),
      // 緊急連絡人（第二位）
      emergencyContact2Name: varchar("emergencyContact2Name", { length: 64 }),
      emergencyContact2Phone: varchar("emergencyContact2Phone", { length: 32 }),
      emergencyContact2Relation: varchar("emergencyContact2Relation", { length: 32 }),
      emergencyContact2Address: text("emergencyContact2Address"),
      // 坪數
      squareMeters: varchar("squareMeters", { length: 32 }),
      // 水號
      waterMeterNumber: varchar("waterMeterNumber", { length: 32 }),
      // 電號
      electricityMeterNumber: varchar("electricityMeterNumber", { length: 32 }),
      // 入住日期
      moveInDate: date("moveInDate"),
      // 備註
      notes: text("notes"),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
    });
    coResidents = pgTable("co_residents", {
      id: serial("id").primaryKey(),
      residentId: integer("residentId").notNull(),
      name: varchar("name", { length: 64 }).notNull(),
      phone: varchar("phone", { length: 32 }),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
    });
    parkings = pgTable("parkings", {
      id: serial("id").primaryKey(),
      residentId: integer("residentId").notNull(),
      type: parkingTypeEnum("type").notNull(),
      number: varchar("number", { length: 32 }).notNull(),
      plate: varchar("plate", { length: 32 }),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
    });
    parkingPlates = pgTable("parking_plates", {
      id: serial("id").primaryKey(),
      parkingId: integer("parkingId").notNull(),
      plate: varchar("plate", { length: 32 }).notNull(),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
    });
    emergencyContacts = pgTable("emergency_contacts", {
      id: serial("id").primaryKey(),
      residentId: integer("residentId").notNull(),
      name: varchar("name", { length: 64 }).notNull(),
      phone: varchar("phone", { length: 32 }),
      relationship: varchar("relationship", { length: 32 }),
      address: text("address"),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
    });
    repairRequests = pgTable("repair_requests", {
      id: serial("id").primaryKey(),
      repairDate: varchar("repairDate", { length: 32 }).notNull(),
      unitNumber: varchar("unitNumber", { length: 32 }).notNull(),
      description: text("description").notNull(),
      status: repairStatusEnum("status").default("pending"),
      notes: text("notes"),
      completionDate: varchar("completionDate", { length: 32 }),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
    });
    auditLogs = pgTable("audit_logs", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      action: varchar("action", { length: 50 }).notNull(),
      entity: varchar("entity", { length: 50 }).notNull(),
      entityId: integer("entityId"),
      changes: text("changes"),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull()
    });
    passwordUsers = pgTable("password_users", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().unique(),
      passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
    });
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      openId: varchar("openId", { length: 255 }).notNull().unique(),
      name: varchar("name", { length: 64 }).notNull(),
      email: varchar("email", { length: 255 }).notNull().unique(),
      loginMethod: loginMethodEnum("loginMethod").default("email"),
      role: roleEnum("role").default("user"),
      isActive: integer("isActive").default(1).notNull(),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn", { withTimezone: true })
    });
    renovationApplications = pgTable("renovation_applications", {
      id: serial("id").primaryKey(),
      unitNumber: varchar("unitNumber", { length: 32 }).notNull(),
      applicationDate: varchar("applicationDate", { length: 32 }).notNull(),
      constructionStartDate: varchar("constructionStartDate", { length: 32 }),
      constructionEndDate: varchar("constructionEndDate", { length: 32 }),
      constructionContent: varchar("constructionContent", { length: 255 }).notNull(),
      consentLetterPasted: varchar("consentLetterPasted", { length: 32 }),
      applicantName: varchar("applicantName", { length: 64 }).notNull(),
      applicantPhone: varchar("applicantPhone", { length: 32 }).notNull(),
      registeredBy: varchar("registeredBy", { length: 64 }),
      status: renovationStatusEnum("status").default("pending"),
      decorationDeposit: varchar("decorationDeposit", { length: 32 }),
      decorationDepositStatus: decorationDepositStatusEnum("decorationDepositStatus").default("notPaid"),
      notes: text("notes"),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
    });
    operationLogs = pgTable("operation_logs", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      action: varchar("action", { length: 64 }).notNull(),
      module: varchar("module", { length: 64 }).notNull(),
      targetId: integer("targetId"),
      targetType: varchar("targetType", { length: 64 }),
      description: text("description"),
      details: jsonb("details"),
      ipAddress: varchar("ipAddress", { length: 45 }),
      userAgent: text("userAgent"),
      status: operationLogStatusEnum("status").default("success"),
      errorMessage: text("errorMessage"),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull()
    });
    userSessions = pgTable("user_sessions", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
      ipAddress: varchar("ipAddress", { length: 45 }),
      userAgent: text("userAgent"),
      deviceName: varchar("deviceName", { length: 255 }),
      loginAt: timestamp("loginAt", { withTimezone: true }).defaultNow().notNull(),
      lastActivityAt: timestamp("lastActivityAt", { withTimezone: true }).defaultNow().notNull(),
      logoutAt: timestamp("logoutAt", { withTimezone: true }),
      isActive: integer("isActive").default(1).notNull(),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull()
    });
    invitedUsers = pgTable("invited_users", {
      id: serial("id").primaryKey(),
      email: varchar("email", { length: 255 }).notNull().unique(),
      name: varchar("name", { length: 64 }),
      role: varchar("role", { length: 32 }).default("user").notNull(),
      status: varchar("status", { length: 32 }).default("pending").notNull(),
      invitedBy: integer("invitedBy"),
      invitedAt: timestamp("invitedAt", { withTimezone: true }).defaultNow().notNull(),
      acceptedAt: timestamp("acceptedAt", { withTimezone: true }),
      notes: text("notes"),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
    });
    resourceFolders = pgTable("resource_folders", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
    });
    resourceFiles = pgTable("resource_files", {
      id: serial("id").primaryKey(),
      folderId: integer("folderId").notNull().references(() => resourceFolders.id, { onDelete: "cascade" }),
      name: varchar("name", { length: 255 }).notNull(),
      fileUrl: text("fileUrl").notNull(),
      fileSize: integer("fileSize"),
      fileType: varchar("fileType", { length: 32 }).default("pdf"),
      uploadedBy: integer("uploadedBy"),
      createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
    });
    CONSTRUCTION_TYPE_RENOVATION = "\u65BD\u5DE5\u88DD\u6F62";
    CONSTRUCTION_TYPES_REQUIRING_DEPOSIT = ["\u65BD\u5DE5\u88DD\u6F62"];
    DECORATION_DEPOSIT_STATUS = {
      NOT_PAID: "notPaid",
      PAID: "paid",
      REFUNDED: "refunded"
    };
    syncRecordMappings = pgTable(
      "sync_record_mappings",
      {
        id: serial("id").primaryKey(),
        originSystem: varchar("originSystem", { length: 64 }).notNull(),
        entityType: varchar("entityType", { length: 64 }).notNull(),
        originRecordId: varchar("originRecordId", { length: 128 }).notNull(),
        localRecordId: varchar("localRecordId", { length: 128 }).notNull(),
        sourceUpdatedAt: text("sourceUpdatedAt"),
        createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
      },
      (table) => [
        uniqueIndex("sync_record_mappings_origin_unique").on(
          table.originSystem,
          table.entityType,
          table.originRecordId
        ),
        index("sync_record_mappings_local_lookup").on(
          table.entityType,
          table.localRecordId
        )
      ]
    );
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addInvitedUser: () => addInvitedUser,
  addParkingPlate: () => addParkingPlate,
  backupAllData: () => backupAllData,
  createEmergencyContact: () => createEmergencyContact,
  createParking: () => createParking,
  createRenovationApplication: () => createRenovationApplication,
  createRepairRequest: () => createRepairRequest,
  createResident: () => createResident,
  createResourceFile: () => createResourceFile,
  createResourceFolder: () => createResourceFolder,
  createUserSession: () => createUserSession,
  deleteEmergencyContact: () => deleteEmergencyContact,
  deleteEmergencyContactsByResidentId: () => deleteEmergencyContactsByResidentId,
  deleteInvitedUser: () => deleteInvitedUser,
  deleteParking: () => deleteParking,
  deleteParkingPlate: () => deleteParkingPlate,
  deleteRenovationApplication: () => deleteRenovationApplication,
  deleteRepairRequest: () => deleteRepairRequest,
  deleteResident: () => deleteResident,
  deleteResourceFile: () => deleteResourceFile,
  deleteResourceFolder: () => deleteResourceFolder,
  forceLogoutAllSessions: () => forceLogoutAllSessions,
  getActiveSessionsByUserId: () => getActiveSessionsByUserId,
  getAllInvitedUsers: () => getAllInvitedUsers,
  getDb: () => getDb,
  getEmergencyContactsByResidentId: () => getEmergencyContactsByResidentId,
  getInvitedUserByEmail: () => getInvitedUserByEmail,
  getInvitedUserById: () => getInvitedUserById,
  getOperationLogsByModule: () => getOperationLogsByModule,
  getOperationLogsByUserId: () => getOperationLogsByUserId,
  getParkingPlatesByParkingId: () => getParkingPlatesByParkingId,
  getParkingsByResidentId: () => getParkingsByResidentId,
  getRenovationApplicationById: () => getRenovationApplicationById,
  getRepairRequestById: () => getRepairRequestById,
  getResidentById: () => getResidentById,
  getResourceFileById: () => getResourceFileById,
  getResourceFolderById: () => getResourceFolderById,
  getUserById: () => getUserById,
  getUserByOpenId: () => getUserByOpenId,
  hasActiveSession: () => hasActiveSession,
  isEmailInvited: () => isEmailInvited,
  listAllUsers: () => listAllUsers,
  listRenovationApplications: () => listRenovationApplications,
  listRepairRequests: () => listRepairRequests,
  listResidents: () => listResidents,
  listResourceFilesByFolderId: () => listResourceFilesByFolderId,
  listResourceFolders: () => listResourceFolders,
  logOperation: () => logOperation,
  logoutUserSession: () => logoutUserSession,
  restoreRepairRequests: () => restoreRepairRequests,
  restoreResidents: () => restoreResidents,
  updateEmergencyContact: () => updateEmergencyContact,
  updateInvitedUser: () => updateInvitedUser,
  updateParking: () => updateParking,
  updateRenovationApplication: () => updateRenovationApplication,
  updateRepairRequest: () => updateRepairRequest,
  updateResident: () => updateResident,
  updateResourceFolder: () => updateResourceFolder,
  updateUserRole: () => updateUserRole,
  upsertUser: () => upsertUser
});
import { and, eq, like, or, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
async function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 10
    });
  }
  return _pool;
}
async function getDb() {
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
async function getInsertId(db, table, data) {
  const result = await db.insert(table).values(data).returning({ id: table.id });
  return result[0]?.id;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = { openId: user.openId, name: user.name || "", email: user.email || "" };
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    if (existing.length > 0) {
      const updateData = {};
      if (user.name) updateData.name = user.name;
      if (user.email) updateData.email = user.email;
      if (user.loginMethod) updateData.loginMethod = user.loginMethod;
      if (user.role !== void 0) updateData.role = user.role;
      if (user.lastSignedIn !== void 0) updateData.lastSignedIn = user.lastSignedIn;
      if (!updateData.lastSignedIn) updateData.lastSignedIn = /* @__PURE__ */ new Date();
      updateData.updatedAt = /* @__PURE__ */ new Date();
      await db.update(users).set(updateData).where(eq(users.openId, user.openId));
    } else {
      if (user.lastSignedIn === void 0) values.lastSignedIn = /* @__PURE__ */ new Date();
      if (user.role === void 0 && user.openId === ENV.ownerOpenId) values.role = "admin";
      if (values.lastSignedIn === void 0) values.lastSignedIn = /* @__PURE__ */ new Date();
      values.createdAt = /* @__PURE__ */ new Date();
      values.updatedAt = /* @__PURE__ */ new Date();
      await db.insert(users).values(values);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(userId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function listResidents(search) {
  const db = await getDb();
  if (!db) return [];
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
        like(residents.emergencyContactPhone, keyword)
      )
    ).orderBy(residents.unitNumber);
  } else {
    residentsData = await db.select().from(residents).orderBy(residents.unitNumber);
  }
  const allEmergencyContacts = await db.select().from(emergencyContacts);
  const contactsByResidentId = /* @__PURE__ */ new Map();
  for (const contact of allEmergencyContacts) {
    if (!contactsByResidentId.has(contact.residentId)) {
      contactsByResidentId.set(contact.residentId, []);
    }
    contactsByResidentId.get(contact.residentId).push(contact);
  }
  return residentsData.map((resident) => ({
    ...resident,
    emergencyContacts: contactsByResidentId.get(resident.id) || []
  }));
}
async function getResidentById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(residents).where(eq(residents.id, id)).limit(1);
  return result[0];
}
async function createResident(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData = { ...data };
  const newId = await getInsertId(db, residents, insertData);
  const created = await getResidentById(newId);
  return { insertId: newId, ...created };
}
async function updateResident(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
  await db.update(residents).set(updateData).where(eq(residents.id, id));
  return getResidentById(id);
}
async function deleteResident(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(residents).where(eq(residents.id, id));
}
async function getParkingsByResidentId(residentId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(parkings).where(eq(parkings.residentId, residentId));
}
async function getParkingPlatesByParkingId(parkingId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(parkingPlates).where(eq(parkingPlates.parkingId, parkingId));
}
async function createParking(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData = { ...data };
  const newId = await getInsertId(db, parkings, insertData);
  return { insertId: newId };
}
async function updateParking(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
  return await db.update(parkings).set(updateData).where(eq(parkings.id, id));
}
async function deleteParking(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(parkingPlates).where(eq(parkingPlates.parkingId, id));
  return await db.delete(parkings).where(eq(parkings.id, id));
}
async function addParkingPlate(parkingId, plate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData = { parkingId, plate };
  const newId = await getInsertId(db, parkingPlates, insertData);
  return { insertId: newId };
}
async function deleteParkingPlate(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(parkingPlates).where(eq(parkingPlates.id, id));
}
async function getEmergencyContactsByResidentId(residentId) {
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
async function createEmergencyContact(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData = { ...data };
  const newId = await getInsertId(db, emergencyContacts, insertData);
  return { insertId: newId };
}
async function updateEmergencyContact(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
  return await db.update(emergencyContacts).set(updateData).where(eq(emergencyContacts.id, id));
}
async function deleteEmergencyContact(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(emergencyContacts).where(eq(emergencyContacts.id, id));
}
async function deleteEmergencyContactsByResidentId(residentId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(emergencyContacts).where(eq(emergencyContacts.residentId, residentId));
}
async function listRepairRequests(filters) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(repairRequests.status, filters.status));
  }
  if (conditions.length > 0) {
    return await db.select().from(repairRequests).where(and(...conditions)).orderBy(repairRequests.createdAt);
  }
  return await db.select().from(repairRequests).orderBy(repairRequests.createdAt);
}
async function getRepairRequestById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(repairRequests).where(eq(repairRequests.id, id)).limit(1);
  return result[0];
}
async function createRepairRequest(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData = { ...data };
  const newId = await getInsertId(db, repairRequests, insertData);
  return await getRepairRequestById(newId);
}
async function updateRepairRequest(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
  await db.update(repairRequests).set(updateData).where(eq(repairRequests.id, id));
  return await db.select().from(repairRequests).where(eq(repairRequests.id, id)).then((rows) => rows[0]);
}
async function deleteRepairRequest(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(repairRequests).where(eq(repairRequests.id, id));
}
async function listAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(users.createdAt);
}
async function updateUserRole(openId, role) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(users).set({ role, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.openId, openId));
}
async function backupAllData() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const residentsData = await db.select().from(residents);
  const repairRequestsData = await db.select().from(repairRequests);
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    residents: residentsData,
    repairRequests: repairRequestsData,
    totalRecords: residentsData.length + repairRequestsData.length
  };
}
async function restoreResidents(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  for (const resident of data) {
    try {
      const { id, createdAt, updatedAt, ...insertData } = resident;
      await db.insert(residents).values(insertData);
      successCount++;
    } catch (error) {
      errorCount++;
      errors.push(`\u6236\u865F ${resident.unitNumber}: ${error.message}`);
    }
  }
  return { successCount, errorCount, errors };
}
async function restoreRepairRequests(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  for (const request of data) {
    try {
      const { id, createdAt, updatedAt, ...insertData } = request;
      await db.insert(repairRequests).values(insertData);
      successCount++;
    } catch (error) {
      errorCount++;
      errors.push(`\u5831\u4FEE ${request.unitNumber}: ${error.message}`);
    }
  }
  return { successCount, errorCount, errors };
}
async function logOperation(log) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log operation: database not available");
    return;
  }
  try {
    await db.insert(operationLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to log operation:", error);
  }
}
async function getOperationLogsByUserId(userId, limit = 100) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get operation logs: database not available");
    return [];
  }
  try {
    const logs = await db.select().from(operationLogs).where(eq(operationLogs.userId, userId)).orderBy((t2) => t2.createdAt).limit(limit);
    return logs;
  } catch (error) {
    console.error("[Database] Failed to get operation logs:", error);
    return [];
  }
}
async function getOperationLogsByModule(module, limit = 100) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get operation logs: database not available");
    return [];
  }
  try {
    const logs = await db.select().from(operationLogs).where(eq(operationLogs.module, module)).orderBy((t2) => t2.createdAt).limit(limit);
    return logs;
  } catch (error) {
    console.error("[Database] Failed to get operation logs:", error);
    return [];
  }
}
async function createUserSession(session) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create session: database not available");
    return null;
  }
  try {
    const insertData = { ...session };
    const newId = await getInsertId(db, userSessions, insertData);
    return newId || null;
  } catch (error) {
    console.error("[Database] Failed to create session:", error);
    return null;
  }
}
async function getActiveSessionsByUserId(userId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sessions: database not available");
    return [];
  }
  try {
    const sessions = await db.select().from(userSessions).where(and(eq(userSessions.userId, userId), eq(userSessions.isActive, 1)));
    return sessions;
  } catch (error) {
    console.error("[Database] Failed to get sessions:", error);
    return [];
  }
}
async function logoutUserSession(sessionId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot logout session: database not available");
    return;
  }
  try {
    await db.update(userSessions).set({ isActive: 0, logoutAt: /* @__PURE__ */ new Date() }).where(eq(userSessions.id, sessionId));
  } catch (error) {
    console.error("[Database] Failed to logout session:", error);
  }
}
async function hasActiveSession(userId) {
  const sessions = await getActiveSessionsByUserId(userId);
  return sessions.length > 0;
}
async function forceLogoutAllSessions(userId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot force logout: database not available");
    return;
  }
  try {
    await db.update(userSessions).set({ isActive: 0, logoutAt: /* @__PURE__ */ new Date() }).where(eq(userSessions.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to force logout:", error);
  }
}
async function addInvitedUser(email, name, role = "user", invitedBy, notes) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData = {
    email,
    name,
    role,
    invitedBy,
    notes,
    status: "pending"
  };
  return getInsertId(db, invitedUsers, insertData);
}
async function getAllInvitedUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(invitedUsers).orderBy(desc(invitedUsers.invitedAt));
}
async function getInvitedUserByEmail(email) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(invitedUsers).where(eq(invitedUsers.email, email));
  return result[0];
}
async function updateInvitedUser(id, updates) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { ...updates, updatedAt: /* @__PURE__ */ new Date() };
  await db.update(invitedUsers).set(updateData).where(eq(invitedUsers.id, id));
  return getInvitedUserById(id);
}
async function getInvitedUserById(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(invitedUsers).where(eq(invitedUsers.id, id));
  return result[0];
}
async function deleteInvitedUser(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(invitedUsers).where(eq(invitedUsers.id, id));
  return true;
}
async function isEmailInvited(email) {
  const invited = await getInvitedUserByEmail(email);
  return !!invited;
}
async function listRenovationApplications(filters) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(renovationApplications.status, filters.status));
  }
  if (conditions.length > 0) {
    return await db.select().from(renovationApplications).where(and(...conditions)).orderBy(renovationApplications.createdAt);
  }
  return await db.select().from(renovationApplications).orderBy(renovationApplications.createdAt);
}
async function getRenovationApplicationById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(renovationApplications).where(eq(renovationApplications.id, id)).limit(1);
  return result[0];
}
async function createRenovationApplication(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData = { ...data };
  const newId = await getInsertId(db, renovationApplications, insertData);
  return await getRenovationApplicationById(newId);
}
async function updateRenovationApplication(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
  await db.update(renovationApplications).set(updateData).where(eq(renovationApplications.id, id));
  return await getRenovationApplicationById(id);
}
async function deleteRenovationApplication(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(renovationApplications).where(eq(renovationApplications.id, id));
}
async function listResourceFolders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resourceFolders).orderBy(resourceFolders.createdAt);
}
async function getResourceFolderById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(resourceFolders).where(eq(resourceFolders.id, id)).limit(1);
  return result[0];
}
async function createResourceFolder(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData = { name: data.name, description: data.description || null };
  const newId = await getInsertId(db, resourceFolders, insertData);
  return await getResourceFolderById(newId);
}
async function updateResourceFolder(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData = { ...data, updatedAt: /* @__PURE__ */ new Date() };
  await db.update(resourceFolders).set(updateData).where(eq(resourceFolders.id, id));
  return await getResourceFolderById(id);
}
async function deleteResourceFolder(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(resourceFiles).where(eq(resourceFiles.folderId, id));
  return await db.delete(resourceFolders).where(eq(resourceFolders.id, id));
}
async function listResourceFilesByFolderId(folderId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resourceFiles).where(eq(resourceFiles.folderId, folderId)).orderBy(resourceFiles.createdAt);
}
async function getResourceFileById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(resourceFiles).where(eq(resourceFiles.id, id)).limit(1);
  return result[0];
}
async function createResourceFile(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const insertData = { ...data };
  const newId = await getInsertId(db, resourceFiles, insertData);
  return await getResourceFileById(newId);
}
async function deleteResourceFile(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(resourceFiles).where(eq(resourceFiles.id, id));
}
var _pool, _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _pool = null;
    _db = null;
  }
});

// server/_core/index.ts
import "dotenv/config";
import express3 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers.ts
import { z as z11 } from "zod";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();
init_db();
init_schema();

// server/sync-handler.ts
init_db();
init_env();

// server/sync-mapping.ts
init_schema();
import { and as and2, eq as eq2, inArray } from "drizzle-orm";
function getOriginRecordId(req) {
  const dataId = req.data?.id;
  const candidate = dataId ?? req.keyValue;
  if (candidate === void 0 || candidate === null || candidate === "") {
    return null;
  }
  return String(candidate);
}
async function findRecordMapping(db, req) {
  const originRecordId = getOriginRecordId(req);
  if (!originRecordId) {
    return null;
  }
  const found = await db.select({
    id: syncRecordMappings.id,
    localRecordId: syncRecordMappings.localRecordId,
    sourceUpdatedAt: syncRecordMappings.sourceUpdatedAt
  }).from(syncRecordMappings).where(
    and2(
      eq2(syncRecordMappings.originSystem, req.sourceSystem),
      eq2(syncRecordMappings.entityType, req.table),
      eq2(syncRecordMappings.originRecordId, originRecordId)
    )
  ).limit(1);
  if (!found[0]?.localRecordId) {
    return null;
  }
  return {
    id: Number(found[0].id),
    localRecordId: String(found[0].localRecordId),
    sourceUpdatedAt: found[0].sourceUpdatedAt ? String(found[0].sourceUpdatedAt) : null
  };
}
async function findMappedLocalId(db, req) {
  return (await findRecordMapping(db, req))?.localRecordId ?? null;
}
function isDuplicateOrStaleEvent(mapping, incomingTimestamp) {
  if (!mapping?.sourceUpdatedAt || !incomingTimestamp) {
    return false;
  }
  const previousTime = Date.parse(mapping.sourceUpdatedAt);
  const incomingTime = Date.parse(incomingTimestamp);
  return Number.isFinite(previousTime) && Number.isFinite(incomingTime) && incomingTime <= previousTime;
}
async function upsertRecordMapping(db, req, localRecordId) {
  const originRecordId = getOriginRecordId(req);
  if (!originRecordId) {
    throw new Error(`Missing source record identifier for ${req.table}`);
  }
  const existing = await findRecordMapping(db, req);
  const values = {
    localRecordId: String(localRecordId),
    sourceUpdatedAt: req.timestamp ?? null,
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (existing) {
    await db.update(syncRecordMappings).set(values).where(eq2(syncRecordMappings.id, existing.id));
    return;
  }
  await db.insert(syncRecordMappings).values({
    originSystem: req.sourceSystem,
    entityType: req.table,
    originRecordId,
    ...values,
    createdAt: /* @__PURE__ */ new Date()
  });
}
async function deleteRecordMapping(db, req) {
  const originRecordId = getOriginRecordId(req);
  if (!originRecordId) {
    return;
  }
  await db.delete(syncRecordMappings).where(
    and2(
      eq2(syncRecordMappings.originSystem, req.sourceSystem),
      eq2(syncRecordMappings.entityType, req.table),
      eq2(syncRecordMappings.originRecordId, originRecordId)
    )
  );
}
async function deleteMappingsByLocalRecordIds(db, entityType, localRecordIds) {
  const ids = localRecordIds.map(String).filter(Boolean);
  if (ids.length === 0) {
    return;
  }
  await db.delete(syncRecordMappings).where(
    and2(
      eq2(syncRecordMappings.entityType, entityType),
      inArray(syncRecordMappings.localRecordId, ids)
    )
  );
}
async function resolveMappedParentId(db, sourceSystem, parentTable, sourceParentId) {
  if (sourceParentId === void 0 || sourceParentId === null || sourceParentId === "") {
    return null;
  }
  const localRecordId = await findMappedLocalId(db, {
    table: parentTable,
    keyField: "id",
    keyValue: sourceParentId,
    sourceSystem,
    data: { id: sourceParentId }
  });
  if (!localRecordId || !Number.isSafeInteger(Number(localRecordId))) {
    return null;
  }
  return Number(localRecordId);
}
function omitTransportFields(data) {
  const cleanData = { ...data };
  delete cleanData.id;
  return cleanData;
}
async function insertAndGetId(db, table, values) {
  const insertQuery = db.insert(table).values(values);
  if (typeof insertQuery.returning === "function") {
    const returned = await insertQuery.returning({ id: table.id });
    const returnedId = returned?.[0]?.id;
    return returnedId === void 0 || returnedId === null ? null : Number(returnedId);
  }
  const result = await insertQuery;
  const insertedId = result?.[0]?.insertId ?? result?.insertId;
  return insertedId === void 0 || insertedId === null ? null : Number(insertedId);
}

// server/sync-handler.ts
var SYNC_API_KEY = ENV.syncApiKey;
var SYNC_TARGET_URL = ENV.syncTargetUrl.replace(/\/+$/, "");
var LOCAL_SYSTEM_ID = ENV.syncSystemId;
var REMOTE_SYSTEM_ID = LOCAL_SYSTEM_ID === "community-management" ? "resident-management" : "community-management";
async function syncToRemote(operation, table, data, keyField, keyValue) {
  if (!SYNC_TARGET_URL || !SYNC_API_KEY) {
    console.warn("[SYNC] \u7F3A\u5C11 SYNC_TARGET_URL \u6216 SYNC_API_KEY\uFF0C\u8DF3\u904E\u540C\u6B65");
    return;
  }
  try {
    const response = await fetch(`${SYNC_TARGET_URL}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sync-Source": LOCAL_SYSTEM_ID,
        "X-Sync-Api-Key": SYNC_API_KEY
      },
      body: JSON.stringify({
        operation,
        table,
        data,
        keyField,
        keyValue,
        sourceSystem: LOCAL_SYSTEM_ID,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }),
      signal: AbortSignal.timeout(1e4)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[SYNC] \u540C\u6B65\u5931\u6557: ${table} ${operation} - ${response.status}: ${errorText}`);
      return;
    }
    console.log(`[SYNC] \u540C\u6B65\u6210\u529F: ${table} ${operation}`);
  } catch (error) {
    console.warn(`[SYNC] \u540C\u6B65\u8ACB\u6C42\u7570\u5E38: ${table} ${operation} - ${error instanceof Error ? error.message : String(error)}`);
  }
}
async function handleSyncRequest(req) {
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
    console.error(`[SYNC] \u8655\u7406\u540C\u6B65\u8ACB\u6C42\u5931\u6557: ${req.table} ${req.operation}`, error);
    return { success: false, message: `Internal error: ${error instanceof Error ? error.message : String(error)}` };
  }
}
function preparedData(data) {
  const values = omitTransportFields(data ?? {});
  delete values.createdAt;
  delete values.updatedAt;
  return values;
}
async function requireMappedParentId(db, sourceSystem, parentTable, sourceParentId, field) {
  const localId = await resolveMappedParentId(db, sourceSystem, parentTable, sourceParentId);
  if (localId === null) {
    throw new Error(`Missing mapped ${parentTable} for ${field}=${String(sourceParentId)}`);
  }
  return localId;
}
async function syncMappedRecord(db, req, entityTable, label, transform, findExisting) {
  if (!getOriginRecordId(req)) {
    return { success: false, message: `${label} requires a source record id` };
  }
  const mapping = await findRecordMapping(db, req);
  if (isDuplicateOrStaleEvent(mapping, req.timestamp)) {
    return { success: true, message: "Skipped - duplicate or stale source event", action: "skipped" };
  }
  if (req.operation === "delete") {
    if (mapping) {
      const { eq: eq6 } = await import("drizzle-orm");
      await db.delete(entityTable).where(eq6(entityTable.id, Number(mapping.localRecordId)));
    } else if (findExisting) {
      const naturalMatch = await findExisting(preparedData(req.data));
      if (naturalMatch) {
        const { eq: eq6 } = await import("drizzle-orm");
        await db.delete(entityTable).where(eq6(entityTable.id, naturalMatch.id));
      }
    }
    await deleteRecordMapping(db, req);
    return { success: true, message: `${label} deleted`, action: "deleted" };
  }
  let values = preparedData(req.data);
  if (transform) {
    values = await transform(values);
  }
  let localRecordId = mapping ? Number(mapping.localRecordId) : null;
  if (!localRecordId && findExisting) {
    const naturalMatch = await findExisting(values);
    localRecordId = naturalMatch?.id ?? null;
  }
  if (localRecordId !== null) {
    const { eq: eq6 } = await import("drizzle-orm");
    await db.update(entityTable).set(values).where(eq6(entityTable.id, localRecordId));
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
async function syncResident(db, req) {
  const { residents: residents2, coResidents: coResidents3, emergencyContacts: emergencyContacts2, parkings: parkings2, parkingPlates: parkingPlates2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq6 } = await import("drizzle-orm");
  const unitNumber = req.data?.unitNumber;
  if (!unitNumber) {
    return { success: false, message: "Missing unitNumber" };
  }
  const mapping = await findRecordMapping(db, req);
  if (isDuplicateOrStaleEvent(mapping, req.timestamp)) {
    return { success: true, message: "Skipped - duplicate or stale source event", action: "skipped" };
  }
  const existing = mapping ? await db.select().from(residents2).where(eq6(residents2.id, Number(mapping.localRecordId))).limit(1) : await db.select().from(residents2).where(eq6(residents2.unitNumber, unitNumber)).limit(1);
  const resident = existing[0] ?? null;
  if (req.operation === "delete") {
    if (resident) {
      const parkingRows = await db.select({ id: parkings2.id }).from(parkings2).where(eq6(parkings2.residentId, resident.id));
      const parkingIds = parkingRows.map((row) => row.id);
      const contactRows = await db.select({ id: emergencyContacts2.id }).from(emergencyContacts2).where(eq6(emergencyContacts2.residentId, resident.id));
      const contactIds = contactRows.map((row) => row.id);
      const coResidentRows = await db.select({ id: coResidents3.id }).from(coResidents3).where(eq6(coResidents3.residentId, resident.id));
      for (const parkingId of parkingIds) {
        await db.delete(parkingPlates2).where(eq6(parkingPlates2.parkingId, parkingId));
      }
      await db.delete(parkings2).where(eq6(parkings2.residentId, resident.id));
      await db.delete(emergencyContacts2).where(eq6(emergencyContacts2.residentId, resident.id));
      await db.delete(coResidents3).where(eq6(coResidents3.residentId, resident.id));
      await db.delete(residents2).where(eq6(residents2.id, resident.id));
      await deleteMappingsByLocalRecordIds(db, "parking_plates", parkingIds);
      await deleteMappingsByLocalRecordIds(db, "parkings", parkingIds);
      await deleteMappingsByLocalRecordIds(db, "emergency_contacts", contactIds);
      await deleteMappingsByLocalRecordIds(db, "co_residents", coResidentRows.map((row) => row.id));
    }
    await deleteRecordMapping(db, req);
    return { success: true, message: "Resident deleted", action: "deleted" };
  }
  const residentData = preparedData(req.data);
  delete residentData.emergencyContacts;
  delete residentData.coResidents;
  delete residentData.parkings;
  let residentId;
  if (resident) {
    if (!mapping && resident.updatedAt && req.data.updatedAt && new Date(resident.updatedAt).getTime() > new Date(req.data.updatedAt).getTime()) {
      await upsertRecordMapping(db, req, resident.id);
      return { success: true, message: "Skipped - local resident is newer", action: "skipped" };
    }
    await db.update(residents2).set(residentData).where(eq6(residents2.id, resident.id));
    residentId = resident.id;
  } else {
    const insertedId = await insertAndGetId(db, residents2, residentData);
    if (insertedId === null) {
      throw new Error("Unable to determine local resident id after insert");
    }
    residentId = insertedId;
  }
  await upsertRecordMapping(db, req, residentId);
  if (Array.isArray(req.data.coResidents)) {
    await db.delete(coResidents3).where(eq6(coResidents3.residentId, residentId));
    for (const coResident of req.data.coResidents) {
      if (!coResident?.name) continue;
      await db.insert(coResidents3).values({
        residentId,
        name: coResident.name,
        phone: coResident.phone ?? null
      });
    }
  }
  if (Array.isArray(req.data.emergencyContacts)) {
    const oldContacts = await db.select({ id: emergencyContacts2.id }).from(emergencyContacts2).where(eq6(emergencyContacts2.residentId, residentId));
    await db.delete(emergencyContacts2).where(eq6(emergencyContacts2.residentId, residentId));
    await deleteMappingsByLocalRecordIds(db, "emergency_contacts", oldContacts.map((row) => row.id));
    for (const contact of req.data.emergencyContacts) {
      if (!contact?.name) continue;
      const contactId = await insertAndGetId(db, emergencyContacts2, {
        residentId,
        name: contact.name,
        phone: contact.phone ?? null,
        relationship: contact.relationship ?? contact.relation ?? null,
        address: contact.address ?? null
      });
      if (contactId !== null && contact.id !== void 0 && contact.id !== null) {
        await upsertRecordMapping(db, { ...req, table: "emergency_contacts", keyField: "id", keyValue: contact.id, data: contact }, contactId);
      }
    }
  }
  if (Array.isArray(req.data.parkings)) {
    const oldParkings = await db.select({ id: parkings2.id }).from(parkings2).where(eq6(parkings2.residentId, residentId));
    const oldParkingIds = oldParkings.map((row) => row.id);
    for (const parkingId of oldParkingIds) {
      await db.delete(parkingPlates2).where(eq6(parkingPlates2.parkingId, parkingId));
    }
    await db.delete(parkings2).where(eq6(parkings2.residentId, residentId));
    await deleteMappingsByLocalRecordIds(db, "parking_plates", oldParkingIds);
    await deleteMappingsByLocalRecordIds(db, "parkings", oldParkingIds);
    for (const parking of req.data.parkings) {
      if (!parking?.type || !parking?.number) continue;
      const parkingId = await insertAndGetId(db, parkings2, {
        residentId,
        type: parking.type,
        number: parking.number,
        plate: parking.plate ?? null
      });
      if (parkingId === null) continue;
      if (parking.id !== void 0 && parking.id !== null) {
        await upsertRecordMapping(db, { ...req, table: "parkings", keyField: "id", keyValue: parking.id, data: parking }, parkingId);
      }
      const plates = Array.isArray(parking.plates) ? parking.plates : Array.isArray(parking.parkingPlates) ? parking.parkingPlates : [];
      for (const plate of plates) {
        if (!plate?.plate) continue;
        const plateId = await insertAndGetId(db, parkingPlates2, { parkingId, plate: plate.plate });
        if (plateId !== null && plate.id !== void 0 && plate.id !== null) {
          await upsertRecordMapping(db, { ...req, table: "parking_plates", keyField: "id", keyValue: plate.id, data: plate }, plateId);
        }
      }
    }
  }
  return { success: true, message: resident ? "Resident updated" : "Resident inserted", action: resident ? "updated" : "inserted" };
}
async function syncEmergencyContact(db, req) {
  const { emergencyContacts: emergencyContacts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { and: and3, eq: eq6 } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    emergencyContacts2,
    "Emergency contact",
    async (data) => ({
      ...data,
      residentId: await requireMappedParentId(db, req.sourceSystem, "residents", data.residentId, "residentId")
    }),
    async (data) => {
      const residentId = await requireMappedParentId(db, req.sourceSystem, "residents", data.residentId, "residentId");
      const matches = await db.select({ id: emergencyContacts2.id }).from(emergencyContacts2).where(and3(eq6(emergencyContacts2.residentId, residentId), eq6(emergencyContacts2.name, data.name))).limit(2);
      return matches.length === 1 ? matches[0] : null;
    }
  );
}
async function syncRepairRequest(db, req) {
  const { repairRequests: repairRequests2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { and: and3, eq: eq6 } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    repairRequests2,
    "Repair request",
    void 0,
    async (data) => {
      const matches = await db.select({ id: repairRequests2.id }).from(repairRequests2).where(and3(eq6(repairRequests2.unitNumber, data.unitNumber), eq6(repairRequests2.repairDate, data.repairDate), eq6(repairRequests2.description, data.description))).limit(2);
      return matches.length === 1 ? matches[0] : null;
    }
  );
}
async function syncRenovationApplication(db, req) {
  const { renovationApplications: renovationApplications2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { and: and3, eq: eq6 } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    renovationApplications2,
    "Renovation application",
    void 0,
    async (data) => {
      const matches = await db.select({ id: renovationApplications2.id }).from(renovationApplications2).where(and3(eq6(renovationApplications2.unitNumber, data.unitNumber), eq6(renovationApplications2.applicationDate, data.applicationDate), eq6(renovationApplications2.constructionContent, data.constructionContent))).limit(2);
      return matches.length === 1 ? matches[0] : null;
    }
  );
}
async function syncResourceFolder(db, req) {
  const { resourceFolders: resourceFolders2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq6 } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    resourceFolders2,
    "Resource folder",
    void 0,
    async (data) => {
      const matches = await db.select({ id: resourceFolders2.id }).from(resourceFolders2).where(eq6(resourceFolders2.name, data.name)).limit(2);
      return matches.length === 1 ? matches[0] : null;
    }
  );
}
async function syncResourceFile(db, req) {
  const { resourceFiles: resourceFiles2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { and: and3, eq: eq6 } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    resourceFiles2,
    "Resource file",
    async (data) => ({
      ...data,
      folderId: await requireMappedParentId(db, req.sourceSystem, "resource_folders", data.folderId, "folderId")
    }),
    async (data) => {
      const folderId = await requireMappedParentId(db, req.sourceSystem, "resource_folders", data.folderId, "folderId");
      const matches = await db.select({ id: resourceFiles2.id }).from(resourceFiles2).where(and3(eq6(resourceFiles2.folderId, folderId), eq6(resourceFiles2.name, data.name), eq6(resourceFiles2.fileUrl, data.fileUrl))).limit(2);
      return matches.length === 1 ? matches[0] : null;
    }
  );
}
async function syncParking(db, req) {
  const { parkings: parkings2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { and: and3, eq: eq6 } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    parkings2,
    "Parking",
    async (data) => ({
      ...data,
      residentId: await requireMappedParentId(db, req.sourceSystem, "residents", data.residentId, "residentId")
    }),
    async (data) => {
      const residentId = await requireMappedParentId(db, req.sourceSystem, "residents", data.residentId, "residentId");
      const matches = await db.select({ id: parkings2.id }).from(parkings2).where(and3(eq6(parkings2.residentId, residentId), eq6(parkings2.type, data.type), eq6(parkings2.number, data.number))).limit(2);
      return matches.length === 1 ? matches[0] : null;
    }
  );
}
async function syncParkingPlate(db, req) {
  const { parkingPlates: parkingPlates2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { and: and3, eq: eq6 } = await import("drizzle-orm");
  return syncMappedRecord(
    db,
    req,
    parkingPlates2,
    "Parking plate",
    async (data) => ({
      ...data,
      parkingId: await requireMappedParentId(db, req.sourceSystem, "parkings", data.parkingId, "parkingId")
    }),
    async (data) => {
      const parkingId = await requireMappedParentId(db, req.sourceSystem, "parkings", data.parkingId, "parkingId");
      const matches = await db.select({ id: parkingPlates2.id }).from(parkingPlates2).where(and3(eq6(parkingPlates2.parkingId, parkingId), eq6(parkingPlates2.plate, data.plate))).limit(2);
      return matches.length === 1 ? matches[0] : null;
    }
  );
}
async function syncInvitedUser(db, req) {
  const { invitedUsers: invitedUsers2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq6 } = await import("drizzle-orm");
  const email = req.keyField === "email" ? req.keyValue : req.data?.email;
  if (!email) {
    return { success: false, message: "Invited user requires an email identifier" };
  }
  if (req.operation === "delete") {
    await db.delete(invitedUsers2).where(eq6(invitedUsers2.email, String(email)));
    return { success: true, message: "Invited user deleted", action: "deleted" };
  }
  const values = preparedData(req.data);
  const existing = await db.select({ id: invitedUsers2.id }).from(invitedUsers2).where(eq6(invitedUsers2.email, String(email))).limit(1);
  if (existing[0]) {
    await db.update(invitedUsers2).set(values).where(eq6(invitedUsers2.id, existing[0].id));
    return { success: true, message: "Invited user updated", action: "updated" };
  }
  await db.insert(invitedUsers2).values(values);
  return { success: true, message: "Invited user inserted", action: "inserted" };
}

// server/auth-routes.ts
import { z as z2 } from "zod";

// server/_core/sdk.ts
init_db();
init_env();
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
var JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret || "default-secret-change-in-production");
var JWT_ISSUER = "resident-management";
var sdk = {
  /**
   * Create a JWT session token for a user by userId
   */
  async createSessionToken(userId, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    return new SignJWT({
      userId,
      name: options.name || "",
      openId: options.openId || ""
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuer(JWT_ISSUER).setIssuedAt().setExpirationTime(expirationSeconds).sign(JWT_SECRET);
  },
  /**
   * Verify a JWT session token and return the payload
   */
  async verifySession(token) {
    if (!token) {
      console.warn("[Auth] Missing session token");
      return null;
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        algorithms: ["HS256"]
      });
      const userId = payload.userId;
      const name = payload.name || "";
      if (!isNonEmptyString2(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        userId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  },
  /**
   * Authenticate a request using cookie-based JWT
   */
  async authenticateRequest(req) {
    const cookies = parseCookieHeader(req.headers.cookie || "");
    const sessionToken = cookies[COOKIE_NAME];
    const session = await this.verifySession(sessionToken);
    if (!session) {
      return null;
    }
    const user = await getUserById(session.userId);
    if (!user) {
      return null;
    }
    try {
      await upsertUser({
        openId: user.openId,
        name: user.name,
        email: user.email,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
    } catch (error) {
      console.error("[Auth] Failed to update last signed in:", error);
    }
    return user;
  }
};

// server/password-auth.ts
init_db();
init_schema();
import bcrypt from "bcryptjs";
import { eq as eq3 } from "drizzle-orm";
async function authenticatePasswordUser(username, password) {
  try {
    const db = await getDb();
    if (!db) return null;
    const userResult = await db.select().from(users).where(eq3(users.name, username)).limit(1);
    const user = userResult[0];
    if (!user) {
      return null;
    }
    const passwordResult = await db.select().from(passwordUsers).where(eq3(passwordUsers.userId, user.id)).limit(1);
    const passwordRecord = passwordResult[0];
    if (!passwordRecord) {
      return null;
    }
    const isValid = await bcrypt.compare(password, passwordRecord.passwordHash);
    if (!isValid) {
      return null;
    }
    return {
      id: user.id,
      username: user.name,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      openId: user.openId,
      isActive: true
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}
async function registerPasswordUser(username, password, name, email, role = "user") {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const existingResult = await db.select().from(users).where(eq3(users.name, username)).limit(1);
    if (existingResult.length > 0) {
      throw new Error("\u4F7F\u7528\u8005\u540D\u7A31\u5DF2\u88AB\u4F7F\u7528");
    }
    const now = /* @__PURE__ */ new Date();
    const openId = `password_${username}_${Date.now()}`;
    await db.insert(users).values({
      openId,
      name: username,
      email,
      role,
      loginMethod: "password",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now
    });
    const newUserResult = await db.select().from(users).where(eq3(users.name, username)).limit(1);
    const newUser = newUserResult[0];
    if (!newUser) {
      throw new Error("Failed to create user");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(passwordUsers).values({
      userId: newUser.id,
      passwordHash,
      createdAt: now,
      updatedAt: now
    });
    return {
      id: newUser.id,
      username: newUser.name,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || "user",
      isActive: true
    };
  } catch (error) {
    throw new Error(error.message || "\u8A3B\u518A\u5931\u6557");
  }
}
async function getPasswordUser(userId) {
  try {
    const db = await getDb();
    if (!db) return null;
    const userResult = await db.select().from(users).where(eq3(users.id, userId)).limit(1);
    const user = userResult[0];
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      username: user.name,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      openId: user.openId,
      isActive: true
    };
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}
async function getAllPasswordUsers() {
  try {
    const db = await getDb();
    if (!db) return [];
    const userResults = await db.select().from(users);
    return userResults.map((user) => ({
      id: user.id,
      username: user.name,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      openId: user.openId,
      isActive: true
    }));
  } catch (error) {
    console.error("Get all users error:", error);
    return [];
  }
}
async function updatePasswordUser(userId, updates) {
  try {
    const db = await getDb();
    if (!db) return null;
    const now = /* @__PURE__ */ new Date();
    const updateData = { updatedAt: now };
    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.role) updateData.role = updates.role;
    await db.update(users).set(updateData).where(eq3(users.id, userId));
    if (updates.password) {
      const passwordHash = await bcrypt.hash(updates.password, 10);
      await db.update(passwordUsers).set({ passwordHash, updatedAt: now }).where(eq3(passwordUsers.userId, userId));
    }
    return getPasswordUser(userId);
  } catch (error) {
    console.error("Update user error:", error);
    return null;
  }
}
async function deletePasswordUser(userId) {
  try {
    const db = await getDb();
    if (!db) return false;
    await db.delete(passwordUsers).where(eq3(passwordUsers.userId, userId));
    await db.delete(users).where(eq3(users.id, userId));
    return true;
  } catch (error) {
    console.error("Delete user error:", error);
    return false;
  }
}
async function initializeDemoUsers() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Password Auth] Database not available, skipping demo user init");
      return { success: false };
    }
    let adminResult;
    try {
      adminResult = await db.select().from(users).where(eq3(users.name, "admin")).limit(1);
    } catch (e) {
      console.warn("[Password Auth] Cannot query users table yet (schema migration pending):", e.message);
      return { success: false };
    }
    if (adminResult.length === 0) {
      try {
        await registerPasswordUser(
          "admin",
          "admin123",
          "\u7BA1\u7406\u54E1",
          "admin@example.com",
          "admin"
        );
        console.log("[Password Auth] Admin user initialized");
      } catch (e) {
        console.warn("[Password Auth] Failed to create admin:", e.message);
      }
    }
    let userResult;
    try {
      userResult = await db.select().from(users).where(eq3(users.name, "user")).limit(1);
    } catch (e) {
      console.warn("[Password Auth] Cannot query users table:", e.message);
      return { success: false };
    }
    if (userResult.length === 0) {
      try {
        await registerPasswordUser(
          "user",
          "user123",
          "\u4E00\u822C\u4F7F\u7528\u8005",
          "user@example.com",
          "user"
        );
        console.log("[Password Auth] User user initialized");
      } catch (e) {
        console.warn("[Password Auth] Failed to create user:", e.message);
      }
    }
    console.log("[Password Auth] Demo users initialized successfully");
    return { success: true };
  } catch (error) {
    console.error("[Password Auth] Initialize demo users error (non-fatal):", error);
    return { success: false };
  }
}

// server/auth-routes.ts
var passwordAuthRouter = router({
  /**
   * 帳密登入
   * 返回使用者資訊和 session token（同時設定 cookie）
   */
  login: publicProcedure.input(
    z2.object({
      username: z2.string().min(3, "\u4F7F\u7528\u8005\u540D\u7A31\u81F3\u5C11 3 \u500B\u5B57\u7B26"),
      password: z2.string().min(1, "\u5BC6\u78BC\u4E0D\u80FD\u70BA\u7A7A")
    })
  ).mutation(async ({ input, ctx }) => {
    const user = await authenticatePasswordUser(input.username, input.password);
    if (!user) {
      throw new Error("\u4F7F\u7528\u8005\u540D\u7A31\u6216\u5BC6\u78BC\u932F\u8AA4");
    }
    const token = await sdk.createSessionToken(user.id, {
      openId: user.openId,
      name: user.name,
      expiresInMs: ONE_YEAR_MS
    });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      token
    };
  }),
  /**
   * 帳密註冊（僅管理者可用）
   */
  register: publicProcedure.input(
    z2.object({
      username: z2.string().min(3, "\u4F7F\u7528\u8005\u540D\u7A31\u81F3\u5C11 3 \u500B\u5B57\u7B26"),
      password: z2.string().min(6, "\u5BC6\u78BC\u81F3\u5C11 6 \u500B\u5B57\u7B26"),
      name: z2.string().min(1, "\u540D\u7A31\u4E0D\u80FD\u70BA\u7A7A"),
      role: z2.enum(["admin", "user"]).optional().default("user")
    })
  ).mutation(async ({ input }) => {
    try {
      const user = await registerPasswordUser(
        input.username,
        input.password,
        input.name,
        input.username + "@example.com",
        input.role
      );
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      };
    } catch (error) {
      throw new Error(error.message || "\u8A3B\u518A\u5931\u6557");
    }
  }),
  /**
   * 驗證 session token
   */
  verify: publicProcedure.input(z2.object({ token: z2.string() })).query(async ({ input }) => {
    const user = await getPasswordUser(parseInt(input.token));
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };
  }),
  /**
   * 初始化示例使用者（開發用）
   */
  initDemo: publicProcedure.mutation(async () => {
    try {
      await initializeDemoUsers();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  })
});

// server/password-user-routes.ts
import { z as z3 } from "zod";
var passwordUserManagementRouter = router({
  /**
   * 列出所有帳密使用者
   */
  list: adminProcedure.query(async () => {
    const users2 = await getAllPasswordUsers();
    return users2.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }));
  }),
  /**
   * 建立新的帳密使用者
   */
  create: adminProcedure.input(
    z3.object({
      username: z3.string().min(3, "\u4F7F\u7528\u8005\u540D\u7A31\u81F3\u5C11 3 \u500B\u5B57\u7B26"),
      password: z3.string().min(6, "\u5BC6\u78BC\u81F3\u5C11 6 \u500B\u5B57\u7B26"),
      name: z3.string().min(1, "\u540D\u7A31\u4E0D\u80FD\u70BA\u7A7A"),
      role: z3.enum(["admin", "user"]).default("user")
    })
  ).mutation(async ({ input }) => {
    try {
      const user = await registerPasswordUser(
        input.username,
        input.password,
        input.name,
        input.username + "@example.com",
        input.role
      );
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      };
    } catch (error) {
      throw new Error(error.message || "\u5EFA\u7ACB\u4F7F\u7528\u8005\u5931\u6557");
    }
  }),
  /**
   * 更新帳密使用者（名稱、角色、密碼）
   */
  update: adminProcedure.input(
    z3.object({
      id: z3.string(),
      name: z3.string().optional(),
      role: z3.enum(["admin", "user"]).optional(),
      password: z3.string().min(6).optional()
    })
  ).mutation(async ({ input }) => {
    const updates = {};
    if (input.name) updates.name = input.name;
    if (input.role) updates.role = input.role;
    if (input.password) updates.password = input.password;
    const updated = await updatePasswordUser(parseInt(input.id), updates);
    if (!updated) {
      throw new Error("\u4F7F\u7528\u8005\u4E0D\u5B58\u5728");
    }
    return {
      id: updated.id,
      username: updated.username,
      name: updated.name,
      role: updated.role
    };
  }),
  /**
   * 刪除帳密使用者
   */
  delete: adminProcedure.input(z3.object({ id: z3.string() })).mutation(async ({ input }) => {
    const deleted = await deletePasswordUser(parseInt(input.id));
    if (!deleted) {
      throw new Error("\u4F7F\u7528\u8005\u4E0D\u5B58\u5728");
    }
    return { success: true };
  }),
  /**
   * 取得單個帳密使用者
   */
  getById: adminProcedure.input(z3.object({ id: z3.string() })).query(async ({ input }) => {
    const user = await getPasswordUser(parseInt(input.id));
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };
  }),
  /**
   * 初始化 10 個預設帳密使用者
   */
  initializeDefaultUsers: adminProcedure.mutation(async () => {
    const defaultUsers = [
      { username: "admin", password: "admin123", name: "\u7BA1\u7406\u54E1", email: "admin@example.com", role: "admin" },
      { username: "user1", password: "user123", name: "\u4F7F\u7528\u80051", email: "user1@example.com", role: "user" },
      { username: "user2", password: "user123", name: "\u4F7F\u7528\u80052", email: "user2@example.com", role: "user" },
      { username: "user3", password: "user123", name: "\u4F7F\u7528\u80053", email: "user3@example.com", role: "user" },
      { username: "user4", password: "user123", name: "\u4F7F\u7528\u80054", email: "user4@example.com", role: "user" },
      { username: "user5", password: "user123", name: "\u4F7F\u7528\u80055", email: "user5@example.com", role: "user" },
      { username: "user6", password: "user123", name: "\u4F7F\u7528\u80056", email: "user6@example.com", role: "user" },
      { username: "user7", password: "user123", name: "\u4F7F\u7528\u80057", email: "user7@example.com", role: "user" },
      { username: "user8", password: "user123", name: "\u4F7F\u7528\u80058", email: "user8@example.com", role: "user" },
      { username: "user9", password: "user123", name: "\u4F7F\u7528\u80059", email: "user9@example.com", role: "user" }
    ];
    const results = [];
    for (const userData of defaultUsers) {
      try {
        const user = await registerPasswordUser(
          userData.username,
          userData.password,
          userData.name,
          userData.email,
          userData.role
        );
        results.push({ username: userData.username, status: "created", id: user.id });
      } catch (error) {
        results.push({ username: userData.username, status: "error", error: error.message });
      }
    }
    return {
      total: defaultUsers.length,
      results
    };
  })
});

// server/audit-log-routes.ts
import { z as z4 } from "zod";

// server/audit-log.ts
import fs from "fs";
import path from "path";
var LOG_DIR = path.join(process.cwd(), ".audit-logs");
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function logAuditEvent(entry) {
  ensureLogDir();
  const logFile = path.join(LOG_DIR, `audit-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.jsonl`);
  const logLine = JSON.stringify(entry) + "\n";
  try {
    fs.appendFileSync(logFile, logLine, "utf-8");
  } catch (error) {
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}
function readAuditLogs(options) {
  ensureLogDir();
  const logs = [];
  const files = fs.readdirSync(LOG_DIR).sort().reverse();
  for (const file of files) {
    if (!file.endsWith(".jsonl")) continue;
    const filePath = path.join(LOG_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter((line) => line.trim());
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (options?.startDate && new Date(entry.timestamp) < options.startDate) {
          continue;
        }
        if (options?.endDate && new Date(entry.timestamp) > options.endDate) {
          continue;
        }
        if (options?.userId && entry.userId !== options.userId) {
          continue;
        }
        if (options?.entity && entry.entity !== options.entity) {
          continue;
        }
        logs.push(entry);
        if (options?.limit && logs.length >= options.limit) {
          return logs;
        }
      } catch (error) {
        console.error("[AuditLog] Failed to parse log line:", error);
      }
    }
  }
  return logs;
}
function calculateChanges(before, after) {
  const changes = {};
  if (!before && after) {
    for (const key in after) {
      changes[key] = { after: after[key] };
    }
  } else if (before && !after) {
    for (const key in before) {
      changes[key] = { before: before[key] };
    }
  } else if (before && after) {
    for (const key in after) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes[key] = { before: before[key], after: after[key] };
      }
    }
  }
  return changes;
}

// server/audit-log-routes.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
function requireAdmin(ctx) {
  if (!ctx.user) {
    throw new TRPCError3({
      code: "UNAUTHORIZED",
      message: "\u672A\u767B\u5165"
    });
  }
  if (ctx.user.role !== "admin") {
    throw new TRPCError3({
      code: "FORBIDDEN",
      message: "\u9700\u8981\u7BA1\u7406\u54E1\u6B0A\u9650"
    });
  }
  return ctx.user;
}
var auditLogRouter = router({
  /**
   * 查詢操作日誌
   */
  list: protectedProcedure.input(
    z4.object({
      startDate: z4.string().optional(),
      endDate: z4.string().optional(),
      userId: z4.number().optional(),
      entity: z4.enum(["resident", "repair_request", "user"]).optional(),
      action: z4.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
      sortBy: z4.enum(["timestamp", "userId", "action", "entity"]).default("timestamp"),
      sortOrder: z4.enum(["asc", "desc"]).default("desc"),
      limit: z4.number().default(100)
    })
  ).query(({ ctx, input }) => {
    requireAdmin(ctx);
    let logs = readAuditLogs({
      startDate: input.startDate ? new Date(input.startDate) : void 0,
      endDate: input.endDate ? new Date(input.endDate) : void 0,
      userId: input.userId,
      entity: input.entity,
      limit: input.limit * 2
      // 先讀取更多紀錄以便排序
    });
    if (input.action) {
      logs = logs.filter((log) => log.action === input.action);
    }
    logs.sort((a, b) => {
      let aVal = a[input.sortBy];
      let bVal = b[input.sortBy];
      if (input.sortBy === "timestamp") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (aVal < bVal) return input.sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return input.sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return logs.slice(0, input.limit);
  }),
  /**
   * 查詢特定使用者的操作日誌
   */
  byUser: protectedProcedure.input(z4.object({ userId: z4.number(), limit: z4.number().default(50) })).query(({ ctx, input }) => {
    requireAdmin(ctx);
    const logs = readAuditLogs({
      userId: input.userId,
      limit: input.limit
    });
    return logs;
  }),
  /**
   * 查詢特定實體的操作日誌
   */
  byEntity: protectedProcedure.input(
    z4.object({
      entity: z4.enum(["resident", "repair_request", "user"]),
      limit: z4.number().default(50)
    })
  ).query(({ ctx, input }) => {
    requireAdmin(ctx);
    const logs = readAuditLogs({
      entity: input.entity,
      limit: input.limit
    });
    return logs;
  })
});

// server/repair-requests-routes.ts
import { z as z5 } from "zod";
init_db();
var repairRequestInput = z5.object({
  unitNumber: z5.string().min(1, "\u6236\u865F\u70BA\u5FC5\u586B"),
  description: z5.string().min(1, "\u63CF\u8FF0\u70BA\u5FC5\u586B"),
  status: z5.enum(["pending", "in_progress", "completed", "cancelled", "resident_self_repair"]).default("pending"),
  repairDate: z5.string().optional(),
  completionDate: z5.string().optional().nullable(),
  notes: z5.string().optional().nullable()
});
var repairRequestsWithAuditRouter = router({
  list: protectedProcedure.input(
    z5.object({
      status: z5.string().optional()
    })
  ).query(({ ctx, input }) => {
    return listRepairRequests({ status: input.status });
  }),
  get: protectedProcedure.input(z5.object({ id: z5.number() })).query(({ ctx, input }) => {
    return getRepairRequestById(input.id);
  }),
  create: protectedProcedure.input(repairRequestInput).mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    const result = await createRepairRequest({
      ...input,
      repairDate: input.repairDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 16)
    });
    logAuditEvent({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: user.id,
      userName: user.name || user.email || "Unknown",
      action: "CREATE",
      entity: "repair_request",
      entityId: result.id,
      changes: calculateChanges(null, input)
    });
    syncToRemote("create", "repair_requests", {
      ...input,
      id: result.id
    }, "id", result.id).catch(() => {
    });
    return result;
  }),
  update: protectedProcedure.input(z5.object({ id: z5.number(), unitNumber: z5.string().min(1), description: z5.string().min(1), status: z5.enum(["pending", "in_progress", "completed", "cancelled", "resident_self_repair"]).optional(), repairDate: z5.string().optional(), completionDate: z5.string().optional().nullable(), notes: z5.string().optional().nullable() })).mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    const before = await getRepairRequestById(input.id);
    const { id, ...updateData } = input;
    const result = await updateRepairRequest(id, updateData);
    logAuditEvent({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: user.id,
      userName: user.name || user.email || "Unknown",
      action: "UPDATE",
      entity: "repair_request",
      entityId: id,
      changes: calculateChanges(before || null, result)
    });
    syncToRemote("update", "repair_requests", {
      ...input,
      id
    }, "id", id).catch(() => {
    });
    return result;
  }),
  delete: protectedProcedure.input(z5.object({ id: z5.number() })).mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    const before = await getRepairRequestById(input.id);
    await deleteRepairRequest(input.id);
    logAuditEvent({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: user.id,
      userName: user.name || user.email || "Unknown",
      action: "DELETE",
      entity: "repair_request",
      entityId: input.id,
      changes: calculateChanges(before || null, null)
    });
    if (before) {
      syncToRemote("delete", "repair_requests", before, "id", input.id).catch(() => {
      });
    }
    return { success: true };
  })
});

// server/residents-routes.ts
import { z as z6 } from "zod";
init_db();
var emergencyContactInput = z6.object({
  id: z6.number().optional(),
  name: z6.string().min(1, "\u7DCA\u6025\u806F\u7D61\u4EBA\u59D3\u540D\u70BA\u5FC5\u586B"),
  phone: z6.string().optional().nullable(),
  relation: z6.string().optional().nullable(),
  address: z6.string().optional().nullable()
});
var residentInput = z6.object({
  unitNumber: z6.string().min(1, "\u6236\u865F\u70BA\u5FC5\u586B"),
  ownerName: z6.string().min(1, "\u5340\u6B0A\u4EBA\u59D3\u540D\u70BA\u5FC5\u586B"),
  ownerPhone: z6.string().optional().nullable(),
  coResident1Name: z6.string().optional().nullable(),
  coResident1Phone: z6.string().optional().nullable(),
  coResident2Name: z6.string().optional().nullable(),
  coResident2Phone: z6.string().optional().nullable(),
  coResident3Name: z6.string().optional().nullable(),
  coResident3Phone: z6.string().optional().nullable(),
  coResident4Name: z6.string().optional().nullable(),
  coResident4Phone: z6.string().optional().nullable(),
  carParkingNumber: z6.string().optional().nullable(),
  carPlateNumber: z6.string().optional().nullable(),
  motorcycleParkingNumber: z6.string().optional().nullable(),
  motorcyclePlateNumber: z6.string().optional().nullable(),
  bicycleParkingNumber: z6.string().optional().nullable(),
  address: z6.string().optional().nullable(),
  emergencyContactName: z6.string().optional().nullable(),
  emergencyContactPhone: z6.string().optional().nullable(),
  emergencyContactRelation: z6.string().optional().nullable(),
  emergencyContactAddress: z6.string().optional().nullable(),
  emergencyContact2Name: z6.string().optional().nullable(),
  emergencyContact2Phone: z6.string().optional().nullable(),
  emergencyContact2Relation: z6.string().optional().nullable(),
  emergencyContact2Address: z6.string().optional().nullable(),
  squareMeters: z6.string().optional().nullable(),
  waterMeterNumber: z6.string().optional().nullable(),
  electricityMeterNumber: z6.string().optional().nullable(),
  moveInDate: z6.string().optional().nullable(),
  notes: z6.string().optional().nullable(),
  emergencyContacts: z6.array(emergencyContactInput).optional()
});
var residentsWithAuditRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const residents2 = await listResidents();
      console.log(`[DEBUG] list: Found ${residents2.length} residents`);
      return residents2;
    } catch (err) {
      console.error("[ERROR] list procedure failed:", err);
      throw err;
    }
  }),
  get: protectedProcedure.input(z6.object({ id: z6.number() })).query(async ({ ctx, input }) => {
    try {
      console.log("[DEBUG] residents.get: Fetching resident", input.id);
      const resident = await getResidentById(input.id);
      if (!resident) return null;
      const emergencyContacts2 = await getEmergencyContactsByResidentId(input.id);
      console.log("[DEBUG] residents.get: Returning resident with emergencyContacts:", emergencyContacts2?.length || 0);
      return {
        ...resident,
        emergencyContacts: emergencyContacts2 || []
      };
    } catch (err) {
      console.error("[ERROR] get procedure failed:", err);
      throw err;
    }
  }),
  create: protectedProcedure.input(residentInput).mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    const { emergencyContacts: emergencyContactsInput, ...residentData } = input;
    const result = await createResident(residentData);
    const residentId = result?.insertId || result?.[0]?.insertId || result.id;
    if (!residentId) {
      throw new Error("Failed to create resident: no ID returned");
    }
    if (emergencyContactsInput && emergencyContactsInput.length > 0) {
      for (const contact of emergencyContactsInput) {
        if (contact.name) {
          await createEmergencyContact({
            residentId,
            name: contact.name,
            phone: contact.phone || null,
            relationship: contact.relation || null,
            address: contact.address || null
          });
        }
      }
    }
    logAuditEvent({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: user.id,
      userName: user.name || user.email || "Unknown",
      action: "CREATE",
      entity: "resident",
      entityId: residentId,
      changes: calculateChanges(null, input)
    });
    syncToRemote("create", "residents", {
      ...input,
      id: residentId
    }, "unitNumber", input.unitNumber).catch(() => {
    });
    return result;
  }),
  update: protectedProcedure.input(z6.object({ id: z6.number(), ...residentInput.shape })).mutation(async ({ ctx, input }) => {
    console.log("[DEBUG] update: Called with id:", input.id, "unitNumber:", input.unitNumber);
    const user = ctx.user;
    const before = await getResidentById(input.id);
    const { id, emergencyContacts: emergencyContactsInput, ...updateData } = input;
    const result = await updateResident(id, updateData);
    if (emergencyContactsInput) {
      await deleteEmergencyContactsByResidentId(id);
      for (const contact of emergencyContactsInput) {
        if (contact.name || contact.phone) {
          console.log("[DEBUG] Creating emergency contact for resident", id, ":", contact);
          await createEmergencyContact({
            residentId: id,
            name: contact.name || "N/A",
            phone: contact.phone || null,
            relationship: contact.relation || null,
            address: contact.address || null
          });
        }
      }
    }
    logAuditEvent({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: user.id,
      userName: user.name || user.email || "Unknown",
      action: "UPDATE",
      entity: "resident",
      entityId: id,
      changes: calculateChanges(before || null, result)
    });
    syncToRemote("update", "residents", {
      ...input,
      id
    }, "unitNumber", input.unitNumber).catch(() => {
    });
    console.log("[DEBUG] update: Successfully updated resident:", id);
    return result;
  }),
  delete: protectedProcedure.input(z6.object({ id: z6.number() })).mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    const before = await getResidentById(input.id);
    await deleteEmergencyContactsByResidentId(input.id);
    await deleteResident(input.id);
    logAuditEvent({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: user.id,
      userName: user.name || user.email || "Unknown",
      action: "DELETE",
      entity: "resident",
      entityId: input.id,
      changes: calculateChanges(before || null, null)
    });
    if (before) {
      syncToRemote("delete", "residents", before, "unitNumber", before.unitNumber).catch(() => {
      });
    }
    return { success: true };
  }),
  validateUnitNumber: protectedProcedure.input(z6.object({ unitNumber: z6.string() })).query(({ input }) => {
    const unitNumber = input.unitNumber.trim().toUpperCase();
    const ariMatch = unitNumber.match(/^([A-Z]+)/);
    const mainMatch = unitNumber.match(/(\d+)/);
    const floorMatch = unitNumber.match(/(\d+)([A-Z]?)$/);
    if (!ariMatch || !mainMatch || !floorMatch) {
      return { valid: false, error: "\u6236\u865F\u683C\u5F0F\u4E0D\u6B63\u78BA" };
    }
    const ari = ariMatch[1];
    const mainNum = mainMatch[1];
    const floor = floorMatch[1];
    const floorLetter = floorMatch[2] || "F";
    const validAris = ["A", "B", "E", "S"];
    if (!validAris.includes(ari)) {
      return { valid: false, error: `\u6236\u5225 ${ari} \u4E0D\u5B58\u5728` };
    }
    return { valid: true, ari, mainNum, floor, floorLetter };
  }),
  importBatch: protectedProcedure.input(z6.object({ residents: z6.array(residentInput) })).mutation(async ({ ctx, input }) => {
    const user = ctx.user;
    const results = [];
    for (const residentData of input.residents) {
      try {
        const { emergencyContacts: emergencyContactsInput, ...data } = residentData;
        const result = await createResident(data);
        const residentId = result[0]?.insertId || result.id;
        if (emergencyContactsInput && emergencyContactsInput.length > 0) {
          for (const contact of emergencyContactsInput) {
            if (contact.name) {
              await createEmergencyContact({
                residentId,
                name: contact.name,
                phone: contact.phone || null,
                relationship: contact.relation || null,
                address: contact.address || null
              });
            }
          }
        }
        logAuditEvent({
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          userId: user.id,
          userName: user.name || user.email || "Unknown",
          action: "CREATE",
          entity: "resident",
          entityId: residentId,
          changes: calculateChanges(null, residentData)
        });
        results.push({ success: true, unitNumber: residentData.unitNumber });
        syncToRemote("create", "residents", {
          ...residentData,
          id: residentId
        }, "unitNumber", residentData.unitNumber).catch(() => {
        });
      } catch (error) {
        results.push({
          success: false,
          unitNumber: residentData.unitNumber,
          error: error.message
        });
      }
    }
    return results;
  }),
  clearAll: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.user;
    const residents_list = await listResidents();
    for (const resident of residents_list) {
      await deleteEmergencyContactsByResidentId(resident.id);
      await deleteResident(resident.id);
      logAuditEvent({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userId: user.id,
        userName: user.name || user.email || "Unknown",
        action: "DELETE",
        entity: "resident",
        entityId: resident.id,
        changes: calculateChanges(resident, null)
      });
    }
    for (const resident of residents_list) {
      syncToRemote("delete", "residents", resident, "unitNumber", resident.unitNumber).catch(() => {
      });
    }
    return { success: true, deletedCount: residents_list.length };
  })
});

// server/account-management-routes.ts
import { TRPCError as TRPCError4 } from "@trpc/server";
import { z as z7 } from "zod";
var accountManagementRouter = router({
  // 獲取所有帳密使用者
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError4({ code: "FORBIDDEN" });
    }
    return getAllPasswordUsers();
  }),
  // 建立新帳號
  create: protectedProcedure.input(
    z7.object({
      username: z7.string().min(3),
      password: z7.string().min(6),
      name: z7.string().min(1),
      role: z7.enum(["admin", "user"])
    })
  ).mutation(async ({ input, ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError4({ code: "FORBIDDEN" });
    }
    try {
      const newUser = await registerPasswordUser(
        input.username,
        input.password,
        input.name,
        input.username + "@example.com",
        input.role
      );
      logAuditEvent({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        action: "CREATE",
        entity: "user",
        entityId: newUser.id,
        changes: {
          username: { after: newUser.username },
          name: { after: newUser.name },
          role: { after: newUser.role }
        }
      });
      return newUser;
    } catch (error) {
      throw new TRPCError4({
        code: "BAD_REQUEST",
        message: error instanceof Error ? error.message : "\u5EFA\u7ACB\u5E33\u865F\u5931\u6557"
      });
    }
  }),
  // 更新帳號
  update: protectedProcedure.input(
    z7.object({
      id: z7.number(),
      name: z7.string().min(1).optional(),
      role: z7.enum(["admin", "user"]).optional(),
      password: z7.string().min(6).optional().or(z7.literal("")),
      isActive: z7.boolean().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError4({ code: "FORBIDDEN" });
    }
    const user = await getPasswordUser(input.id);
    if (!user) {
      throw new TRPCError4({ code: "NOT_FOUND" });
    }
    const updates = {};
    if (input.name !== void 0) updates.name = input.name;
    if (input.role !== void 0) updates.role = input.role;
    if (input.password !== void 0 && input.password !== "") updates.password = input.password;
    if (input.isActive !== void 0) updates.isActive = input.isActive;
    const updated = await updatePasswordUser(input.id, updates);
    const changeLog = {};
    Object.entries(updates).forEach(([key, value]) => {
      changeLog[key] = { before: user[key], after: value };
    });
    logAuditEvent({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: ctx.user.id,
      userName: ctx.user.name || "Unknown",
      action: "UPDATE",
      entity: "user",
      entityId: input.id,
      changes: changeLog
    });
    return updated;
  }),
  // 停用帳號
  deactivate: protectedProcedure.input(z7.object({ id: z7.number() })).mutation(async ({ input, ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError4({ code: "FORBIDDEN" });
    }
    const user = await getPasswordUser(input.id);
    if (!user) {
      throw new TRPCError4({ code: "NOT_FOUND" });
    }
    const updated = await updatePasswordUser(input.id, { isActive: false });
    logAuditEvent({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: ctx.user.id,
      userName: ctx.user.name || "Unknown",
      action: "UPDATE",
      entity: "user",
      entityId: input.id,
      changes: { isActive: { before: true, after: false } }
    });
    return updated;
  }),
  // 啟用帳號
  activate: protectedProcedure.input(z7.object({ id: z7.number() })).mutation(async ({ input, ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError4({ code: "FORBIDDEN" });
    }
    const user = await getPasswordUser(input.id);
    if (!user) {
      throw new TRPCError4({ code: "NOT_FOUND" });
    }
    const updated = await updatePasswordUser(input.id, { isActive: true });
    logAuditEvent({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: ctx.user.id,
      userName: ctx.user.name || "Unknown",
      action: "UPDATE",
      entity: "user",
      entityId: input.id,
      changes: { isActive: { before: false, after: true } }
    });
    return updated;
  })
});

// server/renovation-applications-routes.ts
import { z as z8 } from "zod";
init_db();
init_schema();
import { eq as eq4 } from "drizzle-orm";
var renovationApplicationsRouter = router({
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(renovationApplications).orderBy(renovationApplications.createdAt);
    return result;
  }),
  getById: protectedProcedure.input(z8.object({ id: z8.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.select().from(renovationApplications).where(eq4(renovationApplications.id, input.id)).limit(1);
    return result[0] || null;
  }),
  create: protectedProcedure.input(
    z8.object({
      unitNumber: z8.string().min(1),
      applicationDate: z8.string().min(1),
      constructionStartDate: z8.string().optional().nullable(),
      constructionEndDate: z8.string().optional().nullable(),
      constructionContent: z8.string().min(1),
      consentLetterPasted: z8.string().optional().nullable(),
      applicantName: z8.string().min(1),
      applicantPhone: z8.string().min(1),
      registeredBy: z8.string().optional().nullable(),
      status: z8.enum(["pending", "approved", "completed", "rejected"]).default("pending"),
      decorationDeposit: z8.string().optional().nullable(),
      decorationDepositStatus: z8.enum(["notPaid", "paid", "refunded"]).optional().default("notPaid"),
      notes: z8.string().optional().nullable()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(renovationApplications).values({
      ...input,
      consentLetterPasted: input.consentLetterPasted || null,
      constructionStartDate: input.constructionStartDate || null,
      constructionEndDate: input.constructionEndDate || null,
      registeredBy: input.registeredBy || null,
      decorationDeposit: input.decorationDeposit || null,
      decorationDepositStatus: input.decorationDepositStatus || "notPaid",
      notes: input.notes || null
    });
    const insertId = result?.[0]?.insertId || result?.insertId;
    syncToRemote("create", "renovation_applications", {
      ...input,
      id: insertId
    }, "id", insertId).catch(() => {
    });
    return result;
  }),
  update: protectedProcedure.input(
    z8.object({
      id: z8.number(),
      unitNumber: z8.string().min(1),
      applicationDate: z8.string().min(1),
      constructionStartDate: z8.string().optional().nullable(),
      constructionEndDate: z8.string().optional().nullable(),
      constructionContent: z8.string().min(1),
      consentLetterPasted: z8.string().optional().nullable(),
      applicantName: z8.string().min(1),
      applicantPhone: z8.string().min(1),
      registeredBy: z8.string().optional().nullable(),
      status: z8.enum(["pending", "approved", "completed", "rejected"]),
      decorationDeposit: z8.string().optional().nullable(),
      decorationDepositStatus: z8.enum(["notPaid", "paid", "refunded"]).optional(),
      notes: z8.string().optional().nullable()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...data } = input;
    const result = await db.update(renovationApplications).set({
      ...data,
      consentLetterPasted: data.consentLetterPasted || null,
      constructionStartDate: data.constructionStartDate || null,
      constructionEndDate: data.constructionEndDate || null,
      registeredBy: data.registeredBy || null,
      decorationDeposit: data.decorationDeposit || null,
      decorationDepositStatus: data.decorationDepositStatus || void 0,
      notes: data.notes || null
    }).where(eq4(renovationApplications.id, id));
    syncToRemote("update", "renovation_applications", {
      ...input,
      id: input.id
    }, "id", input.id).catch(() => {
    });
    return result;
  }),
  delete: protectedProcedure.input(z8.object({ id: z8.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.delete(renovationApplications).where(eq4(renovationApplications.id, input.id));
    syncToRemote("delete", "renovation_applications", { id: input.id }, "id", input.id).catch(() => {
    });
    return result;
  })
});

// server/resource-library-routes.ts
import { z as z9 } from "zod";
init_db();
init_schema();
import { eq as eq5, desc as desc2 } from "drizzle-orm";
var resourceLibraryRouter = router({
  // 文件夾操作
  listFolders: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const folders = await db.select().from(resourceFolders).orderBy(desc2(resourceFolders.createdAt));
    return folders;
  }),
  createFolder: protectedProcedure.input(
    z9.object({
      name: z9.string().min(1, "\u6587\u4EF6\u593E\u540D\u7A31\u4E0D\u80FD\u70BA\u7A7A"),
      description: z9.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(resourceFolders).values({
      name: input.name,
      description: input.description
    });
    const folderId = result?.[0]?.insertId || result?.insertId;
    syncToRemote("create", "resource_folders", {
      ...input,
      id: folderId
    }, "id", folderId).catch(() => {
    });
    return result;
  }),
  updateFolder: protectedProcedure.input(
    z9.object({
      id: z9.number(),
      name: z9.string().min(1, "\u6587\u4EF6\u593E\u540D\u7A31\u4E0D\u80FD\u70BA\u7A7A"),
      description: z9.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.update(resourceFolders).set({
      name: input.name,
      description: input.description
    }).where(eq5(resourceFolders.id, input.id));
    syncToRemote("update", "resource_folders", {
      ...input,
      id: input.id
    }, "id", input.id).catch(() => {
    });
    return result;
  }),
  deleteFolder: protectedProcedure.input(z9.object({ id: z9.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.delete(resourceFolders).where(eq5(resourceFolders.id, input.id));
    syncToRemote("delete", "resource_folders", { id: input.id }, "id", input.id).catch(() => {
    });
    return result;
  }),
  // 檔案操作
  listFiles: protectedProcedure.input(z9.object({ folderId: z9.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const files = await db.select().from(resourceFiles).where(eq5(resourceFiles.folderId, input.folderId)).orderBy(desc2(resourceFiles.createdAt));
    return files;
  }),
  createFile: protectedProcedure.input(
    z9.object({
      folderId: z9.number(),
      name: z9.string().min(1, "\u6A94\u6848\u540D\u7A31\u4E0D\u80FD\u70BA\u7A7A"),
      fileUrl: z9.string().min(1, "\u6A94\u6848 URL \u4E0D\u80FD\u70BA\u7A7A"),
      fileSize: z9.number().optional(),
      fileType: z9.string().default("pdf")
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(resourceFiles).values({
      folderId: input.folderId,
      name: input.name,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize,
      fileType: input.fileType,
      uploadedBy: ctx.user?.id
    });
    const fileId = result?.[0]?.insertId || result?.insertId;
    syncToRemote("create", "resource_files", {
      ...input,
      id: fileId
    }, "id", fileId).catch(() => {
    });
    return result;
  }),
  updateFile: protectedProcedure.input(
    z9.object({
      id: z9.number(),
      name: z9.string().min(1, "\u6A94\u6848\u540D\u7A31\u4E0D\u80FD\u70BA\u7A7A"),
      fileUrl: z9.string().min(1, "\u6A94\u6848 URL \u4E0D\u80FD\u70BA\u7A7A").optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const updateData = {
      name: input.name
    };
    if (input.fileUrl) {
      updateData.fileUrl = input.fileUrl;
    }
    const result = await db.update(resourceFiles).set(updateData).where(eq5(resourceFiles.id, input.id));
    syncToRemote("update", "resource_files", {
      ...input,
      id: input.id
    }, "id", input.id).catch(() => {
    });
    return result;
  }),
  deleteFile: protectedProcedure.input(z9.object({ id: z9.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.delete(resourceFiles).where(eq5(resourceFiles.id, input.id));
    syncToRemote("delete", "resource_files", { id: input.id }, "id", input.id).catch(() => {
    });
    return result;
  }),
  // 獲取檔案詳情
  getFile: protectedProcedure.input(z9.object({ id: z9.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const file = await db.select().from(resourceFiles).where(eq5(resourceFiles.id, input.id));
    return file[0] || null;
  })
});

// server/regulation-settings-routes.ts
import { z as z10 } from "zod";
init_db();
function escapeSql(str) {
  return str.replace(/'/g, "''");
}
var regulationSettingsRouter = router({
  // 取得目前規約 PDF URL（任何登入者都可讀）
  getRegulation: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.execute(
      `SELECT key, value, description, updated_at FROM system_settings WHERE key = 'regulation_pdf_url'`
    );
    const rows = result.rows || [];
    if (rows.length === 0) {
      return { pdfUrl: null, description: null, updatedAt: null };
    }
    const row = rows[0];
    return {
      pdfUrl: row.value,
      description: row.description,
      updatedAt: row.updated_at
    };
  }),
  // 更新規約 PDF URL（需要 admin 權限）
  updateRegulation: adminProcedure.input(
    z10.object({
      pdfUrl: z10.string().min(1, "PDF URL \u4E0D\u80FD\u70BA\u7A7A"),
      description: z10.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const desc3 = escapeSql(input.description || "\u4F4F\u6236\u7BA1\u7406\u898F\u7D04 PDF \u7DB2\u5740");
    const url = escapeSql(input.pdfUrl);
    await db.execute(
      `INSERT INTO system_settings (key, value, description)
         VALUES ('regulation_pdf_url', '${url}', '${desc3}')
         ON CONFLICT (key) DO UPDATE SET value = '${url}', updated_at = NOW()`
    );
    return { success: true };
  })
});

// server/routers.ts
var residentInput2 = z11.object({
  unitNumber: z11.string().min(1, "\u6236\u865F\u70BA\u5FC5\u586B"),
  ownerName: z11.string().min(1, "\u5340\u6B0A\u4EBA\u59D3\u540D\u70BA\u5FC5\u586B"),
  ownerPhone: z11.string().optional().nullable(),
  coResident1Name: z11.string().optional().nullable(),
  coResident1Phone: z11.string().optional().nullable(),
  coResident2Name: z11.string().optional().nullable(),
  coResident2Phone: z11.string().optional().nullable(),
  coResident3Name: z11.string().optional().nullable(),
  coResident3Phone: z11.string().optional().nullable(),
  coResident4Name: z11.string().optional().nullable(),
  coResident4Phone: z11.string().optional().nullable(),
  carParkingNumber: z11.string().optional().nullable(),
  carPlateNumber: z11.string().optional().nullable(),
  motorcycleParkingNumber: z11.string().optional().nullable(),
  motorcyclePlateNumber: z11.string().optional().nullable(),
  bicycleParkingNumber: z11.string().optional().nullable(),
  address: z11.string().optional().nullable(),
  emergencyContactName: z11.string().optional().nullable(),
  emergencyContactPhone: z11.string().optional().nullable(),
  emergencyContactRelation: z11.string().optional().nullable(),
  emergencyContactAddress: z11.string().optional().nullable(),
  emergencyContact2Name: z11.string().optional().nullable(),
  emergencyContact2Phone: z11.string().optional().nullable(),
  emergencyContact2Relation: z11.string().optional().nullable(),
  emergencyContact2Address: z11.string().optional().nullable(),
  squareMeters: z11.string().optional().nullable(),
  waterMeterNumber: z11.string().optional().nullable(),
  electricityMeterNumber: z11.string().optional().nullable(),
  moveInDate: z11.string().regex(/^\d{4}-\d{2}-\d{2}$/, "\u5165\u4F4F\u65E5\u671F\u683C\u5F0F\u61C9\u70BA YYYY-MM-DD").optional().nullable(),
  notes: z11.string().optional().nullable()
});
var repairRequestInput2 = z11.object({
  repairDate: z11.string().regex(/^\d{4}-\d{2}-\d{2}$/, "\u5831\u4FEE\u65E5\u671F\u683C\u5F0F\u61C9\u70BA YYYY-MM-DD"),
  unitNumber: z11.string().min(1, "\u6236\u865F\u70BA\u5FC5\u586B"),
  reporterName: z11.string().optional().nullable(),
  description: z11.string().min(1, "\u72C0\u6CC1\u63CF\u8FF0\u70BA\u5FC5\u586B"),
  location: z11.string().optional().nullable(),
  status: z11.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
  handlerNotes: z11.string().optional().nullable(),
  completedDate: z11.string().regex(/^\d{4}-\d{2}-\d{2}$/, "\u5B8C\u6210\u65E5\u671F\u683C\u5F0F\u61C9\u70BA YYYY-MM-DD").optional().nullable()
});
var residentsRouter = router({
  list: publicProcedure.input(z11.object({ search: z11.string().optional() }).optional()).query(async ({ input }) => {
    return listResidents(input?.search);
  }),
  getById: publicProcedure.input(z11.object({ id: z11.number() })).query(async ({ input }) => {
    return getResidentById(input.id);
  }),
  create: publicProcedure.input(residentInput2).mutation(async ({ input }) => {
    const data = {
      ...input,
      moveInDate: input.moveInDate || null
    };
    await createResident(data);
    return { success: true };
  }),
  update: publicProcedure.input(z11.object({ id: z11.number(), data: residentInput2.partial() })).mutation(async ({ input }) => {
    const data = {
      ...input.data,
      moveInDate: input.data.moveInDate !== void 0 ? input.data.moveInDate || null : void 0
    };
    await updateResident(input.id, data);
    return { success: true };
  }),
  delete: publicProcedure.input(z11.object({ id: z11.number() })).mutation(async ({ input }) => {
    await deleteResident(input.id);
    return { success: true };
  }),
  clearAll: publicProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(residents);
    return { success: true };
  }),
  validateUnitNumber: publicProcedure.input(z11.object({ unitNumber: z11.string(), excludeId: z11.number().optional() })).query(async ({ input }) => {
    const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9\-]+$/;
    if (!formatRegex.test(input.unitNumber)) {
      return { valid: false, error: "\u6236\u865F\u683C\u5F0F\u4E0D\u7B26\uFF08\u53EA\u5141\u8A31\u4E2D\u6587\u3001\u82F1\u6587\u3001\u6578\u5B57\u3001\u9023\u5B57\u865F\uFF09" };
    }
    const residents2 = await listResidents();
    const isDuplicate = residents2.some(
      (r) => r.unitNumber === input.unitNumber && r.id !== input.excludeId
    );
    if (isDuplicate) {
      return { valid: false, error: "\u6B64\u6236\u865F\u5DF2\u5B58\u5728\uFF0C\u8ACB\u4F7F\u7528\u4E0D\u540C\u7684\u6236\u865F" };
    }
    return { valid: true };
  }),
  importBatch: publicProcedure.input(z11.object({ residents: z11.array(residentInput2) })).mutation(async ({ input }) => {
    const batchInput = input.residents;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    for (let i = 0; i < batchInput.length; i++) {
      try {
        await createResident(batchInput[i]);
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push({
          index: i,
          unitNumber: batchInput[i].unitNumber,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    return {
      success: errorCount === 0,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : void 0
    };
  }),
  exportExcel: publicProcedure.query(async () => {
    const allResidents = await listResidents();
    return allResidents;
  })
});
var repairRequestsRouter = router({
  list: publicProcedure.input(z11.object({
    status: z11.string().optional(),
    unitNumber: z11.string().optional()
  }).optional()).query(async ({ input }) => {
    return listRepairRequests(input);
  }),
  getById: publicProcedure.input(z11.object({ id: z11.number() })).query(async ({ input }) => {
    return getRepairRequestById(input.id);
  }),
  create: publicProcedure.input(repairRequestInput2).mutation(async ({ input }) => {
    await createRepairRequest(input);
    return { success: true };
  }),
  update: publicProcedure.input(z11.object({ id: z11.number(), data: repairRequestInput2.partial() })).mutation(async ({ input }) => {
    await updateRepairRequest(input.id, input.data);
    return { success: true };
  }),
  delete: publicProcedure.input(z11.object({ id: z11.number() })).mutation(async ({ input }) => {
    await deleteRepairRequest(input.id);
    return { success: true };
  })
});
var adminRouter = router({
  listUsers: adminProcedure.query(async () => {
    return listAllUsers();
  }),
  updateUserRole: adminProcedure.input(z11.object({ openId: z11.string(), role: z11.enum(["admin", "user"]) })).mutation(async ({ input }) => {
    await updateUserRole(input.openId, input.role);
    return { success: true };
  }),
  backup: adminProcedure.query(async () => {
    const data = await backupAllData();
    return data;
  }),
  restoreResidents: adminProcedure.input(z11.object({ data: z11.array(z11.any()) })).mutation(async ({ input }) => {
    const result = await restoreResidents(input.data);
    return result;
  }),
  restoreRepairRequests: adminProcedure.input(z11.object({ data: z11.array(z11.any()) })).mutation(async ({ input }) => {
    const result = await restoreRepairRequests(input.data);
    return result;
  }),
  // 新增操作日誌和會話管理程序
  getUsers: adminProcedure.query(async () => {
    return listAllUsers();
  }),
  getOperationLogs: adminProcedure.input(z11.object({ limit: z11.number().default(50) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const { operationLogs: operationLogs2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { desc: desc3 } = await import("drizzle-orm");
    const logs = await db.select().from(operationLogs2).orderBy((t2) => desc3(t2.createdAt)).limit(input.limit);
    return logs;
  }),
  getUserSessions: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const { userSessions: userSessions2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { eq: eq6 } = await import("drizzle-orm");
    const sessions = await db.select().from(userSessions2).where(eq6(userSessions2.isActive, 1));
    return sessions;
  }),
  forceLogoutUser: adminProcedure.input(z11.object({ sessionId: z11.number() })).mutation(async ({ input }) => {
    const { logoutUserSession: logoutUserSession2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    await logoutUserSession2(input.sessionId);
    return { success: true };
  })
});
var invitedUsersRouter = router({
  /**
   * 列出所有受邀人員
   */
  list: adminProcedure.query(async () => {
    const invited = await getAllInvitedUsers();
    return invited.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      invitedAt: u.invitedAt,
      acceptedAt: u.acceptedAt
    }));
  }),
  /**
   * 添加受邀人員
   */
  add: adminProcedure.input(
    z11.object({
      email: z11.string().email("\u90F5\u7BB1\u683C\u5F0F\u4E0D\u6B63\u78BA"),
      name: z11.string().optional(),
      role: z11.enum(["admin", "user"]).default("user"),
      notes: z11.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    try {
      await addInvitedUser(
        input.email,
        input.name || input.email,
        input.role,
        ctx.user?.id,
        input.notes
      );
      await logOperation({
        userId: ctx.user?.id || 0,
        action: "CREATE",
        module: "invited_users",
        targetType: "email",
        description: `Added invited user: ${input.email}`,
        details: { email: input.email, role: input.role }
      });
      syncToRemote("create", "invited_users", {
        email: input.email,
        name: input.name || input.email,
        role: input.role,
        notes: input.notes
      }, "email", input.email).catch(() => {
      });
      return { success: true, message: "\u53D7\u9080\u4EBA\u54E1\u6DFB\u52A0\u6210\u529F" };
    } catch (error) {
      throw new Error(error.message || "\u6DFB\u52A0\u53D7\u9080\u4EBA\u54E1\u5931\u6557");
    }
  }),
  /**
   * 刪除受邀人員
   */
  delete: adminProcedure.input(z11.object({ id: z11.number() })).mutation(async ({ input, ctx }) => {
    try {
      const invited = await getInvitedUserById(input.id);
      if (!invited) {
        throw new Error("\u53D7\u9080\u4EBA\u54E1\u4E0D\u5B58\u5728");
      }
      await deleteInvitedUser(input.id);
      await logOperation({
        userId: ctx.user?.id || 0,
        action: "DELETE",
        module: "invited_users",
        targetType: "email",
        description: `Deleted invited user: ${invited.email}`,
        details: { id: input.id }
      });
      if (invited) {
        syncToRemote("delete", "invited_users", invited, "email", invited.email).catch(() => {
        });
      }
      return { success: true, message: "\u53D7\u9080\u4EBA\u54E1\u522A\u9664\u6210\u529F" };
    } catch (error) {
      throw new Error(error.message || "\u522A\u9664\u53D7\u9080\u4EBA\u54E1\u5931\u6557");
    }
  }),
  /**
   * 検查郵箱是否被邀請
   */
  checkEmail: publicProcedure.input(z11.object({ email: z11.string().email() })).query(async ({ input }) => {
    const isInvited = await isEmailInvited(input.email);
    return { isInvited };
  }),
  /**
   * 更新受邀人員狀態
   */
  updateStatus: adminProcedure.input(
    z11.object({
      id: z11.number(),
      status: z11.enum(["pending", "accepted", "rejected"])
    })
  ).mutation(async ({ input, ctx }) => {
    try {
      const invited = await getInvitedUserById(input.id);
      if (!invited) {
        throw new Error("\u53D7\u9080\u4EBA\u54E1\u4E0D\u5B58\u5728");
      }
      const updates = { status: input.status };
      if (input.status === "accepted") {
        updates.acceptedAt = /* @__PURE__ */ new Date();
      }
      await updateInvitedUser(input.id, updates);
      await logOperation({
        userId: ctx.user?.id || 0,
        action: "UPDATE",
        module: "invited_users",
        targetType: "email",
        description: `Updated invited user status: ${invited.email} -> ${input.status}`,
        details: { status: input.status }
      });
      if (invited) {
        syncToRemote("update", "invited_users", {
          ...invited,
          status: input.status
        }, "email", invited.email).catch(() => {
        });
      }
      return { success: true, message: "\u72C0\u614B\u66F4\u65B0\u6210\u529F" };
    } catch (error) {
      throw new Error(error.message || "\u66F4\u65B0\u72C0\u614B\u5931\u6557");
    }
  })
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    passwordAuth: passwordAuthRouter
  }),
  residents: residentsWithAuditRouter,
  repairRequests: repairRequestsWithAuditRouter,
  renovationApplications: renovationApplicationsRouter,
  resourceLibrary: resourceLibraryRouter,
  admin: adminRouter,
  passwordUsers: passwordUserManagementRouter,
  auditLog: auditLogRouter,
  accountManagement: accountManagementRouter,
  invitedUsers: invitedUsersRouter,
  regulationSettings: regulationSettingsRouter
});

// server/_core/context.ts
init_db();
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
    if (!user) {
      const authHeader = opts.req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const session = await sdk.verifySession(token);
        if (session) {
          const dbUser = await getUserById(session.userId);
          if (dbUser) {
            user = dbUser;
          }
        }
      }
    }
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import path2 from "path";
function serveStatic(app) {
  const isVercel2 = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isVercel2) {
    console.log("[Server] Skipping serveStatic in Vercel serverless environment");
    return;
  }
  let distPath;
  const localPath = path2.resolve(process.cwd(), "dist", "public");
  if (fs2.existsSync(localPath)) {
    distPath = localPath;
    console.log(`[Server] Using static files from: ${distPath}`);
  } else {
    console.warn(`[Server] Static files not found at: ${localPath}`);
    return;
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    const indexPath = path2.resolve(distPath, "index.html");
    if (fs2.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: "Not Found" });
    }
  });
}

// server/residents-export.ts
init_db();
import { Router } from "express";
var residentsExportRouter = Router();
residentsExportRouter.get("/export", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }
    const { residents: residentsTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { sql: sql2 } = await import("drizzle-orm");
    const rows = await db.select().from(residentsTable).orderBy(residentsTable.unitNumber);
    const headers = [
      "id",
      "unitNumber",
      "ownerName",
      "ownerPhone",
      "address",
      "coResident1Name",
      "coResident1Phone",
      "coResident2Name",
      "coResident2Phone",
      "coResident3Name",
      "coResident3Phone",
      "coResident4Name",
      "coResident4Phone",
      "carParkingNumber",
      "carPlateNumber",
      "motorcycleParkingNumber",
      "motorcyclePlateNumber",
      "bicycleParkingNumber",
      "squareMeters",
      "waterMeterNumber",
      "electricityMeterNumber",
      "moveInDate",
      "emergencyContactName",
      "emergencyContactPhone",
      "emergencyContactRelation",
      "emergencyContact2Name",
      "emergencyContact2Phone",
      "emergencyContact2Relation",
      "notes",
      "createdAt",
      "updatedAt"
    ];
    const csv = [
      headers.join("	"),
      // 使用 Tab 作為分隔符以支援中文
      ...rows.map(
        (row) => headers.map((header) => {
          const value = row[header];
          if (value === null || value === void 0) return "";
          if (value instanceof Date) {
            return value.toISOString().split("T")[0];
          }
          if (typeof value === "string") {
            return value.includes("	") || value.includes("\n") || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
          }
          return String(value);
        }).join("	")
      )
    ].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="residents_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv"`
    );
    res.setHeader("Content-Length", Buffer.byteLength(csv, "utf-8"));
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export residents data" });
  }
});

// server/upload-routes.ts
import { Router as Router2 } from "express";
import multer from "multer";

// server/storage.ts
init_env();
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/upload-routes.ts
var router2 = Router2();
var storage = multer.memoryStorage();
var upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("\u53EA\u652F\u63F4 PDF \u548C Word \u6A94\u6848"));
    }
  }
});
router2.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "\u6C92\u6709\u9078\u64C7\u6A94\u6848" });
    }
    let fileName = req.file.originalname;
    const fileBuffer = req.file.buffer;
    const contentType = req.file.mimetype;
    fileName = fileName.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, "_");
    if (!fileName) {
      fileName = `file_${Date.now()}`;
    }
    const { key, url } = await storagePut(
      `resource-library/${Date.now()}-${fileName}`,
      fileBuffer,
      contentType
    );
    res.json({
      success: true,
      url,
      key,
      size: req.file.size
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: error.message || "\u6A94\u6848\u4E0A\u50B3\u5931\u6557"
    });
  }
});
var upload_routes_default = router2;

// server/sync-routes.ts
import { Router as Router3 } from "express";
import { z as z12 } from "zod";
var syncTables = [
  "residents",
  "emergency_contacts",
  "repair_requests",
  "renovation_applications",
  "resource_folders",
  "resource_files",
  "invited_users",
  "parkings",
  "parking_plates"
];
var syncRequestSchema = z12.object({
  operation: z12.enum(["create", "update", "delete"]),
  table: z12.enum(syncTables),
  data: z12.record(z12.string(), z12.unknown()),
  keyField: z12.string().trim().min(1).max(64),
  keyValue: z12.unknown().refine(
    (value) => value !== void 0 && value !== null && value !== "",
    "keyValue is required"
  ),
  sourceSystem: z12.string().trim().min(1).max(64),
  timestamp: z12.string().refine(
    (value) => Number.isFinite(Date.parse(value)),
    "timestamp must be a valid ISO-compatible date"
  )
}).strict();
function createSyncRouter(options = {}) {
  const router3 = Router3();
  const apiKey = options.apiKey ?? SYNC_API_KEY;
  const localSystemId = options.localSystemId ?? LOCAL_SYSTEM_ID;
  const remoteSystemId = options.remoteSystemId ?? REMOTE_SYSTEM_ID;
  const handleRequest = options.handleRequest ?? handleSyncRequest;
  router3.post("/sync", async (req, res) => {
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
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
        });
      }
      const syncRequest = parsed.data;
      if (headerSource !== syncRequest.sourceSystem) {
        return res.status(400).json({ success: false, message: "Sync source header and body do not match" });
      }
      if (headerSource === localSystemId) {
        return res.json({ success: true, message: "Skipped - source is self", action: "skipped" });
      }
      if (headerSource !== remoteSystemId) {
        return res.status(403).json({ success: false, message: "Unexpected sync source" });
      }
      const result = await handleRequest(syncRequest);
      return res.status(result.success ? 200 : 422).json(result);
    } catch (error) {
      console.error("[SYNC] \u540C\u6B65\u7AEF\u9EDE\u932F\u8AA4:", error);
      return res.status(500).json({
        success: false,
        message: "Internal synchronization error"
      });
    }
  });
  return router3;
}
var sync_routes_default = createSyncRouter();

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
var demoUsersInitialized = false;
async function ensureDemoUsers() {
  if (demoUsersInitialized) return;
  demoUsersInitialized = true;
  try {
    await initializeDemoUsers();
    console.log("[Server] Demo users initialized (lazy)");
  } catch (error) {
    console.error("[Server] Failed to initialize demo users:", error);
  }
}
function createApp() {
  const app = express3();
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.use(async (_req, _res, next) => {
      if (!demoUsersInitialized) {
        await ensureDemoUsers();
      }
      next();
    });
  }
  app.use(express3.json({ limit: "50mb" }));
  app.use(express3.urlencoded({ limit: "50mb", extended: true }));
  app.use("/api/residents", residentsExportRouter);
  app.use("/api", upload_routes_default);
  app.use("/api", sync_routes_default);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  serveStatic(app);
  return app;
}
async function startServer() {
  try {
    await initializeDemoUsers();
    console.log("Demo users initialized successfully");
  } catch (error) {
    console.error("Failed to initialize demo users:", error);
  }
  const app = createApp();
  const server = createServer(app);
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`[Server] Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`[Server] Running on http://localhost:${port}/`);
  });
}
var isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
if (!isVercel) {
  initializeDemoUsers().catch((err) => {
    console.warn("[Server] Demo users init:", err.message);
  });
  startServer().catch((error) => {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  });
}
export {
  createApp
};
