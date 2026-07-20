import { describe, it, expect, beforeAll } from "vitest";
import { initializeDemoUsers } from "./password-auth";

describe("Password User Management Routes", () => {
  beforeAll(async () => {
    await initializeDemoUsers();
  });

  it("應該能夠列出所有帳密使用者", async () => {
    const { getAllPasswordUsers } = await import("./password-auth");
    const users = getAllPasswordUsers();
    expect(users.length).toBeGreaterThanOrEqual(2); // 至少有 admin 和 user
  });

  it("應該能夠建立新的帳密使用者", async () => {
    const { registerPasswordUser, getAllPasswordUsers } = await import(
      "./password-auth"
    );

    const initialCount = getAllPasswordUsers().length;
    const newUser = await registerPasswordUser(
      "testadmin",
      "testpass123",
      "Test Admin",
      "admin"
    );

    expect(newUser.role).toBe("admin");
    expect(getAllPasswordUsers().length).toBe(initialCount + 1);
  });

  it("應該能夠更新帳密使用者的名稱和角色", async () => {
    const { registerPasswordUser, updatePasswordUser, getPasswordUser } =
      await import("./password-auth");

    const user = await registerPasswordUser(
      "updatetest",
      "pass123",
      "Original Name",
      "user"
    );

    const updated = await updatePasswordUser(user.id, {
      name: "Updated Name",
      role: "admin",
    });

    expect(updated?.name).toBe("Updated Name");
    expect(updated?.role).toBe("admin");

    const retrieved = getPasswordUser(user.id);
    expect(retrieved?.name).toBe("Updated Name");
  });

  it("應該能夠更新帳密使用者的密碼", async () => {
    const { registerPasswordUser, updatePasswordUser, authenticatePasswordUser } =
      await import("./password-auth");

    const user = await registerPasswordUser(
      "pwdtest",
      "oldpass123",
      "Password Test",
      "user"
    );

    // 用舊密碼登入應該成功
    let authenticated = await authenticatePasswordUser("pwdtest", "oldpass123");
    expect(authenticated).toBeDefined();

    // 更新密碼
    await updatePasswordUser(user.id, { password: "newpass123" });

    // 用舊密碼登入應該失敗
    authenticated = await authenticatePasswordUser("pwdtest", "oldpass123");
    expect(authenticated).toBeNull();

    // 用新密碼登入應該成功
    authenticated = await authenticatePasswordUser("pwdtest", "newpass123");
    expect(authenticated).toBeDefined();
  });

  it("應該能夠刪除帳密使用者", async () => {
    const { registerPasswordUser, deletePasswordUser, getPasswordUser } =
      await import("./password-auth");

    const user = await registerPasswordUser(
      "deletetest",
      "pass123",
      "Delete Test",
      "user"
    );

    expect(getPasswordUser(user.id)).toBeDefined();

    const deleted = deletePasswordUser(user.id);
    expect(deleted).toBe(true);

    expect(getPasswordUser(user.id)).toBeUndefined();
  });

  it("應該拒絕刪除不存在的使用者", async () => {
    const { deletePasswordUser } = await import("./password-auth");
    const deleted = deletePasswordUser("nonexistent_id");
    expect(deleted).toBe(false);
  });
});
