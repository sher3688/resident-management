import { describe, it, expect, beforeAll, afterEach } from "vitest";
import {
  registerPasswordUser,
  authenticatePasswordUser,
  getPasswordUser,
  initializeDemoUsers,
  getAllPasswordUsers,
  deletePasswordUser,
} from "./password-auth";

describe("Password Authentication System", () => {
  // 清理測試數據
  const cleanupTestUsers = async () => {
    const allUsers = await getAllPasswordUsers();
    // 只刪除測試用戶，保留 admin 和 user
    for (const user of allUsers) {
      if (user.username === "testuser" || user.username === "testuser2") {
        await deletePasswordUser(user.id);
      }
    }
  };

  beforeAll(async () => {
    // 清理舊數據
    await cleanupTestUsers();
    // 初始化示例使用者
    await initializeDemoUsers();
  });

  afterEach(async () => {
    // 每個測試後清理測試數據
    await cleanupTestUsers();
  });

  it("應該成功初始化示例使用者", async () => {
    // 測試 admin 帳號
    const adminUser = await authenticatePasswordUser("admin", "admin123");
    expect(adminUser).toBeDefined();
    expect(adminUser?.username).toBe("admin");
    expect(adminUser?.role).toBe("admin");

    // 測試 user 帳號
    const normalUser = await authenticatePasswordUser("user", "user123");
    expect(normalUser).toBeDefined();
    expect(normalUser?.username).toBe("user");
    expect(normalUser?.role).toBe("user");
  });

  it("應該拒絕錯誤的密碼", async () => {
    const user = await authenticatePasswordUser("admin", "wrongpassword");
    expect(user).toBeNull();
  });

  it("應該拒絕不存在的使用者", async () => {
    const user = await authenticatePasswordUser("nonexistent", "password123");
    expect(user).toBeNull();
  });

  it("應該能夠註冊新使用者", async () => {
    const newUser = await registerPasswordUser(
      "testuser",
      "testpass123",
      "Test User",
      "testuser@example.com",
      "user"
    );

    expect(newUser).toBeDefined();
    expect(newUser.username).toBe("testuser");
    expect(newUser.name).toBe("Test User");
    expect(newUser.role).toBe("user");

    // 驗證新使用者可以登入
    const authenticated = await authenticatePasswordUser(
      "testuser",
      "testpass123"
    );
    expect(authenticated).toBeDefined();
    expect(authenticated?.username).toBe("testuser");
  });

  it("應該拒絕重複的使用者名稱", async () => {
    try {
      await registerPasswordUser("admin", "newpass123", "Another Admin", "admin@example.com", "admin");
      expect.fail("應該拋出錯誤");
    } catch (error: any) {
      expect(error.message).toContain("已被使用");
    }
  });

  it("應該能夠通過 ID 獲取使用者", async () => {
    const adminUser = await authenticatePasswordUser("admin", "admin123");
    expect(adminUser).toBeDefined();

    if (adminUser) {
      const retrieved = await getPasswordUser(adminUser.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.username).toBe("admin");
    }
  });

  it("應該返回 null 當查詢不存在的使用者 ID", async () => {
    const user = await getPasswordUser(999999);
    expect(user).toBeNull();
  });
});
