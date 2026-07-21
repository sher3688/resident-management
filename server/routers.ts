import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  listResidents,
  getResidentById,
  createResident,
  updateResident,
  deleteResident,
  listRepairRequests,
  getRepairRequestById,
  createRepairRequest,
  updateRepairRequest,
  deleteRepairRequest,
  listAllUsers,
  updateUserRole,
  backupAllData,
  restoreResidents,
  restoreRepairRequests,
  addInvitedUser,
  getAllInvitedUsers,
  getInvitedUserById,
  updateInvitedUser,
  deleteInvitedUser,
  isEmailInvited,
  logOperation,
} from "./db";
import { getDb } from "./db";
import { adminProcedure } from "./_core/trpc";
import { residents } from "../drizzle/schema";
import { passwordAuthRouter } from "./auth-routes";
import { passwordUserManagementRouter } from "./password-user-routes";
import { auditLogRouter } from "./audit-log-routes";
import { repairRequestsWithAuditRouter } from "./repair-requests-routes";
import { residentsWithAuditRouter } from "./residents-routes";
import { accountManagementRouter } from "./account-management-routes";
import { renovationApplicationsRouter } from "./renovation-applications-routes";
import { resourceLibraryRouter } from "./resource-library-routes";
import { regulationSettingsRouter } from "./regulation-settings-routes";

// ─── Zod schemas ──────────────────────────────────────────────────────────────
const residentInput = z.object({
  unitNumber: z.string().min(1, "戶號為必填"),
  ownerName: z.string().min(1, "區權人姓名為必填"),
  ownerPhone: z.string().optional().nullable(),
  coResident1Name: z.string().optional().nullable(),
  coResident1Phone: z.string().optional().nullable(),
  coResident2Name: z.string().optional().nullable(),
  coResident2Phone: z.string().optional().nullable(),
  coResident3Name: z.string().optional().nullable(),
  coResident3Phone: z.string().optional().nullable(),
  coResident4Name: z.string().optional().nullable(),
  coResident4Phone: z.string().optional().nullable(),
  carParkingNumber: z.string().optional().nullable(),
  carPlateNumber: z.string().optional().nullable(),
  motorcycleParkingNumber: z.string().optional().nullable(),
  motorcyclePlateNumber: z.string().optional().nullable(),
  bicycleParkingNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
  emergencyContactAddress: z.string().optional().nullable(),
  emergencyContact2Name: z.string().optional().nullable(),
  emergencyContact2Phone: z.string().optional().nullable(),
  emergencyContact2Relation: z.string().optional().nullable(),
  emergencyContact2Address: z.string().optional().nullable(),
  squareMeters: z.string().optional().nullable(),
  waterMeterNumber: z.string().optional().nullable(),
  electricityMeterNumber: z.string().optional().nullable(),
  moveInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "入住日期格式應為 YYYY-MM-DD").optional().nullable(),
  notes: z.string().optional().nullable(),
});

const repairRequestInput = z.object({
  repairDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "報修日期格式應為 YYYY-MM-DD"),
  unitNumber: z.string().min(1, "戶號為必填"),
  reporterName: z.string().optional().nullable(),
  description: z.string().min(1, "狀況描述為必填"),
  location: z.string().optional().nullable(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
  handlerNotes: z.string().optional().nullable(),
  completedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "完成日期格式應為 YYYY-MM-DD").optional().nullable(),
});

