import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  listRepairRequests,
  getRepairRequestById,
  createRepairRequest as dbCreateRepairRequest,
  updateRepairRequest as dbUpdateRepairRequest,
  deleteRepairRequest as dbDeleteRepairRequest,
} from "./db";
import { logAuditEvent, calculateChanges } from "./audit-log";
import { requirePasswordAuth } from "./password-auth-middleware";
import { syncToRemote } from "./sync-handler";

const repairRequestInput = z.object({
  unitNumber: z.string().min(1, "戶號為必填"),
  description: z.string().min(1, "描述為必填"),
  status: z.enum(["pending", "in_progress", "completed", "cancelled", "resident_self_repair"]).default("pending"),
  repairDate: z.string().optional(),
  completionDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const repairRequestsWithAuditRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
      })
    )
    .query(({ ctx, input }) => {
      // TODO: 暫時移除帳密人員限制以允許 OAuth 使用者存取
      // requirePasswordAuth(ctx);
      return listRepairRequests({ status: input.status });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      // TODO: 暫時移除帳密人員限制以允許 OAuth 使用者存取
      // requirePasswordAuth(ctx);
      return getRepairRequestById(input.id);
    }),

  create: protectedProcedure
    .input(repairRequestInput)
    .mutation(async ({ ctx, input }) => {
      // TODO: 暫時移除帳密人員限制以允許 OAuth 使用者存取
      // const user = requirePasswordAuth(ctx);
      const user = ctx.user!;
      const result = await dbCreateRepairRequest({
        ...input,
        repairDate: input.repairDate || new Date().toISOString().slice(0, 16),
      });

      // 記錄操作日誌
      logAuditEvent({
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name || user.email || "Unknown",
        action: "CREATE",
        entity: "repair_request",
        entityId: (result as any).id,
        changes: calculateChanges(null, input as any),
      });

      // 同步到備援系統
      syncToRemote("create", "repair_requests", {
        ...input,
        id: (result as any).id,
      }, "id", (result as any).id).catch(() => {});

      return result;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), unitNumber: z.string().min(1), description: z.string().min(1), status: z.enum(["pending", "in_progress", "completed", "cancelled", "resident_self_repair"]).optional(), repairDate: z.string().optional(), completionDate: z.string().optional().nullable(), notes: z.string().optional().nullable() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: 暫時移除帳密人員限制以允許 OAuth 使用者存取
      // const user = requirePasswordAuth(ctx);
      const user = ctx.user!;
      const before = await getRepairRequestById(input.id);
      const { id, ...updateData } = input;
      const result = await dbUpdateRepairRequest(id, updateData);

      // 記錄操作日誌
      logAuditEvent({
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name || user.email || "Unknown",
        action: "UPDATE",
        entity: "repair_request",
        entityId: id,
        changes: calculateChanges(before || null, result as any),
      });

      // 同步到備援系統
      syncToRemote("update", "repair_requests", {
        ...input,
        id: id,
      }, "id", id).catch(() => {});

      return result;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: 暫時移除帳密人員限制以允許 OAuth 使用者存取
      // const user = requirePasswordAuth(ctx);
      const user = ctx.user!;
      const before = await getRepairRequestById(input.id);
      await dbDeleteRepairRequest(input.id);

      // 記錄操作日誌
      logAuditEvent({
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.name || user.email || "Unknown",
        action: "DELETE",
        entity: "repair_request",
        entityId: input.id,
        changes: calculateChanges(before || null, null),
      });

      // 同步到備援系統
      if (before) {
        syncToRemote("delete", "repair_requests", before, "id", input.id).catch(() => {});
      }

      return { success: true };
    }),
});
