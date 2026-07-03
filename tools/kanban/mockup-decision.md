# Mockup Decision

## Metadata

- Feature: 治理看板（Governance Kanban）
- Screen: 看板主畫面
- Decision owner: PJ
- Status: selected

## Variants

參見 `tools/kanban/mockups/index.html`（同一份資料，三種版面）。

| Variant | Description | Strengths | Risks |
|---|---|---|---|
| A — 控制塔 | 水平 12 條車道，逐一對應 `ai/process/kanban.md` 的每個欄位 | 階段顆粒度最完整，一眼看出瓶頸在哪一欄 | 欄位多，需要左右捲動；小螢幕更明顯 |
| B — 階段分組 | 把 12 欄收成 5 個階段群組（規劃／設計／執行／驗證審查／驗收），群組內用子群組堆疊 | 不需橫向捲動，資訊密度較低、掃視快 | 同一階段群組內的細部欄位需要再展開才看得出來 |
| C — 稽核清單 | 預設為可排序表格，右上角可切換看板檢視 | 適合審查密集情境，能一次比較多張卡片的 Readiness／Gates 進度 | 不像看板一樣直覺呈現「拖曳搬移」的空間感 |

## Selected Variant

- Variant: A — 控制塔（12 欄水平車道）
- Why: 保留 `ai/process/kanban.md` 完整的 12 階段顆粒度，不做分組簡化。
- Changes requested before implementation: 無（待後續使用中發現再補）。

## Human Approval

- Approver: PJ
- Date: 2026-07-03
- Notes: 從 A / B / C 三個方向中選定 A，進入實作階段。
