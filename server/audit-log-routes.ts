import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { readAuditLogs } from "./audit-log";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

/**
 * 檢查使用者是否為管理員
 */
function requireAdmin(ctx: TrpcContext) {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "未登入",
    });
  }

  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "需要管理員權限",
    });
  }

  return ctx.user;
}

export const auditLogRouter = router({
  /**
   * 查詢操作日誌
   */
  list: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        userId: z.number().optional(),
        entity: z.enum(["resident", "repair_request", "user"]).optional(),
        action: z.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
        sortBy: z.enum(["timestamp", "userId", "action", "entity"]).default("timestamp"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
        limit: z.number().default(100),
      })
    )
    .query(({ ctx, input }) => {
      // 只有管理員才能查看操作日誌
      requireAdmin(ctx);

      let logs = readAuditLogs({
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        userId: input.userId,
        entity: input.entity,
        limit: input.limit * 2, // 先讀取更多紀錄以便排序
      });

      // 應用動作類型篩選
      if (input.action) {
        logs = logs.filter((log) => log.action === input.action);
      }

      // 排序
      logs.sort((a, b) => {
        let aVal: any = a[input.sortBy as keyof typeof a];
        let bVal: any = b[input.sortBy as keyof typeof b];

        if (input.sortBy === "timestamp") {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        if (aVal < bVal) return input.sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return input.sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      // 應用限制
      return logs.slice(0, input.limit);
    }),

  /**
   * 查詢特定使用者的操作日誌
   */
  byUser: protectedProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(50) }))
    .query(({ ctx, input }) => {
      // 只有管理員才能查看操作日誌
      requireAdmin(ctx);

      const logs = readAuditLogs({
        userId: input.userId,
        limit: input.limit,
      });

      return logs;
    }),

  /**
   * 查詢特定實體的操作日誌
   */
  byEntity: protectedProcedure
    .input(
      z.object({
        entity: z.enum(["resident", "repair_request", "user"]),
        limit: z.number().default(50),
      })
    )
    .query(({ ctx, input }) => {
      // 只有管理員才能查看操作日誌
      requireAdmin(ctx);

      const logs = readAuditLogs({
        entity: input.entity,
        limit: input.limit,
      });

      return logs;
    }),
});
