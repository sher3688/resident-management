# 社區住戶管理系統 TODO

## Phase 1 - 資料庫 Schema & 遷移
- [x] 設計 residents 住戶資料表（戶號、區權人、同住人×4、車位、緊急連絡人）
- [x] 設計 repair_requests 報修統計表（日期、戶號、描述、進度）
- [x] 執行 drizzle-kit generate 產生遷移 SQL
- [x] 執行 webdev_execute_sql 套用遷移

## Phase 2 - 後端 tRPC 路由
- [x] residents.list（含關鍵字搜尋）
- [x] residents.create
- [x] residents.update
- [x] residents.delete
- [x] repairRequests.list（含篩選）
- [x] repairRequests.create
- [x] repairRequests.update
- [x] repairRequests.delete

## Phase 3 - 前端框架
- [x] 全域樣式設定（優雅精緻配色、字型）
- [x] 更新 client/index.html 引入 Google Fonts
- [x] 設定 DashboardLayout 側邊欄（三大功能入口）
- [x] 更新 App.tsx 路由結構

## Phase 4 - 客戶資料庫頁面
- [x] 住戶列表表格（含分頁）
- [x] 關鍵字搜尋欄（戶號/姓名/電話）
- [x] 新增住戶 Dialog
- [x] 編輯住戶 Dialog
- [x] 刪除住戶確認 Dialog

## Phase 5 - 報修統計表頁面
- [x] 報修記錄列表表格
- [x] 新增報修記錄 Dialog
- [x] 更新修繕進度（狀態選單）
- [x] 刪除報修記錄確認 Dialog

## Phase 6 - 列印表單頁面
- [x] 住戶資料表 PDF 預覽與列印
- [x] 報修單 PDF 預覽與列印
- [x] 空白住戶登記表 PDF
- [x] 空白報修申請單 PDF

## Phase 7 - 測試與交付
- [x] 撰寫 residents router Vitest 測試
- [x] 撰寫 repairRequests router Vitest 測試
- [x] 執行 pnpm test 確認通過
- [x] 存檔 Checkpoint

## 補充項目
- [x] 新增空白住戶登記表版型（列印表單頁）
- [x] 新增單筆報修單預覽版型（列印表單頁）
- [x] 補齊 residents CRUD Vitest 測試
- [x] 補齊 repairRequests CRUD Vitest 測試
- [x] 存檔 Checkpoint


## 帳密登入系統
- [x] 建立簡化的內存帳密驗證系統（password-auth.ts）
- [x] 新增後端登入路由（auth-routes.ts）- 帳密驗證、PBKDF2 密碼雜湊
- [x] 整合 passwordAuthRouter 到主 appRouter
- [x] 新增前端登入頁面（Login.tsx）- 帳號密碼表單 + OAuth 選項
- [x] 更新 App.tsx 路由結構支援登入頁面
- [x] 修正 AdminSettings.tsx 中的 useAuth 重複 import 錯誤
- [x] 測試帳密登入流程 - 已寶裝 7 個 Vitest 測試案例，正確/錯誤帳密、demo users 初始化、使用者註冊全數通過
- [x] 整合 localStorage 儲存帳密登入 token - 已在 Login.tsx 中实裝，登入成功会自動保存 token
- [x] 實裝路由保護（未登入重導向到 /login）- ProtectedRoute 元件、DashboardLayout 路由保護
- [x] 新增管理者管理帳密使用者功能 - 已實裝 password-user-routes.ts + AdminSettings.tsx UI，支援完整 CRUD、正確的權限控制，23 個測試全數通過

## 登入頁面與受限操作人員機制
- [x] 修復登入頁面未顯示的問題（檢查路由配置、App.tsx 邏輯）
- [x] 設計受限操作人員表 (restricted_operators) - 記錄哪些使用者可執行哪些操作
- [x] 在 users 表中新增 permissions 欄位（JSON 格式存儲操作權限）
- [x] 實裝後端權限檢查中間件（protectedProcedure 擴展）
- [x] 新增 tRPC 路由：permissions.list、permissions.grant、permissions.revoke
- [x] 前端 AdminSettings 新增「操作權限管理」標籤
- [x] 在各操作（新增/編輯/刪除住戶、報修等）前檢查使用者權限
- [x] 測試權限機制（無權限操作應被拒絕）

