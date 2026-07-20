import { describe, it, expect, beforeAll } from "vitest";
import { initializeDemoUsers } from "./password-auth";

describe("Password Auth Routes (tRPC)", () => {
  beforeAll(async () => {
    // 初始化示例使用者
    await initializeDemoUsers();
  });

  it("應該能夠通過 tRPC 登入 admin 帳號", async () => {
    // 這個測試驗證 tRPC 路由的邏輯
    // 實際的 tRPC 端點測試應該通過 HTTP 或 tRPC 客戶端進行
    // 這裡我們測試底層的驗證邏輯
    const { authenticatePasswordUser } = await import("./password-auth");
    const user = await authenticatePasswordUser("admin", "admin123");
    expect(user).toBeDefined();
    expect(user?.role).toBe("admin");
  });

  it("應該拒絕錯誤的帳密組合", async () => {
    const { authenticatePasswordUser } = await import("./password-auth");
    const user = await authenticatePasswordUser("admin", "wrongpass");
    expect(user).toBeNull();
  });

  it("應該能夠註冊新使用者並立即登入", async () => {
    const { registerPasswordUser, authenticatePasswordUser } = await import(
      "./password-auth"
    );

    // 註冊新使用者
    const newUser = await registerPasswordUser(
      "newadmin",
      "newpass123",
      "New Admin",
      "admin"
    );
    expect(newUser.role).toBe("admin");

    // 立即登入
    const authenticated = await authenticatePasswordUser(
      "newadmin",
      "newpass123"
    );
    expect(authenticated).toBeDefined();
    expect(authenticated?.role).toBe("admin");
  });

  it("應該返回完整的使用者資訊（不包含密碼雜湊）", async () => {
    const { authenticatePasswordUser } = await import("./password-auth");
    const user = await authenticatePasswordUser("admin", "admin123");

    expect(user).toBeDefined();
    if (user) {
      // 驗證返回的使用者物件包含必要的欄位
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("username");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("role");
      // 確保不會返回密碼雜湊
      expect(user).not.toHaveProperty("password");
    }
  });
});
