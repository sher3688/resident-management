import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
}

/**
 * 受保護的路由元件
 * 檢查使用者是否已登入，如果未登入則重導向到 /login
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { loading, user } = useAuth();

  useEffect(() => {
    if (loading) return;

    // 如果未登入，立即重導向到登入頁面
    if (!user) {
      window.location.href = "/login";
      return;
    }

    // TODO: 暫時移除帳密人員限制，允許 OAuth 使用者進入設定帳密帳號
    // if (user.loginMethod !== 'password') {
    //   window.location.href = "/login?error=password_required";
    //   return;
    // }

    // 如果指定了必要角色，檢查使用者是否有該角色
    if (requiredRole && user.role !== requiredRole) {
      window.location.href = "/";
      return;
    }
  }, [loading, user, requiredRole]);

  // 在載入中時顯示骨架屏
  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  // 如果未登入，不顯示任何內容（會立即重導向）
  if (!user) {
    return null;
  }

  // TODO: 暫時移除帳密人員限制
  // if (user.loginMethod !== 'password') {
  //   return null;
  // }

  // 如果指定了必要角色但使用者沒有該角色，不顯示內容
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
