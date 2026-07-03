# 治理看板卡片詳情設計（2026-07-03）

## 背景

在「預約系統」專案的 project-kickoff 中，一次性把 7 個 Epic、25 個 User Story 拆成 64 張任務卡（`TASK-001`〜`TASK-064`）後，回頭檢視看板上單張卡片的詳情畫面，發現目前的欄位設計在「卡片被拆得很細」的情境下有 5 個問題：

1. 「驗證證據」欄位固定顯示一塊可填指令／發現／殘留風險的空白框，跟 `test-verification` skill 的 `ai/templates/verification-report.md` 重複。
2. 「關聯文件」固定列 6 行輸入框，大部分空白，而且這些值本來就該由對應 skill／agent 產出文件時寫入，不是人工手填。
3. 「Review Gates」固定 6 個（產品／UI／架構／安全／測試／Code Review），但產品、UI、架構這 3 個關卡概念上是在 Epic／User Story 層級就決定完了，拆到很細的單張任務卡上再重核一次沒有意義。
4. 「Readiness」的 7 個 checkbox 跟卡片的「描述」欄位沒有結構化的對應關係，內容空泛時無從判斷打勾是否誠實。
5. 「描述」欄位本身只是自由文字，目前寫得非常簡短，撐不起 Readiness 的判斷依據。

這份設計的範圍是**治理看板工具本身**（`tools/kanban/`）與相關共用範本／流程文件，會套用到以後所有專案；不包含把「預約系統」現有 64 張卡重寫成新格式（見〈Rollout〉一節）。

## 核心決定：任務卡詳情改用獨立檔案（方案 B）

檢視 `ai/templates/kanban-card.md` 後確認：看板卡片本來就設計成「輕量卡片＋連結到獨立文件」模式——`featureSpec` / `screenSpec` / `mockupDecision` / `verificationReport` 都是獨立檔案，只在卡片上放連結；唯獨「任務卡本身的詳細內容」目前被塞進 JSON 卡的單一 `content` 欄位，跟其他 5 種文件的模式不一致。

修正為：**每張任務卡都在 `ai/tasks/<TASK-ID>.md` 產生一份完整檔案**，直接沿用 `ai/templates/task-card.md` 的章節結構（Metadata／目標／情境包／需求／驗收標準／實作備註／驗證契約／完成證據）。JSON 卡的 `content` 欄位降級為一兩句摘要，`links.taskCard` 指向這份檔案。

這解決問題 4、5：Readiness 的 7 項本來就是照 `task-card.md` 的章節在打勾（問題已釐清→目標、非目標已釐清→情境包/需求、驗收標準可測試→驗收標準、相關檔案已知→情境包、範圍已界定→情境包的允許/不得變更、驗證契約存在→驗證契約、人工核准已記錄→Metadata），現在真的有一份對得起的文件可以核對，而不是空泛的 checkbox。

## 資料模型變更

### `tools/kanban/server.mjs`

- `GATE_KEYS` 從 `['product','ui','architecture','security','test','code_review']` 縮減為 `['security','test','code_review']`（任務卡層級）。
- 新增 `EPICS_JSON` 的寫入端點 `PUT /api/epics`：body 為完整 `{ epics: [...] }`。驗證規則：`epics` 必須是陣列；每個 epic 需有非空字串 `name`／`definition`、`gates.product`（boolean）、`stories` 陣列；每個 story 需有非空字串 `name`／`definition`、`gates.ui` / `gates.architecture`（boolean）。驗證通過後整份覆寫寫回檔案（比照現有 `handlePutBulk` 的「驗證後整批寫入」風格）。
- 舊資料相容：既有卡片若還帶著舊版 6 key 的 `gates`（例如 stash 裡的 64 張卡），`validateCard` 只檢查新 3 個必要 key 存在，不會因為多出 `product`/`ui`/`architecture` 而拒絕；這些多餘 key 會被 `fillDefaults`／`writeCard` 原樣寫回，UI 端不渲染即可，之後在 Rollout 那輪清掉。
- `fillDefaults` 新增對 epics 資料的預設值補齊（epic 缺 `gates` 補 `{product:false}`，story 缺 `gates` 補 `{ui:false, architecture:false}`）。
- `evidence` 欄位（`{commands, findings, residual}`）保留在 schema／`validateCard`／`fillDefaults`，不刪，避免破壞既有資料相容性；只是不再有 UI 入口去讀寫它。

### `tools/kanban/epics.json`

新增 `gates` 欄位：

```json
{
  "epics": [
    {
      "name": "…",
      "definition": "…",
      "gates": { "product": false },
      "stories": [
        { "name": "…", "definition": "…", "gates": { "ui": false, "architecture": false } }
      ]
    }
  ]
}
```

### 任務卡 JSON（`tools/kanban/cards/*.json`）

- `content`：語意改為「一兩句摘要」，不再是完整說明。
- `gates`：只剩 `{ security, test, code_review }` 三個布林值。
- `links.taskCard`：慣例上應指向 `ai/tasks/<TASK-ID>.md`。
- 其餘欄位（`readiness`／`links` 其他 5 個 key／`refs`／`evidence`／`comments`）不變。

## Review Gates 分層模型

| 層級 | 關卡 | 對應時機 |
|---|---|---|
| Epic（`epics.json` epic 層） | 產品 | project-kickoff 選定這個 Epic 時 |
| User Story（`epics.json` story 層） | UI | `ui-mockup-gate` 選完 mockup 變體時（沒有畫面的 Story 可不勾，不強制） |
| User Story（`epics.json` story 層） | 架構 | `implementation-plan` 拆卡前的技術規劃時 |
| 任務卡（card JSON） | Code Review | 永遠顯示，每張卡都要 |
| 任務卡（card JSON） | 測試 | 永遠顯示，每張卡都要 |
| 任務卡（card JSON） | 安全性 | 只在 `risk === "high"` 或 `approvalRequired === true` 時顯示 |

