import { mysqlTable, mysqlEnum, varchar, int, timestamp, text, json, date } from "drizzle-orm/mysql-core";

// ─── 住戶表 ────────────────────────────────────────────────────────────────
export const residents = mysqlTable("residents", {
  id: int("id").autoincrement().primaryKey(),

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

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Resident = typeof residents.$inferSelect;
export type InsertResident = typeof residents.$inferInsert;

// ─── 同住人表（規範化） ────────────────────────────────────────────────────
export const coResidents = mysqlTable("co_residents", {
  id: int("id").autoincrement().primaryKey(),
  residentId: int("residentId").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoResident = typeof coResidents.$inferSelect;
export type InsertCoResident = typeof coResidents.$inferInsert;

// ─── 車位表（規範化） ────────────────────────────────────────────────────
export const parkings = mysqlTable("parkings", {
  id: int("id").autoincrement().primaryKey(),
  residentId: int("residentId").notNull(),
  type: mysqlEnum("type", ["car", "motorcycle", "bicycle"]).notNull(),
  number: varchar("number", { length: 32 }).notNull(),
  plate: varchar("plate", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Parking = typeof parkings.$inferSelect;
export type InsertParking = typeof parkings.$inferInsert;

// ─── 停車位牌照表（一個停車位可以有多個牌照） ────────────────────────────────
export const parkingPlates = mysqlTable("parking_plates", {
  id: int("id").autoincrement().primaryKey(),
  parkingId: int("parkingId").notNull(),
  plate: varchar("plate", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParkingPlate = typeof parkingPlates.$inferSelect;
export type InsertParkingPlate = typeof parkingPlates.$inferInsert;

// ─── 緊急聯絡人表（規範化） ────────────────────────────────────────────────
export const emergencyContacts = mysqlTable("emergency_contacts", {
  id: int("id").autoincrement().primaryKey(),
  residentId: int("residentId").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  relationship: varchar("relationship", { length: 32 }),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = typeof emergencyContacts.$inferInsert;

// ─── 報修統計表 ────────────────────────────────────────────────────────────────
export const repairRequests = mysqlTable("repair_requests", {
  id: int("id").autoincrement().primaryKey(),
  repairDate: varchar("repairDate", { length: 32 }).notNull(),
  unitNumber: varchar("unitNumber", { length: 32 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "in_progress",
    "completed",
    "cancelled",
    "resident_self_repair",
  ]).default("pending"),
  notes: text("notes"),
  completionDate: varchar("completionDate", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RepairRequest = typeof repairRequests.$inferSelect;
export type InsertRepairRequest = typeof repairRequests.$inferInsert;

// ─── 操作日誌表 ────────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  entity: varchar("entity", { length: 50 }).notNull(),
  entityId: int("entityId"),
  changes: text("changes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── 帳密使用者表 ────────────────────────────────────────────────────────────────
export const passwordUsers = mysqlTable("password_users", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PasswordUser = typeof passwordUsers.$inferSelect;
export type InsertPasswordUser = typeof passwordUsers.$inferInsert;

// ─── 使用者表 ────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  loginMethod: mysqlEnum("loginMethod", ["email", "password"]).default("email"),
  role: mysqlEnum("role", ["admin", "user"]).default("user"),
  isActive: int("isactive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── 裝修申請表 ────────────────────────────────────────────────────────────────
export const renovationApplications = mysqlTable("renovation_applications", {
  id: int("id").autoincrement().primaryKey(),
  unitNumber: varchar("unitNumber", { length: 32 }).notNull(),
  applicationDate: varchar("applicationDate", { length: 32 }).notNull(),
  constructionStartDate: varchar("constructionStartDate", { length: 32 }),
  constructionEndDate: varchar("constructionEndDate", { length: 32 }),
  constructionContent: varchar("constructionContent", { length: 255 }).notNull(),
  consentLetterPasted: varchar("consentLetterPasted", { length: 32 }),
  applicantName: varchar("applicantName", { length: 64 }).notNull(),
  applicantPhone: varchar("applicantPhone", { length: 32 }).notNull(),
  registeredBy: varchar("registeredBy", { length: 64 }),
  status: mysqlEnum("status", ["pending", "approved", "completed", "rejected"]).default("pending"),
  decorationDeposit: varchar("decorationDeposit", { length: 32 }),
  decorationDepositStatus: mysqlEnum("decorationDepositStatus", ["notPaid", "paid", "refunded"]).default("notPaid"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RenovationApplication = typeof renovationApplications.$inferSelect;
export type InsertRenovationApplication = typeof renovationApplications.$inferInsert;

// 操作日誌表
export const operationLogs = mysqlTable("operation_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 64 }).notNull(), // e.g., "create_resident", "update_repair", "delete_application"
  module: varchar("module", { length: 64 }).notNull(), // e.g., "residents", "repairs", "renovations"
  targetId: int("targetId"), // ID of the affected record
  targetType: varchar("targetType", { length: 64 }), // Type of the affected record
  description: text("description"), // Human-readable description
  details: json("details"), // Additional details in JSON format
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"), // Browser/client info
  status: mysqlEnum("status", ["success", "failure"]).default("success"),
  errorMessage: text("errorMessage"), // Error message if status is failure
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OperationLog = typeof operationLogs.$inferSelect;
export type InsertOperationLog = typeof operationLogs.$inferInsert;

// 使用者登入時段表 - 追蹤用戶登入時間和設備
export const userSessions = mysqlTable("user_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  deviceName: varchar("deviceName", { length: 255 }), // Device identifier
  loginAt: timestamp("loginAt").defaultNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
  logoutAt: timestamp("logoutAt"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

// ─── 受邀人員表 ────────────────────────────────────────────────────────────────
export const invitedUsers = mysqlTable("invited_users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 64 }),
  role: varchar("role", { length: 32 }).default("user").notNull(), // admin or user
  status: varchar("status", { length: 32 }).default("pending").notNull(), // pending, accepted, rejected
  invitedBy: int("invitedBy"), // User ID who invited
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvitedUser = typeof invitedUsers.$inferSelect;
export type InsertInvitedUser = typeof invitedUsers.$inferInsert;

// 資源庫表
// 資源文件夾表
export const resourceFolders = mysqlTable("resource_folders", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResourceFolder = typeof resourceFolders.$inferSelect;
export type InsertResourceFolder = typeof resourceFolders.$inferInsert;

// 資源檔案表
export const resourceFiles = mysqlTable("resource_files", {
  id: int("id").autoincrement().primaryKey(),
  folderId: int("folderId").notNull().references(() => resourceFolders.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize"),
  fileType: varchar("fileType", { length: 32 }).default("pdf"),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResourceFile = typeof resourceFiles.$inferSelect;
export type InsertResourceFile = typeof resourceFiles.$inferInsert;

// 施工類型常數
export const CONSTRUCTION_TYPE_RENOVATION = '施工裝潢';
export const CONSTRUCTION_TYPES_REQUIRING_DEPOSIT = ['施工裝潢'];

// 裝保金狀態常數
export const DECORATION_DEPOSIT_STATUS = {
  NOT_PAID: 'notPaid',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;
