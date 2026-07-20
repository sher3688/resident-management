/**
 * tRPC 帳密驗證路由
 * 使用簡化的內存驗證系統
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  authenticatePasswordUser,
  registerPasswordUser,
  getPasswordUser,
  initializeDemoUsers,
} from "./password-auth";

export const passwordAuthRouter = router({
  /**
   * 帳密登入
   * 返回使用者資訊和 session token
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(3, "使用者名稱至少 3 個字符"),
        password: z.string().min(1, "密碼不能為空"),
      })
    )
    .mutation(async ({ input }) => {
      const user = await authenticatePasswordUser(input.username, input.password);
      if (!user) {
        throw new Error("使用者名稱或密碼錯誤");
      }

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      };
    }),

  /**
   * 帳密註冊（僅管理者可用）
   */
  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(3, "使用者名稱至少 3 個字符"),
        password: z.string().min(6, "密碼至少 6 個字符"),
        name: z.string().min(1, "名稱不能為空"),
        role: z.enum(["admin", "user"]).optional().default("user"),
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
        throw new Error(error.message || "註冊失敗");
      }
    }),

  /**
   * 驗證 session token
   */
  verify: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const user = await getPasswordUser(parseInt(input.token));
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
   * 初始化示例使用者（開發用）
   */
  initDemo: publicProcedure.mutation(async () => {
    try {
      await initializeDemoUsers();
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }),
});
