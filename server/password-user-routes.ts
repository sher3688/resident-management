/**
 * 管理帳密使用者的 tRPC 路由
 * 僅管理者可以使用
 */

import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import {
  registerPasswordUser,
  getAllPasswordUsers,
  updatePasswordUser,
  deletePasswordUser,
  getPasswordUser,
} from "./password-auth";

export const passwordUserManagementRouter = router({
  /**
   * 列出所有帳密使用者
   */
  list: adminProcedure.query(async () => {
    const users = await getAllPasswordUsers();
    // 不返回密碼雜湊
    return users.map((user: any) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    }));
  }),

  /**
   * 建立新的帳密使用者
   */
  create: adminProcedure
    .input(
      z.object({
        username: z.string().min(3, "使用者名稱至少 3 個字符"),
        password: z.string().min(6, "密碼至少 6 個字符"),
        name: z.string().min(1, "名稱不能為空"),
        role: z.enum(["admin", "user"]).default("user"),
      })
    )
    .mutation(async ({ input }) => {
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
          role: user.role,
        };
      } catch (error: any) {
        throw new Error(error.message || "建立使用者失敗");
      }
    }),

  /**
   * 更新帳密使用者（名稱、角色、密碼）
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        role: z.enum(["admin", "user"]).optional(),
        password: z.string().min(6).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.role) updates.role = input.role;
      if (input.password) updates.password = input.password;

      const updated = await updatePasswordUser(parseInt(input.id), updates);
      if (!updated) {
        throw new Error("使用者不存在");
      }

      return {
        id: updated.id,
        username: updated.username,
        name: updated.name,
        role: updated.role,
      };
    }),

  /**
   * 刪除帳密使用者
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const deleted = await deletePasswordUser(parseInt(input.id));
      if (!deleted) {
        throw new Error("使用者不存在");
      }
      return { success: true };
    }),

  /**
   * 取得單個帳密使用者
   */
  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await getPasswordUser(parseInt(input.id));
      if (!user) {
        return null;
      }
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      };
    }),

  /**
   * 初始化 10 個預設帳密使用者
   */
  initializeDefaultUsers: adminProcedure.mutation(async () => {
    const defaultUsers = [
      { username: "admin", password: "admin123", name: "管理員", email: "admin@example.com", role: "admin" as const },
      { username: "user1", password: "user123", name: "使用者1", email: "user1@example.com", role: "user" as const },
      { username: "user2", password: "user123", name: "使用者2", email: "user2@example.com", role: "user" as const },
      { username: "user3", password: "user123", name: "使用者3", email: "user3@example.com", role: "user" as const },
      { username: "user4", password: "user123", name: "使用者4", email: "user4@example.com", role: "user" as const },
      { username: "user5", password: "user123", name: "使用者5", email: "user5@example.com", role: "user" as const },
      { username: "user6", password: "user123", name: "使用者6", email: "user6@example.com", role: "user" as const },
      { username: "user7", password: "user123", name: "使用者7", email: "user7@example.com", role: "user" as const },
      { username: "user8", password: "user123", name: "使用者8", email: "user8@example.com", role: "user" as const },
      { username: "user9", password: "user123", name: "使用者9", email: "user9@example.com", role: "user" as const },
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
      } catch (error: any) {
        results.push({ username: userData.username, status: "error", error: error.message });
      }
    }

    return {
      total: defaultUsers.length,
      results,
    };
  }),
});
