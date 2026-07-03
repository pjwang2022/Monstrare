# 專案啟動（Project Kickoff）

適用於全新專案，或既有專案要一次性建立完整的 Epic → User Story → Task 待辦清單時。目的是把「這個專案要做什麼」逐層拆解成看板上的任務卡；每一層都要停下來讓人工勾選確認，不能自己悶頭把三層全部生完才回報。

## 步驟

### 1. 專案規格釐清

在提出任何功能模組之前，先確認：

- 部署目標（例如：Vercel、自架 server、App Store、內部工具）。
- 技術棧（語言、框架、資料庫、認證方式）。
- 已知的硬性限制（預算、時程、既有系統整合）。

用最少的問題把這些問完；使用者已經講清楚的部分不要重問。

### 2. 提出功能模組（Epic）並讓使用者勾選

依照專案主題，主動發想一組合理的功能模組候選清單，不要空手叫使用者自己想。用多選問題（例如 AskUserQuestion）列出候選項目，讓使用者勾選要哪些、或補充遺漏的模組。

選定的每個 Epic，寫進 `tools/kanban/epics.json` 的 `epics[].name` / `definition`。

### 3. 針對每個 Epic 提出使用者需求（User Story）並讓使用者勾選

對每一個已選定的 Epic，主動發想這個模組底下合理的使用者需求候選清單，一樣用多選方式讓使用者勾選確認或增刪。

選定的每個 User Story，寫進對應 Epic 底下的 `stories[].name` / `definition`。

若某個 Epic 的範圍還不清楚，先用 `spec-interrogation` skill 產出這個 Epic 的 `ai/templates/feature-spec.md`；規格書裡的「User Stories」章節就對應這裡勾選出的清單。

### 4. 拆分任務（Task）並推上看板

對每個已選定的 User Story，用 `implementation-plan` skill 拆成任務卡，全端功能依該 skill 的「全端功能拆分規則」預設拆成前端／後端／前後端串接三張卡。

每張任務卡都要建立成 `tools/kanban/` 底下一張真實卡片（一卡一個 JSON 檔，`stage` 從 `backlog` 開始），並設定 `epic` / `userStory` 對應到上面選定的名稱，讓看板的「藍圖」分頁能正確歸類、算出完成度。

### 5. 逐一任務的實作迴圈

每次只處理一張已在看板上、狀態為 `ready` 的任務卡：

1. 若是前端任務、且對應畫面還不存在，先跑 `ui-mockup-gate`，做 2-3 個 mockup 讓使用者選一個，選完才進入下一步；既有功能的調整直接跳過這步。
2. 探索是否有現成套件或框架可以解決這個任務，避免自己重造輪子。若有 2-3 個合理選項，列出來問使用者要用哪個並給出自己的建議；只有一個明顯選擇時才不用問。
3. 開始實作。每個階段性成果都要讓系統維持「完整可用」的狀態，不能留下寫一半、會讓系統壞掉或啟動不了的半成品。
4. 自己檢查正確性：寫並跑過單元測試與整合測試，不是只憑肉眼看程式碼。
5. 確認沒問題後，把看板上這張卡的狀態往前推（`implementing` → `verify` → `done`），並視情況記錄驗證證據（對應 `test-verification` skill 與 `ai/templates/verification-report.md`）。

### 6. 資安紀律（每一張任務卡都要做，不是只有高風險才做）

實作當下就要套用 `ai/checklists/security-checklist.md`，包含但不限於：

- 不得以明文儲存密碼或密鑰。
- 檢查 OWASP Top 10 相關風險。
- 高風險項目（認證、金流、個資、基礎設施）仍需額外走 `ai/process/review-gates.md` 的 Security Gate。

## 輸出

- 已確認的技術棧與部署目標。
- `tools/kanban/epics.json` 內已選定的 Epic 與 User Story。
- `tools/kanban/cards/` 內對應的任務卡（含 `epic` / `userStory`）。
- 逐張任務卡的實作與驗證紀錄。
