import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

/**
 * 檢查使用者是否為帳密登入
 * 只有帳密登入的使用者才能存取系統
 */
export function requirePasswordAuth(ctx: TrpcContext) {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "未登入",
    });
  }

  // 檢查使用者是否為帳密登入
  // 帳密登入的使用者 loginMethod 應為 "password"
  if (ctx.user.loginMethod !== "password") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "只有帳密人員可以存取此系統",
    });
  }

  return ctx.user;
}

/**
 * 檢查使用者是否為管理員且為帳密登入
 */
export function requirePasswordAuthAdmin(ctx: TrpcContext) {
  const user = requirePasswordAuth(ctx);

  if (user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "需要管理員權限",
    });
  }

  return user;
}
