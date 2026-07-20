/**
 * 初始化 10 個帳密使用者
 * 使用方式: node scripts/init-password-users.mjs
 */

import { registerPasswordUser } from "../server/password-auth.ts";

const defaultUsers = [
  { username: "admin", password: "admin123", name: "管理員", email: "admin@example.com", role: "admin" },
  { username: "user1", password: "user123", name: "使用者1", email: "user1@example.com", role: "user" },
  { username: "user2", password: "user123", name: "使用者2", email: "user2@example.com", role: "user" },
  { username: "user3", password: "user123", name: "使用者3", email: "user3@example.com", role: "user" },
  { username: "user4", password: "user123", name: "使用者4", email: "user4@example.com", role: "user" },
  { username: "user5", password: "user123", name: "使用者5", email: "user5@example.com", role: "user" },
  { username: "user6", password: "user123", name: "使用者6", email: "user6@example.com", role: "user" },
  { username: "user7", password: "user123", name: "使用者7", email: "user7@example.com", role: "user" },
  { username: "user8", password: "user123", name: "使用者8", email: "user8@example.com", role: "user" },
  { username: "user9", password: "user123", name: "使用者9", email: "user9@example.com", role: "user" },
];

async function initializeUsers() {
  console.log("開始初始化帳密使用者...");
  
  for (const user of defaultUsers) {
    try {
      const result = await registerPasswordUser(
        user.username,
        user.password,
        user.name,
        user.email,
        user.role
      );
      console.log(`✓ 成功建立使用者: ${user.username}`);
    } catch (error) {
      console.log(`✗ 使用者 ${user.username} 已存在或建立失敗`);
    }
  }
  
  console.log("初始化完成！");
}

initializeUsers().catch(console.error);