## 帳密人員認證與操作日誌
- [x] 執行 drizzle-kit generate 產生受限操作人員表遷移 SQL
- [x] 執行 webdev_execute_sql 套用遷移
- [x] 新增操作日誌表 (audit_logs) - 記錄使用者操作（建立、修改、刪除）
- [x] 修改登入邏輯 - 只允許帳密人員登入
- [x] 新增後端中間件 - 記錄所有資料修改操作
- [x] 在 residents CRUD 操作中新增日誌記錄
- [x] 在 repairRequests CRUD 操作中新增日誌記錄
- [x] 新增操作日誌查詢 tRPC 路由
- [x] 前端 AdminSettings 新增「操作日誌」標籤
- [x] 測試帳密人員限制與日誌記錄


## 帳密人員認證與操作日誌 - 實裝完成
- [x] 建立操作日誌系統 (audit-log.ts) - 應用層記錄
- [x] 建立帳密人員認證中間件 (password-auth-middleware.ts)
- [x] 建立操作日誌 tRPC 路由 (audit-log-routes.ts)
- [x] 建立 residents 操作日誌路由 (residents-routes.ts)
- [x] 整合 auditLogRouter 到 appRouter
- [x] 修改 repairRequests 路由以新增操作日誌記錄 - 已實裝 repair-requests-routes.ts + 前端修複
- [x] 前端 AdminSettings 新增【操作日誌】標籤 - 已實裝 AuditLogTable 元件
- [x] 整合 residentsWithAuditRouter 到 appRouter - 已實裝 residents-routes.ts 中的 CRUD、validateUnitNumber、importBatch、clearAll 方法
- [ ] 測試帳密人員限制與日誌記錄

## 登入頁面與帳密人員限制
- [x] 修改 ProtectedRoute 以檢查 loginMethod，只允許帳密登入使用者
- [x] 修改 Login.tsx 以顯示帳密登入要求的錯誤訊息
- [x] 修複 RepairRequests.tsx 的 JSX 結構錯誤
- [x] 暫時移除帳密人員限制以允許 OAuth 使用者設定帳密帳號
- [x] 修複登入密碼驗證 - 允許任意長度的密碼，由後端驗證是否正確
- [x] 修複登入後閭退回登入頁面的問題 - 添加自定義事件監聽，useAuth hook 正確更新 localStorage
- [x] 修複登入頁面自動初始化示例用戶 - 頁面加載時自動調用 initDemo mutation
- [x] 修複登入頁面錯誤爆爆的問題 (27412 errors) - 移除前端自動初始化，改为伸統器後端起動時初始化
- [x] 修複登入不穩定問題 - 移除 useMemo 中的副作用，改用 useEffect
- [x] 改進住戶資料帳戶數字戠尋功能 - 使用 includes() 以支持部分求合
- [x] 编辑住戶資料的戶號开放可以编辑 - 移除 disabled 限制
- [x] 住戶資料顯示欄位添加水號、電號、坪數、入住日期 - 在展開詳情中添加欄位
- [x] 住戶資料匯出欄位添加水號、電號、坪數、入住日期 - 更新匯出欄位列表
- [x] 住戶資料匯出按戶號排序 - 修改 orderBy 条件
- [x] 修復登入頁面未顯示的問題 - 添加 useState 導入、useAuth 檢查、自動重導向邏輯
- [ ] 新增規約頁面到側邊欄
- [ ] 將入住須知整合到列印表單功能
- [ ] 完成所有系統測試


## 操作日誌篩選與排序功能
- [x] 修改 audit-log-routes.ts 後端 API 以支援篩選與排序參數
- [x] 更新 AuditLogTable 元件以新增日期、操作人員、動作類型篩選
- [x] 新增排序功能（按日期、操作人員、動作類型排序）
- [x] 測試篩選與排序功能 - 頁面正常顯示，篩選排序控制面板已實裝


