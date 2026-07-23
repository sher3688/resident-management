export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  syncTargetUrl: process.env.SYNC_TARGET_URL ?? "",
  syncApiKey: process.env.SYNC_API_KEY ?? "",
  // Vercel 主系統預設為 resident-management；Manus Space 備援系統預設為 community-management。
  // 可透過 SYNC_SYSTEM_ID 覆寫，以支援未來遷移或測試環境。
  syncSystemId: process.env.SYNC_SYSTEM_ID ?? (process.env.VERCEL ? "resident-management" : "community-management"),
};