這個分層跟 `ai/process/kanban.md` 描述的完整 12 階段流程（收件匣→…→待架構規劃→待任務卡→…）本來就是一致的，只是目前 6 欄簡化版工具把它們全部攤平成任務卡上的 6 個固定 checkbox，失去了「產品/UI/架構是一次性決定、不是逐卡重核」的語意。這次修正是讓簡化版工具的行為對齊回既有的政策文件，不是新政策。

## UI 變更（`tools/kanban/index.html`）

Modal（卡片詳情）：

- **移除**「驗證證據」整個區塊（`evidence-block` 的兩個 textarea + 殘留風險欄 + 「儲存驗證證據」按鈕，以及對應的 `save-evidence` click handler）。
- **關聯文件**改為唯讀清單：只列出 `tk.links` 中非空的項目（例如「任務卡：`ai/tasks/TASK-001.md`」），全部為空時顯示一行「尚無已產出的關聯文件」。移除現有 6 個固定 `<input type="text">`，以及對應的 `data-link` blur handler。
- 若 `tk.links.taskCard` 有值，額外在 modal 標題正下方（meta 區塊之前）顯眼顯示一行「任務卡詳情：`<taskCard 路徑>`」；若無值顯示淡化提示「尚未產出任務卡詳情文件」。
- 「描述」欄位標籤與 placeholder 調整為「摘要」／「一兩句話摘要，完整內容在任務卡連結」。
- 「Review Gates」改渲染 `GATE_ITEMS`（縮減後的 3 項），並依規則 `security` 只在 `tk.risk === "high" || tk.approvalRequired` 時加入渲染清單。
- 「Readiness」區塊 UI 結構不變（仍是 7 個 checkbox），不需要改動渲染邏輯。

Roadmap（藍圖分頁）：

- `epicCardHtml` / `storyBlockHtml` 新增 gate chip 渲染（複用既有 `.gate-chip` 樣式），epic 層一個「產品」chip，story 層「UI」「架構」兩個 chip。
- 新增點擊 handler：切換對應 `gates.*` 布林值後呼叫新的 `saveEpics()`（打 `PUT /api/epics`），成功後 `renderRoadmap()`。

## 需要同步更新的文件

- `tools/kanban/README.md`：Card JSON schema 表格（`gates` 說明改 3 項）、`/api/epics` 從唯讀改為「讀取＋覆寫」、新增 epics.json 的 `gates` 欄位說明。
- `ai/templates/kanban-card.md`：拿掉「證據」章節；Gates 縮成「安全性／測試／Code review」三項並註明「產品/UI/架構關卡記錄在 Epic／User Story 層級，不在單張任務卡上重複核可」；「關聯連結」章節加註「由對應 skill 自動填入，非人工手動維護」；「任務卡」連結加註「這是本卡的完整內容來源」。
- `ai/process/review-gates.md`：在「產品關卡」「UI Mockup 關卡」「架構關卡」三節各加一句，說明其核准記錄位置是 Epic／User Story（而非任務卡）；安全/驗證/合併關卡維持任務卡層級不變。
- `ai/skills/implementation-plan.md`：步驟 5 更新為「拆任務卡時，同時以 `ai/templates/task-card.md` 為底稿寫出 `ai/tasks/<TASK-ID>.md`，並把路徑填入卡片的 `links.taskCard`；卡片的 `content` 只寫一兩句摘要」。
- `ai/skills/project-kickoff.md`：步驟 4（拆分任務並推上看板）加一句，呼應 implementation-plan 步驟 5 的新慣例，並提醒 Epic／Story 勾選確認即視為完成對應的產品／UI／架構關卡，需回填 `epics.json` 的 `gates`。

## Rollout（不在本次實作範圍）

「預約系統」的 64 張任務卡目前 stash 在 `feature/online-booking-system` 分支。本次設計只改治理看板工具與範本／流程文件本身（在 `main` 上）。等這次實作完成、合併後，需要另外開一輪工作：

1. `git stash pop` 拿回 64 張卡與 `epics.json`。
2. 依新 schema：每張卡補一份 `ai/tasks/<TASK-ID>.md`，把現有 `content` 內容拆進去對應章節，`content` 瘦身成摘要，`links.taskCard` 填路徑。
3. `gates` 從舊的 6 項改成新的 3 項（任務卡層）＋在 `epics.json` 補上 7 個 Epic 的 `gates.product` 與 25 個 Story 的 `gates.ui` / `gates.architecture`。

這輪工作不在這份設計文件的實作計畫內，之後另外排。

## 驗證方式

- `node tools/kanban/server.mjs` 啟動後，用既有的 `curl /api/cards`、`curl /api/epics` 確認 schema 讀寫正常（沿用目前驗證方式：GET 能正確解析、POST/PUT 400 檢查）。
- 手動在瀏覽器開 `http://127.0.0.1:4420`：
  - 開一張任務卡，確認驗證證據區塊消失、關聯文件只顯示非空項目、Gates 只剩 3 項（低風險卡看不到「安全性」）。
  - 在藍圖分頁點 Epic／Story 的產品／UI／架構 gate chip，確認能切換並存回 `epics.json`。
- 沒有既有自動化測試涵蓋這個純前端＋零依賴 server 小工具，維持現況（手動驗證＋人工核准），不新增測試框架。