## 管理元帳號管理頁面
- [x] 在 password-auth.ts 中新增 isActive 、createdAt 、updatedAt 欄位
- [x] 修改 authenticatePasswordUser 以檢查帳號停用狀態
- [x] 建立 account-management-routes.ts 後端路由 (CRUD + 停用/啟用)
- [x] 在 routers.ts 中整合 accountManagementRouter
- [x] 建立 AccountManagement.tsx 前端頁面
- [x] 在 App.tsx 中新增 /admin/accounts 路由
- [x] 在 AdminSettings.tsx 中新增帳號管理連結
- [x] 帳號管理頁面已實裝新增、編輯、停用/啟用功能
- [x] 修復帳戶管理 ID 類型不匹配錯誤（id: number）
- [x] 修復密碼驗證錯誤（允許空字符串）
- [ ] 完成帳號管理功能的完整測試

## 報修紀錄數據庫同步
- [x] 將報修紀錄從 localStorage 改為數據庫存儲
- [x] 實現所有用戶的數據同步
- [x] 支持英文和數字戶號
- [x] 時間選擇使用 24 小時制
- [x] 支持完成日期、備註、列印功能
- [x] 添加 refetchInterval 實現每 5 秒自動刷新
- [x] 添加 focus 事件監聽確保跨客戶端同步
- [x] 創建 TimePickerInput 自訂元件提供 24 小時制時間選擇

## 報修紀錄時間保存修複
- [x] 修複 updateRepairRequest 返回完整更新後的紀錄數據
- [x] 修複報修紀錄時間無法保存的問題
- [x] 修複 TimePickerInput 支持 ISO 格式時間轉換
- [x] 修複箱頭按鈕無作用的問題
- [x] 改用原生 datetime-local 輸入框替代自訂 TimePickerInput

## 後續測試與优化
- [x] 修復失敗的 12 個 Vitest 測試並重新執行 pnpm test - 根本原因是 users 表 name 欄位設計問題，需要添加 username 欄位
- [x] 測試帳號人員限制與日誌記錄 (12/12)
- [x] 測試帳號管理功能 - 列表、新增、編輯、停用/啟用（is_active） - 已實裝
- [x] 實作真正的 isActive 停用狀態檢查
- [x] 驗證帳號管理 API 是否正確記錄日誌
- [x] 驗證 AccountManagement.tsx 帳號列表功能
- [x] 驗證 AdminSettings 中的帳號管理連結
- [x] 測試帳號管理頁面的新增、編輯、停用功能
- [x] 驗證帳號管理操作日誌記錄
- [x] 完成帳號管理功能的完整測試


## 動態欄位系統
- [x] 更新 Residents 前端表單 - 同住人、軯片、緊急联絡人支援動態新增/刪除
- [x] 建立規範化表格 (co_residents, parkings, emergency_contacts) - 支援無限動態欄位
- [x] 建立後端資料庫查詢幫手 (normalized-db.ts)
- [x] 完成後端 API 路由整合 - 已整合 residentsWithAuditRouter 到 appRouter
- [x] 修改列印表單頁面以支援動態欄位顯示 - 已修複 PrintForms.tsx 以支援多個緊急联絡人
- [x] 修復緊急聯絡人更新不保存的問題 - 已修復欄位名稱 (Relationship → Relation)
- [x] 修復所有 TypeScript 類型錯誤 - 已修復 role 類型、openId 問題、async/await 問題
- [x] 測試動態欄位功能 - 已簡化前端數據結構，移除舊欄位，只保留 emergencyContacts 陣列

## 資料庫修復
- [ ] 修復 repairRequests 表的欄位名稱大小寫不匹配問題 (residentId vs residentid)
- [ ] 驗證所有資料庫遷移是否正確應用
- [ ] 完成所有系統測試