// ─── Routers ──────────────────────────────────────────────────────────────────
const residentsRouter = router({
  list: publicProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return listResidents(input?.search);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getResidentById(input.id);
    }),

  create: publicProcedure
    .input(residentInput)
    .mutation(async ({ input }) => {
      // moveInDate 保持 YYYY-MM-DD 字串格式，不轉成 Date
      const data = {
        ...input,
        moveInDate: input.moveInDate || null,
      };
      await createResident(data as any);
      return { success: true };
    }),

  update: publicProcedure
    .input(z.object({ id: z.number(), data: residentInput.partial() }))
    .mutation(async ({ input }) => {
      // moveInDate 保持 YYYY-MM-DD 字串格式，不轉成 Date
      const data = {
        ...input.data,
        moveInDate: input.data.moveInDate !== undefined ? (input.data.moveInDate || null) : undefined,
      };
      await updateResident(input.id, data as any);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteResident(input.id);
      return { success: true };
    }),

  clearAll: publicProcedure
    .mutation(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(residents);
      return { success: true };
    }),

  validateUnitNumber: publicProcedure
    .input(z.object({ unitNumber: z.string(), excludeId: z.number().optional() }))
    .query(async ({ input }) => {
      // 驗證戶號格式（允許數字、字母、中文、連字號）
      const formatRegex = /^[\u4e00-\u9fa5a-zA-Z0-9\-]+$/;
      if (!formatRegex.test(input.unitNumber)) {
        return { valid: false, error: "戶號格式不符（只允許中文、英文、數字、連字號）" };
      }

      // 檢查戶號是否重複
      const residents = await listResidents();
      const isDuplicate = residents.some(
        (r) => r.unitNumber === input.unitNumber && r.id !== input.excludeId
      );

      if (isDuplicate) {
        return { valid: false, error: "此戶號已存在，請使用不同的戶號" };
      }

      return { valid: true };
    }),

  importBatch: publicProcedure
    .input(z.object({ residents: z.array(residentInput) }))
    .mutation(async ({ input }) => {
      const batchInput = input.residents;
      let successCount = 0;
      let errorCount = 0;
      const errors: { index: number; unitNumber: string; error: string }[] = [];

      for (let i = 0; i < batchInput.length; i++) {
        try {
          await createResident(batchInput[i] as any);
          successCount++;
        } catch (err) {
          errorCount++;
          errors.push({
            index: i,
            unitNumber: batchInput[i].unitNumber,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      return {
        success: errorCount === 0,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    }),

  exportExcel: publicProcedure
    .query(async () => {
      const allResidents = await listResidents();
      return allResidents;
    }),
});

const repairRequestsRouter = router({
  list: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      unitNumber: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      return listRepairRequests(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getRepairRequestById(input.id);
    }),

  create: publicProcedure
    .input(repairRequestInput)
    .mutation(async ({ input }) => {
      await createRepairRequest(input as any);
      return { success: true };
    }),

  update: publicProcedure
    .input(z.object({ id: z.number(), data: repairRequestInput.partial() }))
    .mutation(async ({ input }) => {
      await updateRepairRequest(input.id, input.data as any);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteRepairRequest(input.id);
      return { success: true };
    }),
});

const adminRouter = router({
  listUsers: adminProcedure.query(async () => {
    return listAllUsers();
  }),

  updateUserRole: adminProcedure
    .input(z.object({ openId: z.string(), role: z.enum(['admin', 'user']) }))
    .mutation(async ({ input }) => {
      await updateUserRole(input.openId, input.role);
      return { success: true };
    }),

  backup: adminProcedure.query(async () => {
    const data = await backupAllData();
    return data;
  }),

  restoreResidents: adminProcedure
    .input(z.object({ data: z.array(z.any()) }))
    .mutation(async ({ input }) => {
      const result = await restoreResidents(input.data);
      return result;
    }),

  restoreRepairRequests: adminProcedure
    .input(z.object({ data: z.array(z.any()) }))
    .mutation(async ({ input }) => {
      const result = await restoreRepairRequests(input.data);
      return result;
    }),

  // 新增操作日誌和會話管理程序
  getUsers: adminProcedure.query(async () => {
    return listAllUsers();
  }),

  getOperationLogs: adminProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const { operationLogs } = await import('../drizzle/schema');
      const { desc } = await import('drizzle-orm');
      const logs = await db.select()
        .from(operationLogs)
        .orderBy((t) => desc(t.createdAt))
        .limit(input.limit);
      return logs;
    }),

  getUserSessions: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const { userSessions } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    const sessions = await db.select()
      .from(userSessions)
      .where(eq(userSessions.isActive, 1));
    return sessions;
  }),

  forceLogoutUser: adminProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const { logoutUserSession } = await import('./db');
      await logoutUserSession(input.sessionId);
      return { success: true };
    }),
});

// ─── 受邀人員管理路由 ────────────────────────────────────────────────────────────────
const invitedUsersRouter = router({
  /**
   * 列出所有受邀人員
   */
  list: adminProcedure.query(async () => {
    const invited = await getAllInvitedUsers();
    return invited.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      invitedAt: u.invitedAt,
      acceptedAt: u.acceptedAt,
    }));
  }),

  /**
   * 添加受邀人員
   */
  add: adminProcedure
    .input(
      z.object({
        email: z.string().email("郵箱格式不正確"),
        name: z.string().optional(),
        role: z.enum(["admin", "user"]).default("user"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await addInvitedUser(
          input.email,
          input.name || input.email,
          input.role,
          ctx.user?.id,
          input.notes
        );

        // 記錄操作日誌
        await logOperation({
          userId: ctx.user?.id || 0,
          action: "CREATE",
          module: "invited_users",
          targetType: "email",
          description: `Added invited user: ${input.email}`,
          details: { email: input.email, role: input.role },
        });

        return { success: true, message: "受邀人員添加成功" };
      } catch (error: any) {
        throw new Error(error.message || "添加受邀人員失敗");
      }
    }),

  /**
   * 刪除受邀人員
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const invited = await getInvitedUserById(input.id);
        if (!invited) {
          throw new Error("受邀人員不存在");
        }

        await deleteInvitedUser(input.id);

        // 記錄操作日誌
        await logOperation({
          userId: ctx.user?.id || 0,
          action: "DELETE",
          module: "invited_users",
          targetType: "email",
          description: `Deleted invited user: ${invited.email}`,
          details: { id: input.id },
        });

        return { success: true, message: "受邀人員刪除成功" };
      } catch (error: any) {
        throw new Error(error.message || "刪除受邀人員失敗");
      }
    }),

  /**
   * 検查郵箱是否被邀請
   */
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const isInvited = await isEmailInvited(input.email);
      return { isInvited };
    }),

  /**
   * 更新受邀人員狀態
   */
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "accepted", "rejected"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const invited = await getInvitedUserById(input.id);
        if (!invited) {
          throw new Error("受邀人員不存在");
        }

        const updates: any = { status: input.status };
        if (input.status === "accepted") {
          updates.acceptedAt = new Date();
        }

        await updateInvitedUser(input.id, updates);

        // 記錄操作日誌
        await logOperation({
          userId: ctx.user?.id || 0,
          action: "UPDATE",
          module: "invited_users",
          targetType: "email",
          description: `Updated invited user status: ${invited.email} -> ${input.status}`,
          details: { status: input.status },
        });

        return { success: true, message: "狀態更新成功" };
      } catch (error: any) {
        throw new Error(error.message || "更新狀態失敗");
      }
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    passwordAuth: passwordAuthRouter,
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
  regulationSettings: regulationSettingsRouter,
});

export type AppRouter = typeof appRouter;


// ─── 受邀人員管理路由 ────────────────────────────────────────────────────────────────
