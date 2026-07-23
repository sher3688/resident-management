import { pgTable, pgEnum, varchar, integer, serial, timestamp, text, jsonb, date, index, uniqueIndex } from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const parkingTypeEnum = pgEnum("parking_type", ["car", "motorcycle", "bicycle"]);
export const repairStatusEnum = pgEnum("repair_status", ["pending", "in_progress", "completed", "cancelled", "resident_self_repair"]);
export const loginMethodEnum = pgEnum("login_method", ["email", "password"]);
export const roleEnum = pgEnum("role", ["admin", "user"]);
export const renovationStatusEnum = pgEnum("renovation_status", ["pending", "approved", "completed", "rejected"]);
export const decorationDepositStatusEnum = pgEnum("decoration_deposit_status", ["notPaid", "paid", "refunded"]);
export const operationLogStatusEnum = pgEnum("operation_log_status", ["success", "failure"]);
export const invitedStatusEnum = pgEnum("invited_status", ["pending", "accepted", "rejected"]);

// ─── 住戶表 ────────────────────────────────────────────────────────────────
export const residents = pgTable("residents", {
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
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Resident = typeof residents.$inferSelect;
export type InsertResident = typeof residents.$inferInsert;

// ─── 同住人表（規範化） ────────────────────────────────────────────────────
export const coResidents = pgTable("co_residents", {
  id: serial("id").primaryKey(),
  residentId: integer("residentId").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type CoResident = typeof coResidents.$inferSelect;
export type InsertCoResident = typeof coResidents.$inferInsert;

// ─── 車位表（規範化） ────────────────────────────────────────────────────
export const parkings = pgTable("parkings", {
  id: serial("id").primaryKey(),
  residentId: integer("residentId").notNull(),
  type: parkingTypeEnum("type").notNull(),
  number: varchar("number", { length: 32 }).notNull(),
  plate: varchar("plate", { length: 32 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Parking = typeof parkings.$inferSelect;
export type InsertParking = typeof parkings.$inferInsert;

// ─── 停車位牌照表（一個停車位可以有多個牌照） ────────────────────────────────
export const parkingPlates = pgTable("parking_plates", {
  id: serial("id").primaryKey(),
  parkingId: integer("parkingId").notNull(),
  plate: varchar("plate", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ParkingPlate = typeof parkingPlates.$inferSelect;
export type InsertParkingPlate = typeof parkingPlates.$inferInsert;

// ─── 緊急聯絡人表（規範化） ────────────────────────────────────────────────
export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  residentId: integer("residentId").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  relationship: varchar("relationship", { length: 32 }),
  address: text("address"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = typeof emergencyContacts.$inferInsert;

// ─── 報修統計表 ────────────────────────────────────────────────────────────────
export const repairRequests = pgTable("repair_requests", {
  id: serial("id").primaryKey(),
  repairDate: varchar("repairDate", { length: 32 }).notNull(),
  unitNumber: varchar("unitNumber", { length: 32 }).notNull(),
  description: text("description").notNull(),
  status: repairStatusEnum("status").default("pending"),
  notes: text("notes"),
  completionDate: varchar("completionDate", { length: 32 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type RepairRequest = typeof repairRequests.$inferSelect;
export type InsertRepairRequest = typeof repairRequests.$inferInsert;

// ─── 操作日誌表 ────────────────────────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  entity: varchar("entity", { length: 50 }).notNull(),
  entityId: integer("entityId"),
  changes: text("changes"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── 帳密使用者表 ────────────────────────────────────────────────────────────────
export const passwordUsers = pgTable("password_users", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type PasswordUser = typeof passwordUsers.$inferSelect;
export type InsertPasswordUser = typeof passwordUsers.$inferInsert;

// ─── 使用者表 ────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  loginMethod: loginMethodEnum("loginMethod").default("email"),
  role: roleEnum("role").default("user"),
  isActive: integer("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── 裝修申請表 ────────────────────────────────────────────────────────────────
export const renovationApplications = pgTable("renovation_applications", {
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
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type RenovationApplication = typeof renovationApplications.$inferSelect;
export type InsertRenovationApplication = typeof renovationApplications.$inferInsert;

// 操作日誌表
export const operationLogs = pgTable("operation_logs", {
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
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type OperationLog = typeof operationLogs.$inferSelect;
export type InsertOperationLog = typeof operationLogs.$inferInsert;

// 使用者登入時段表 - 追蹤用戶登入時間和設備
export const userSessions = pgTable("user_sessions", {
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
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

// ─── 受邀人員表 ────────────────────────────────────────────────────────────────
export const invitedUsers = pgTable("invited_users", {
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
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type InvitedUser = typeof invitedUsers.$inferSelect;
export type InsertInvitedUser = typeof invitedUsers.$inferInsert;

// 資源庫表
// 資源文件夾表
export const resourceFolders = pgTable("resource_folders", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ResourceFolder = typeof resourceFolders.$inferSelect;
export type InsertResourceFolder = typeof resourceFolders.$inferInsert;

// 資源檔案表
export const resourceFiles = pgTable("resource_files", {
  id: serial("id").primaryKey(),
  folderId: integer("folderId").notNull().references(() => resourceFolders.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: integer("fileSize"),
  fileType: varchar("fileType", { length: 32 }).default("pdf"),
  uploadedBy: integer("uploadedBy"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
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

// ─── 跨系統同步映射表 ────────────────────────────────────────────────────────────────
// 自增 ID 只在各自資料庫內有效；此表保存來源系統記錄與本機記錄的穩定對應。
export const syncRecordMappings = pgTable(
  "sync_record_mappings",
  {
    id: serial("id").primaryKey(),
    originSystem: varchar("originSystem", { length: 64 }).notNull(),
    entityType: varchar("entityType", { length: 64 }).notNull(),
    originRecordId: varchar("originRecordId", { length: 128 }).notNull(),
    localRecordId: varchar("localRecordId", { length: 128 }).notNull(),
    sourceUpdatedAt: text("sourceUpdatedAt"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("sync_record_mappings_origin_unique").on(
      table.originSystem,
      table.entityType,
      table.originRecordId,
    ),
    index("sync_record_mappings_local_lookup").on(
      table.entityType,
      table.localRecordId,
    ),
  ],
);

export type SyncRecordMapping = typeof syncRecordMappings.$inferSelect;