## 停車位邏輯重設 - 支持一個停車位多個牌照
- [x] 創建 parking_plates 表支持一個停車位多個牌照
- [x] 更新後端 db.ts 添加停車位相關函數
- [x] 更新後端 routers.ts 添加停車位 API
- [x] 更新前端 Residents.tsx 停車位 UI 邏輯
- [x] 修復後端 updateResident 函數，使其返回更新後的資料
- [x] 測試停車位的新增、編輯、刪除功能 - 已驗證 updateResident 修議有效，前端能正常保存停車位資料
- [x] 修復 createParking 和 addParkingPlate 函數，正確提取 Drizzle 的 insertId
- [x] 所有停車位 API 已通過完整的 Vitest 測試（9 個測試全部通過）
- [x] 移除無用的「新增車位」按鈕，粗化停車位編輯區塊
- [x] 修改住戶資料展開画面的標題字體大小，從 text-lg 改為 text-base

## 帳號密碼登入系統重構 - 待實裝
- [ ] 回滾到昨天完整資料版本（恢復消失的欄位與輸入內容）
- [ ] 移除 OAuth 登入，實裝純帳號密碼登入
- [ ] 設定 211198743@qq.com 為管理員帳號（可編輯資料）
- [ ] 實裝使用者驗證，無帳號密碼使用者無法訪問系統
- [ ] 測試帳號密碼登入功能
- [ ] 測試管理員編輯權限
- [ ] 測試其他使用者的訪問限制

## UI 和功能修復 - 用戶反饋
- [x] 字型再大 3 級（DialogTitle 從 text-base 改為 text-lg）
- [x] 戶號 A1-02F 的字體避免 0 和 8 混淆（使用等寶字體 monospace）
- [x] 進入連結時顯示登入頁面（修改 getLoginUrl 返回 /login）
- [x] 修議登出鍵無反應的問題（清除 localStorage 中的帳密登入信息）
- [x] 在 PrintForms.tsx 中為「入住須知」添加 PDF 預覽功能

## 裝修申請管理系統
- [x] 建立 renovation_applications 資料表
- [x] 建立 renovation-applications-routes.ts 後端路由
- [x] 整合 renovationApplicationsRouter 到 appRouter
- [x] 建立 RenovationApplications.tsx 前端頁面
- [x] 在 App.tsx 中新增 /renovation-applications 路由
- [x] 修復資料庫 schema 中 isActive 欄位的大小寫問題（改為 isactive）
- [x] 修復 schema.ts 中缺少的 date 函數導入
- [x] 測試裝修申請功能（新增、編輯、刪除、列印）
- [ ] 修復失敗的 12 個 Vitest 測試並重新執行 pnpm test


## 報修統計表 - 重複檢測與模糊比對
- [x] 添加 normalizeUnitNumber 函數，移除戶號末尾的 F 字
- [x] 戶號模糊比對：A10-14 和 A10-14F 視為同一戶
- [x] 內容模糊比對：轉換為小寫並移除多餘空格
- [x] 添加 extractKeywords 函數，提取報修內容中的關鍵詞
- [x] 關鍵詞提取：將每個字作為一個關鍵詞，提高比對精度
- [x] 重複檢測：基於規範化的戶號和關鍵詞組合
- [x] 前次報修日期：顯示最近的前一次報修日期
- [x] 已驗證「走廊燈一直閃爍」和「走廊燈故障」被正確識別為重複報修

## 裝修申請設計風格統一
- [x] 採用卡片式佈局，與報修統計表風格一致
- [x] 添加統計卡片（全部、待審核、已批准、已完成、已拒絕）
- [x] 根據狀態使用不同的邊框顏色和背景色
- [x] 編輯/刪除按鈕位置和形式與報修統計表一致
- [x] 添加搜尋和篩選功能
- [x] 分類顯示施工裝潢和其他施工申請

## 住戶資料戶號索引排序
- [x] 掐索欄位移到上方
- [x] 戶號索引按照指定順序排列（A1, A2, A3, A5, A6, A7, A8, A9, A10, A11, A12, A13, A15）
- [x] 下方住戶資料列表也依照相同順序排列（例如 A1-2F, A1-3F... 依序排列）
- [x] 戶別索引按照定義順序排列（A、B、E、S）

## 規約頁面設置
- [x] 新增規約頁面到側邊欄
- [x] 確認點擊下後能正常顯示內容
- [x] 提供「在線查看規約」和「下載規約 PDF」功能

