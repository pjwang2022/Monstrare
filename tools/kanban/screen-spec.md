# Screen Spec

## Metadata

- Feature: 治理看板（Governance Kanban）
- Screen: 看板主畫面（含「藍圖」分頁）
- Status: implemented（Variant A 已實作於 `tools/kanban/`，欄位已從 12 階段精簡為 6 狀態）

## Purpose

視覺化任務從待辦到完成的流轉狀態，讓人可以一眼看出：哪些任務卡在哪個狀態、哪裡違反 WIP 上限、哪些卡片需要人工核准或審查關卡尚未通過。欄位不再逐字對應 `ai/process/kanban.md` 的 12 個治理階段，而是精簡為 6 個狀態（見下方 Layout）；`ai/process/kanban.md` 本身仍是完整的 12 階段政策，本工具是其中一種簡化實作。

## Layout

- 主要區域（看板分頁）：任務卡集合，依 6 個欄位分組呈現：Backlog 待辦 → Blocked → Ready 就緒 → Implementing 進行中 → Verify 驗證中 → Done 完成。
- 次要區域（藍圖分頁）：Epic → User Story → Task 階層檢視，含各層完成度。
- 卡片詳情 modal：內容對應 `ai/templates/kanban-card.md` 的欄位（Readiness 7 項、Review Gates 6 項、關聯文件 6 種、驗證證據、留言），另外加上 Epic / User Story 兩個下拉選單。
- 主要動作：點卡片開啟詳情、拖曳卡片變更狀態與排序、新增/刪除卡片、分頁切換（看板／藍圖）。

## States

| State | Required Behavior | Empty/Error Copy | Verification |
|---|---|---|---|
| Default | 依 6 欄顯示所有卡片，欄位標題含目前張數／WIP 上限 | — | Screenshot |
| Loading | 資料載入中,顯示骨架屏或簡單 loading 提示 | 「載入中…」 | Screenshot |
| Empty | 某欄位沒有卡片時顯示提示，不留空白區塊 | 「— 沒有卡片 —」 | Screenshot |
| Error | API 讀取失敗時顯示可重試的錯誤提示 | 「讀取失敗，請重新整理」 | Screenshot |
| Disabled | 唯讀模式（例如分享連結給協作者）下，拖曳與編輯功能停用 | — | Screenshot |
| Permission denied | 非本機（無寫入權限）存取時，仍可瀏覽但無法編輯 | 「唯讀檢視」 | Screenshot |
| Mobile | 多欄無法並排，改為單欄可切換或直向堆疊 | — | Screenshot |

## Interactions

| Action | Trigger | Result | Failure Case |
|---|---|---|---|
| 開啟卡片詳情 | 點擊卡片 | 開啟 modal，顯示 Readiness / Gates / 連結 / 證據 / 留言 | 找不到對應卡片資料時不開啟並提示 |
| 切換分頁 | 點頂部「看板 / 藍圖」 | 切換檢視方式，資料不變 | — |
| 拖曳卡片 | 拖曳卡片到其他欄位或欄內排序 | 更新卡片 `stage` / `order`，寫回 JSON 並 git tracked | 寫入失敗時 toast 提示、重新讀取資料還原畫面 |
| 重新分類 Epic / User Story | modal 內改選下拉選單 | 更新卡片 `epic` / `userStory`，藍圖分頁即時反映 | — |

## Visual Acceptance Criteria

- 6 個狀態名稱（Backlog 待辦 / Blocked / Ready 就緒 / Implementing 進行中 / Verify 驗證中 / Done 完成）在看板與卡片 modal 的階段選單中一致。
- WIP 超標的欄位（Implementing、Verify）有明顯視覺警示。
- 風險等級（低／中／高）與是否需人工核准，在卡面上一眼可辨識。
- 手機版不需橫向捲動就能瀏覽卡片標題與風險等級（尚待實作，見 README「已知限制」）。
- 沿用既有設計系統（若之後與其他工具共用視覺語言，需重新對齊）。
