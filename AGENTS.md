# Agent 指令

本專案使用 Monstrare。請遵循
`ai/process/workflow.md` 中的共用流程。

## 操作規則

- 不得根據模糊的需求實作非小型（non-trivial）變更。
- 從情境探索（context discovery）與任務專屬的情境包（context pack）開始。
- 實作前使用 `ai/process/definition-of-ready.md`。
- 宣告完成前使用 `ai/process/definition-of-done.md`。
- UI 變更需要 `ai/templates/screen-spec.md` 與 `ai/templates/mockup-decision.md`，並先對照 `ai/context/design-system.md`：重用既有 design token 與元件，缺的元件照既有風格補做並登記回元件庫 inventory。
- Epic 0 的 UI 設計系統須依五階段（框架 → 風格 → design token → 元件庫 → 版面）分關卡展開，不得一步到位直接畫版面（見 `ai/skills/project-kickoff.md` 步驟 2a）。
- 高風險變更需要架構、安全性與測試審查關卡（review gate）。
- 優先採用既有專案模式，而非新增抽象層。
- 將變更範圍限制在已核准的任務卡（task card）內。
- 不得在未告知的情況下變更不相關的檔案。
- 提供驗證證據：指令、輸出結果、UI 的螢幕截圖，以及已知的殘留風險。

## 必要流程

若是全新專案、還沒有 Epic/User Story 待辦清單，先執行 `project-kickoff` 流程，
把專案拆解成 Epic → User Story → Task 並建立看板卡片，再對每張任務卡套用下方流程。

1. 若 `ai/context/project-map.md` 存在，先閱讀它。
2. 若專案情境缺失或過時，執行 project-search 工作流程。
3. 對於新功能，建立或更新功能規格書。
4. 對於 UI 工作，產出多個 mockup 變體並等待人工選擇。
5. 產出 AI-ready 的任務卡。
6. 一次實作一張已核准的任務卡。
7. 執行驗證。
8. 執行審查關卡。
9. 彙整證據並在需要時請求人工驗收。

## 審查準則

審查程式碼時，優先關注：

- 功能性錯誤與回歸問題。
- 安全性與隱私風險。
- 身分驗證（auth）、權限、密鑰（secret）、檔案、網路與金流邊界。
- 資料驗證與錯誤處理。
- 可維護性、重複程式碼與架構偏移（architectural drift）。
- 缺失的測試或薄弱的驗證。

發現的問題應盡可能包含檔案與行號參照。