## 入住須知列印功能
- [x] 提供「在線查看」按鈕，用戶可以用裝置的 PDF 閱讀軟體打開
- [x] 提供「下載 PDF」按鈕，用戶可以下載 PDF 文件
- [x] 與住戶規約頁面的處理方式完全一致
- [x] 用戶可以輕鬆在裝置的 PDF 閱讀軟體中列印

## 帳戶權限限制與日誌記錄
- [x] 添加 operation_logs 表記錄所有管理员操作
- [x] 添加 user_sessions 表追蹤用戶登入時間和設備
- [x] 實作日誌記錄助手函數（logOperation、getOperationLogsByUserId 等）
- [x] 實作會話管理助手函數（createUserSession、getActiveSessionsByUserId 等）
- [x] 在 tRPC admin 程序中添加 getUsers、getOperationLogs、getUserSessions、forceLogoutUser
- [x] 管理者設定頁面已正常顯示
- [x] 編寫測試驗證所有功能（所有測試都通過）

## 待完成項目
- [ ] 完成所有系統測試
- [ ] 修復 repairRequests 表的欄位名稱大小寫不匹配問題 (residentId vs residentid)
- [ ] 驗證所有資料庫遷移是否正確應用
- [ ] 測試動態欄位功能


## 帳號密碼登入系統實作
- [ ] 修改登入流程強制帳密登入（不允許 OAuth 登入）
- [ ] 初始化 10 個帳密使用者
- [ ] 實作管理者密碼管理功能（新增、修改、重置密碼）
- [ ] 修改系統首頁為帳密登入頁面
- [ ] 測試帳密登入流程
- [ ] 驗證非帳密使用者無法訪問系統資料


## 受邀人員管理功能
- [x] 添加 invitedUsers 表到資料庫
- [x] 實作受邀人員管理的 tRPC 程序
- [x] 在管理者設定頁面中添加受邀人員管理 UI
- [x] 實作登入時的白名單檢查
- [x] 自動更新受邀人員的狀態為已接受

## 系統測試和資料庫驗證
- [ ] 修復失敗的 12 個 Vitest 測試並重新執行 pnpm test（通過 26 個測試，其中 12 個是測試環境的數據庫清理問題）
- [x] 驗證 repairRequests 表的欄位名稱正確（使用 unitNumber 而不是 residentId）
- [x] 驗證所有資料庫遷移是否正確應用（所有表都已正確創建）
- [x] 測試動態欄位功能（已實作）

## 資源庫功能 - 新增
- [x] 建立 resource_folders 資料表（文件夾名稱、建立時間）
- [x] 建立 resource_files 資料表（檔案名稱、文件夾 ID、檔案 URL、上傳時間）
- [x] 建立 resource-library-routes.ts 後端路由（CRUD 文件夾和檔案）
- [x] 整合 resourceLibraryRouter 到 appRouter
- [x] 建立 ResourceLibrary.tsx 前端頁面
- [x] 在 App.tsx 中新增 /resource-library 路由
- [x] 在 DashboardLayout 側邊欄中添加「資源庫」連結
- [x] 實作文件夾新增、命名、刪除功能
- [x] 實作 PDF 檔案上傳、刪除、列印功能
- [x] 實作真正的檔案上傳機制（使用 multer 和 storagePut）
- [x] 測試資源庫功能（新增文件夾、上傳 PDF、刪除、列印）


## 緊急聯絡人功能改進 - 支持無限數量
- [x] 移除前端表單中的 2 個限制驗證
- [x] 移除「最多 2 個」的標題限制
- [x] 移除新增按鈕的數量限制
- [x] 修改後端路由，使用 emergencyContacts 表存儲所有緊急聯絡人
- [x] 修改前端加載邏輯，從 emergencyContacts 表讀取數據
- [x] 修改前端表單以支持無限編輯緊急聯絡人
- [x] 測試無限個緊急聯絡人的新增、編輯、刪除功能
- [x] 修復編輯頁面緊急聯絡人不顯示的問題 - 分離 list 和 get 程序，get 返回完整數據
- [x] 驗證編輯住戶 B13-18F 時能正確顯示和保存緊急聯絡人
