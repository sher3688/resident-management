/**
 * 帳密驗證系統 - 使用資料庫存儲
 */

import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { users, passwordUsers as passwordUsersTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface PasswordUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: "admin" | "user";
  isActive: boolean;
  openId: string;
}

/**
 * 驗證使用者帳號密碼
 */
export async function authenticatePasswordUser(
  username: string,
  password: string
): Promise<PasswordUser | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // 從 users 表中查詢使用者
    const userResult = await db.select().from(users).where(eq(users.name, username)).limit(1);
    const user = userResult[0];

    if (!user) {
      return null;
    }

    // 從 password_users 表中查詢密碼記錄
    const passwordResult = await db.select().from(passwordUsersTable).where(eq(passwordUsersTable.userId, user.id)).limit(1);
    const passwordRecord = passwordResult[0];

    if (!passwordRecord) {
      return null;
    }

    // 驗證密碼
    const isValid = await bcrypt.compare(password, passwordRecord.passwordHash);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      username: user.name,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      openId: user.openId,
      isActive: true,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

/**
 * 註冊新使用者（管理員專用）
 */
export async function registerPasswordUser(
  username: string,
  password: string,
  name: string,
  email: string,
  role: "admin" | "user" = "user"
): Promise<PasswordUser> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 檢查使用者名稱是否已存在
    const existingResult = await db.select().from(users).where(eq(users.name, username)).limit(1);
    if (existingResult.length > 0) {
      throw new Error("使用者名稱已被使用");
    }

    // 建立新使用者
    const now = new Date();
    // 為帳密使用者生成唯一的 openId
    const openId = `password_${username}_${Date.now()}`;
    await db
      .insert(users)
      .values({
        openId: openId,
        name: username,
        email: email,
        role: role,
        loginMethod: "password",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      });

    // 獲取新使用者的 ID
    const newUserResult = await db.select().from(users).where(eq(users.name, username)).limit(1);
    const newUser = newUserResult[0];

    if (!newUser) {
      throw new Error("Failed to create user");
    }

    // 雜湊密碼
    const passwordHash = await bcrypt.hash(password, 10);

    // 建立密碼記錄
    await db.insert(passwordUsersTable).values({
      userId: newUser.id,
      passwordHash: passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: newUser.id,
      username: newUser.name,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || 'user',
      isActive: true,
    };
  } catch (error: any) {
    throw new Error(error.message || "註冊失敗");
  }
}

/**
 * 根據 ID 獲取使用者
 */
export async function getPasswordUser(userId: number): Promise<PasswordUser | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userResult[0];

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.name,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      openId: user.openId,
      isActive: true,
    };
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}

/**
 * 獲取所有密碼使用者
 */
export async function getAllPasswordUsers(): Promise<PasswordUser[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const userResults = await db.select().from(users);
    return userResults.map(user => ({
      id: user.id,
      username: user.name,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      openId: user.openId,
      isActive: true,
    }));
  } catch (error) {
    console.error("Get all users error:", error);
    return [];
  }
}

/**
 * 更新使用者
 */
export async function updatePasswordUser(
  userId: number,
  updates: Partial<Omit<PasswordUser, "id">> & { password?: string }
): Promise<PasswordUser | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const now = new Date();
    const updateData: any = { updatedAt: now };

    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.role) updateData.role = updates.role;

    // 更新 users 表
    await db.update(users).set(updateData).where(eq(users.id, userId));

    // 如果有密碼更新，更新 password_users 表
    if (updates.password) {
      const passwordHash = await bcrypt.hash(updates.password, 10);
      await db.update(passwordUsersTable)
        .set({ passwordHash, updatedAt: now })
        .where(eq(passwordUsersTable.userId, userId));
    }

    return getPasswordUser(userId);
  } catch (error) {
    console.error("Update user error:", error);
    return null;
  }
}

/**
 * 刪除使用者
 */
export async function deletePasswordUser(userId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // 刪除 password_users 記錄
    await db.delete(passwordUsersTable).where(eq(passwordUsersTable.userId, userId));

    // 刪除 users 記錄
    await db.delete(users).where(eq(users.id, userId));

    return true;
  } catch (error) {
    console.error("Delete user error:", error);
    return false;
  }
}

/**
 * 初始化示例使用者（開發用）
 */
export async function initializeDemoUsers() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Password Auth] Database not available, skipping demo user init");
      return { success: false };
    }

    // 檢查 admin 使用者是否已存在
    let adminResult;
    try {
      adminResult = await db.select().from(users).where(eq(users.name, "admin")).limit(1);
    } catch (e: any) {
      console.warn("[Password Auth] Cannot query users table yet (schema migration pending):", e.message);
      return { success: false };
    }
    if (adminResult.length === 0) {
      try {
        await registerPasswordUser(
          "admin",
          "admin123",
          "管理員",
          "admin@example.com",
          "admin"
        );
        console.log("[Password Auth] Admin user initialized");
      } catch (e: any) {
        console.warn("[Password Auth] Failed to create admin:", e.message);
      }
    }

    // 檢查 user 使用者是否已存在
    let userResult;
    try {
      userResult = await db.select().from(users).where(eq(users.name, "user")).limit(1);
    } catch (e: any) {
      console.warn("[Password Auth] Cannot query users table:", e.message);
      return { success: false };
    }
    if (userResult.length === 0) {
      try {
        await registerPasswordUser(
          "user",
          "user123",
          "一般使用者",
          "user@example.com",
          "user"
        );
        console.log("[Password Auth] User user initialized");
      } catch (e: any) {
        console.warn("[Password Auth] Failed to create user:", e.message);
      }
    }

    console.log("[Password Auth] Demo users initialized successfully");
    return { success: true };
  } catch (error: any) {
    // Non-fatal: log and continue
    console.error("[Password Auth] Initialize demo users error (non-fatal):", error);
    return { success: false };
  }
}
