import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getAllPasswordUsers,
  getPasswordUser,
  registerPasswordUser,
  updatePasswordUser,
} from "./password-auth";
import { logAuditEvent } from "./audit-log";

export const accountManagementRouter = router({
  // 獲取所有帳密使用者
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return getAllPasswordUsers();
  }),

  // 建立新帳號
  create: protectedProcedure
    .input(
      z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        name: z.string().min(1),
        role: z.enum(["admin", "user"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        const newUser = await registerPasswordUser(
          input.username,
          input.password,
          input.name,
          input.username + "@example.com",
          input.role
        );

        // 記錄操作日誌
        logAuditEvent({
          timestamp: new Date().toISOString(),
          userId: ctx.user.id,
          userName: ctx.user.name || "Unknown",
          action: "CREATE",
          entity: "user",
          entityId: newUser.id,
          changes: {
            username: { after: newUser.username },
            name: { after: newUser.name },
            role: { after: newUser.role },
          },
        });

        return newUser;
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "建立帳號失敗",
        });
      }
    }),

  // 更新帳號
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        role: z.enum(["admin", "user"]).optional(),
        password: z.string().min(6).optional().or(z.literal("")),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const user = await getPasswordUser(input.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const updates: Record<string, any> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.role !== undefined) updates.role = input.role;
      if (input.password !== undefined && input.password !== "") updates.password = input.password;
      if (input.isActive !== undefined) updates.isActive = input.isActive;

      const updated = await updatePasswordUser(input.id, updates);

      // 記錄操作日誌
      const changeLog: Record<string, { before?: any; after?: any }> = {};
      Object.entries(updates).forEach(([key, value]) => {
        changeLog[key] = { before: user[key as keyof typeof user], after: value };
      });
      logAuditEvent({
        timestamp: new Date().toISOString(),
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        action: "UPDATE",
        entity: "user",
        entityId: input.id,
        changes: changeLog,
      });

      return updated;
    }),

  // 停用帳號
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const user = await getPasswordUser(input.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const updated = await updatePasswordUser(input.id, { isActive: false });

      // 記錄操作日誌
      logAuditEvent({
        timestamp: new Date().toISOString(),
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        action: "UPDATE",
        entity: "user",
        entityId: input.id,
        changes: { isActive: { before: true, after: false } },
      });

      return updated;
    }),

  // 啟用帳號
  activate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const user = await getPasswordUser(input.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const updated = await updatePasswordUser(input.id, { isActive: true });

      // 記錄操作日誌
      logAuditEvent({
        timestamp: new Date().toISOString(),
        userId: ctx.user.id,
        userName: ctx.user.name || "Unknown",
        action: "UPDATE",
        entity: "user",
        entityId: input.id,
        changes: { isActive: { before: false, after: true } },
      });

      return updated;
    }),
});
