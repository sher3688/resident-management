# 社區住戶管理系統 - 安裝指南

## 快速開始

### 1. 系統要求

- **Node.js**: v18 或更高版本
- **pnpm**: v8 或更高版本
- **MySQL/TiDB**: 5.7 或更高版本
- **Git**: 用於版本控制

### 2. 克隆或解壓項目

```bash
# 解壓壓縮檔
unzip community-management.zip
cd community-management
```

### 3. 安裝依賴

```bash
pnpm install
```

### 4. 配置環境變數

項目根目錄已包含 `DEPLOYMENT_GUIDE.md`，其中詳細說明了所有環境變數的配置。

**必需的環境變數：**

| 變數名 | 說明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | MySQL 連接字符串 | `mysql://user:pass@localhost:3306/db` |
| `JWT_SECRET` | JWT 簽名密鑰 | `your_random_key_min_32_chars` |
| `VITE_APP_ID` | OAuth 應用 ID | `your_app_id` |
| `OAUTH_SERVER_URL` | OAuth 服務器 URL | `https://api.manus.im` |

### 5. 設置數據庫

```bash
# 創建數據庫
mysql -u root -p -e "CREATE DATABASE community_management CHARACTER SET utf8mb4;"

# 運行遷移
pnpm drizzle-kit migrate
```

### 6. 啟動應用

```bash
# 開發模式（熱重載）
pnpm dev

# 訪問應用
# 前端: http://localhost:5173
# 後端: http://localhost:3000
```

## 項目結構

```
community-management/
├── client/              # React 前端
├── server/              # Express 後端
├── drizzle/             # 數據庫 schema
├── shared/              # 共享代碼
├── package.json         # 依賴配置
├── DEPLOYMENT_GUIDE.md  # 詳細部署指南
└── INSTALLATION.md      # 本文件
```

## 核心功能

✅ **住戶資料庫**
- 580 筆住戶信息
- 支持 CRUD 操作
- 搜尋和篩選功能
- 緊急聯絡人管理（無限數量）

✅ **報修統計表**
- 新增、編輯、刪除報修
- 進度追蹤
- 重複檢測

✅ **列印表單**
- PDF 預覽
- 批量下載

✅ **帳密登入系統**
- 帳號管理
- 權限控制
- 停用/啟用功能

✅ **操作日誌系統**
- 記錄所有操作
- 篩選和排序

✅ **其他功能**
- 資源庫（文件管理）
- 住戶規約頁面
- 裝修申請管理

## 默認帳號

系統初始化時會創建以下默認帳號：

| 帳號 | 密碼 | 角色 |
|------|------|------|
| admin | admin123 | 管理員 |
| user | user123 | 普通用戶 |

**重要**: 生產環境中請立即更改這些密碼！

## 常見命令

```bash
# 開發
pnpm dev              # 啟動開發服務器
pnpm dev:client       # 只啟動前端
pnpm dev:server       # 只啟動後端

# 構建
pnpm build            # 構建前端和後端
pnpm build:client     # 只構建前端
pnpm build:server     # 只構建後端

# 測試
pnpm test             # 運行所有測試
pnpm test:watch       # 監視模式

# 數據庫
pnpm drizzle-kit generate  # 生成遷移文件
pnpm drizzle-kit migrate   # 應用遷移

# 代碼質量
pnpm lint             # 檢查代碼
pnpm format           # 格式化代碼
```

## 生產部署

詳見 `DEPLOYMENT_GUIDE.md` 中的「生產部署」部分。

支持的部署方式：
- Docker 容器化
- PM2 進程管理
- Nginx 反向代理
- 雲平台（AWS、阿里雲等）

## 故障排除

### 數據庫連接失敗

```bash
# 檢查 MySQL 是否運行
mysql -u root -p -e "SELECT 1;"

# 驗證連接字符串
echo $DATABASE_URL
```

### 依賴安裝失敗

```bash
# 清除緩存
pnpm store prune

# 重新安裝
pnpm install --force
```

### 端口被占用

```bash
# 更改端口（編輯 vite.config.ts 和 server 配置）
# 或殺死占用端口的進程
lsof -i :3000
kill -9 <PID>
```

## 文檔

- **部署指南**: `DEPLOYMENT_GUIDE.md`
- **項目 README**: `README.md`
- **API 文檔**: 查看 `server/routers.ts` 中的 tRPC 路由定義

## 支持

如有問題，請：
1. 檢查 `DEPLOYMENT_GUIDE.md` 中的常見問題
2. 查看項目日誌
3. 聯繫開發團隊

---

**版本**: 1.0.0  
**最後更新**: 2026-07-10
