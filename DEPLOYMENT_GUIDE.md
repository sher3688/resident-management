# 社區住戶管理系統 - 部署指南

## 📋 目錄

1. [系統要求](#系統要求)
2. [項目結構](#項目結構)
3. [安裝步驟](#安裝步驟)
4. [環境配置](#環境配置)
5. [數據庫設置](#數據庫設置)
6. [開發運行](#開發運行)
7. [生產部署](#生產部署)
8. [常見問題](#常見問題)

## 系統要求

### 開發環境
- **Node.js**: v18 或更高版本
- **pnpm**: v8 或更高版本（包管理器）
- **MySQL/TiDB**: 5.7 或更高版本（數據庫）
- **Git**: 用於版本控制

### 生產環境
- **Node.js**: v18 LTS 或更高版本
- **MySQL/TiDB**: 5.7 或更高版本
- **Docker**（可選）：用於容器化部署

## 項目結構

```
community-management/
├── client/                 # React 前端應用
│   ├── src/
│   │   ├── pages/         # 頁面組件
│   │   ├── components/    # 可復用組件
│   │   ├── lib/           # 工具函數
│   │   └── index.css      # 全局樣式
│   ├── index.html         # HTML 入口
│   └── vite.config.ts     # Vite 配置
├── server/                 # Express 後端應用
│   ├── routers.ts         # tRPC 路由定義
│   ├── residents-routes.ts # 住戶相關路由
│   ├── db.ts              # 數據庫查詢函數
│   ├── storage.ts         # 文件存儲配置
│   └── _core/             # 核心功能（OAuth、認證等）
├── drizzle/               # 數據庫 schema 和遷移
│   ├── schema.ts          # 表定義
│   └── migrations/        # 遷移文件
├── shared/                # 共享代碼
│   ├── types.ts           # 類型定義
│   └── const.ts           # 常量
├── package.json           # 項目依賴
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
├── vitest.config.ts       # 測試配置
└── README.md              # 項目說明

```

## 安裝步驟

### 1. 克隆或解壓項目

```bash
# 如果從 Git 克隆
git clone <repository-url>
cd community-management

# 或解壓壓縮檔
unzip community-management.zip
cd community-management
```

### 2. 安裝依賴

```bash
# 使用 pnpm 安裝依賴
pnpm install

# 或使用 npm
npm install
```

### 3. 配置環境變數

複製 `.env.example` 到 `.env.local`：

```bash
cp .env.example .env.local
```

編輯 `.env.local` 文件，填入以下必要變數：

```env
# 數據庫配置
DATABASE_URL=mysql://user:password@localhost:3306/community_management

# OAuth 配置（Manus OAuth）
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# JWT 密鑰
JWT_SECRET=your_random_secret_key_min_32_chars

# 文件存儲（S3）
AWS_S3_BUCKET=your_bucket_name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# 應用信息
VITE_APP_TITLE=社區住戶管理系統
VITE_APP_LOGO=https://example.com/logo.png

# 擁有者信息
OWNER_NAME=管理員名稱
OWNER_OPEN_ID=owner_id

# 內置 API
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=your_frontend_api_key
```

## 數據庫設置

### 1. 創建數據庫

```bash
# 使用 MySQL 命令行
mysql -u root -p

# 在 MySQL 中執行
CREATE DATABASE community_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 運行遷移

```bash
# 生成遷移文件
pnpm drizzle-kit generate

# 應用遷移到數據庫
pnpm drizzle-kit migrate
```

### 3. 驗證表結構

```bash
# 查看創建的表
mysql -u root -p community_management -e "SHOW TABLES;"
```

## 開發運行

### 啟動開發服務器

```bash
# 同時啟動前端和後端（熱重載）
pnpm dev

# 或分別啟動
pnpm dev:client  # 前端（Vite）
pnpm dev:server  # 後端（Express）
```

### 訪問應用

- **前端**: http://localhost:5173
- **後端 API**: http://localhost:3000/api/trpc

### 運行測試

```bash
# 運行所有測試
pnpm test

# 運行特定測試文件
pnpm test server/residents-routes.test.ts

# 監視模式
pnpm test --watch
```

### 構建應用

```bash
# 構建前端和後端
pnpm build

# 輸出文件
# - client/dist/  # 前端靜態文件
# - server/dist/  # 後端編譯文件
```

## 生產部署

### 使用 Docker 部署

#### 1. 創建 Dockerfile

項目已包含 `Dockerfile`，用於容器化部署。

#### 2. 構建 Docker 鏡像

```bash
docker build -t community-management:latest .
```

#### 3. 運行容器

```bash
docker run -d \
  --name community-management \
  -p 3000:3000 \
  -e DATABASE_URL=mysql://user:password@host:3306/db \
  -e JWT_SECRET=your_secret \
  -e VITE_APP_ID=your_app_id \
  community-management:latest
```

### 使用 PM2 部署

#### 1. 安裝 PM2

```bash
npm install -g pm2
```

#### 2. 創建 PM2 配置文件 (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'community-management',
      script: './dist/server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'mysql://user:password@localhost:3306/db',
        JWT_SECRET: 'your_secret',
        VITE_APP_ID: 'your_app_id'
      }
    }
  ]
};
```

#### 3. 啟動應用

```bash
# 構建應用
pnpm build

# 使用 PM2 啟動
pm2 start ecosystem.config.js

# 查看日誌
pm2 logs community-management

# 停止應用
pm2 stop community-management

# 重啟應用
pm2 restart community-management
```

### 使用 Nginx 反向代理

```nginx
upstream community_management {
  server localhost:3000;
}

server {
  listen 80;
  server_name example.com;

  # 重定向到 HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name example.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # 前端靜態文件
  location / {
    root /path/to/client/dist;
    try_files $uri $uri/ /index.html;
  }

  # API 代理
  location /api {
    proxy_pass http://community_management;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

## 常見問題

### Q1: 數據庫連接失敗

**解決方案**：
1. 檢查 `DATABASE_URL` 是否正確
2. 確認 MySQL 服務正在運行
3. 驗證用戶名和密碼
4. 檢查防火牆設置

### Q2: OAuth 認證失敗

**解決方案**：
1. 確認 `VITE_APP_ID` 正確
2. 檢查 `OAUTH_SERVER_URL` 是否可訪問
3. 驗證回調 URL 配置

### Q3: 文件上傳失敗

**解決方案**：
1. 檢查 S3 配置
2. 驗證 AWS 憑證
3. 確認 S3 桶存在且可訪問

### Q4: 性能問題

**解決方案**：
1. 使用 PM2 集群模式
2. 配置 Nginx 緩存
3. 優化數據庫查詢
4. 使用 CDN 分發靜態文件

## 備份和恢復

### 備份數據庫

```bash
mysqldump -u user -p community_management > backup.sql
```

### 恢復數據庫

```bash
mysql -u user -p community_management < backup.sql
```

## 監控和日誌

### 查看應用日誌

```bash
# PM2 日誌
pm2 logs community-management

# 系統日誌
tail -f /var/log/community-management.log
```

### 性能監控

```bash
# PM2 監控
pm2 monit

# 系統資源
top
free -h
df -h
```

## 支持和聯繫

如有問題或需要幫助，請聯繫開發團隊或查看項目文檔。

---

**最後更新**: 2026-07-10
**版本**: 1.0.0
