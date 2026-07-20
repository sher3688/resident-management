import { useEffect, useState } from "react";

export interface PasswordAuthUser {
  id: string;
  username: string;
  name: string;
  role: "admin" | "user";
}

export function usePasswordAuth() {
  const [user, setUser] = useState<PasswordAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 檢查 localStorage 中是否有帳密登入 token
    const token = localStorage.getItem("passwordAuthToken");
    const userStr = localStorage.getItem("passwordAuthUser");

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        // 無效的使用者資料，清除
        localStorage.removeItem("passwordAuthToken");
        localStorage.removeItem("passwordAuthUser");
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("passwordAuthToken");
    localStorage.removeItem("passwordAuthUser");
    setUser(null);
  };

  return { user, loading, logout };
}
