# Monstrare

[English](README.md) | **繁體中文**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**一個可直接複製使用的工作流程層，讓 AI coding agent 不會根據模糊需求就動手做出非小型變更。**

把這個資料夾複製進任何專案，Claude Code、Codex 等 agentic 工具就會遵循同一套關卡流程——規格、規劃、任務卡、實作、驗證、審查——才讓程式碼進到 production。

## Demo

套件內建一個零依賴的本地看板（`tools/kanban/`，`npm run kanban`），把每個任務走過下面各關卡的進度視覺化。

![看板畫面](tools/kanban/docs/board-screenshot.png)
![藍圖畫面](tools/kanban/docs/roadmap-screenshot.png)

## 解決什麼問題

- Agent 根據模糊的 prompt 就開始寫，產出又大又難審查的 diff。
- 「看起來是對的」就直接上線，沒有測試、截圖或任何證據。
- 架構與安全性審查發生在程式碼寫完之後，甚至根本沒發生。
- 每個專案都在自己土法煉鋼一套跟 agent 協作的流程。

## 架構：流程怎麼運作

每個非小型（non-trivial）變更都會依序走過以下階段，完整定義見 `ai/process/workflow.md`：

| 階段 | 輸出 | 關卡 |
| --- | --- | --- |
| 0. 收件（Intake） | 問題陳述、目標、限制、未知事項 | 需求模糊 → 進入釐清 |
| 1. 情境探索 | 任務專屬情境包：相關檔案、既有模式、風險、驗證指令 | — |
| 2. 釐清（Clarification） | `feature-spec.md`、非目標、驗收標準 | 人工核准 |
| 3. UI Mockup（涉及 UI 時） | 畫面／狀態地圖、2-3 個變體、取捨比較 | 人工選定變體 |
| 4. 架構規劃 | 變更檔案、資料／API 契約、回滾計畫 | 高風險 → architect + security + test 審查 |
| 5. 任務卡 | 符合 `definition-of-ready.md` 的 AI-ready 卡片 | — |
| 6. 實作 | 一次一張已核准的卡、diff 要小 | 範圍變動 → 停下來問 |
| 7. 驗證 | 測試、型別檢查、lint、build、安全性掃描、截圖 | — |
| 8. 審查 | 產品／UX／架構／安全性／測試／code review | `review-gates.md` |
| 9. 人工驗收 | 變更了什麼、證據、殘留風險、後續任務 | 沒證據 → 不算完成 |

全新專案、還沒有 Epic/User Story 待辦清單？先跑 `project-kickoff` skill——會把專案拆成 Epic → User Story → Task，並把資料建進 `tools/kanban/`。

## 設計品質：兩層防線

UI 工作由兩個互補的層次把關——只有流程會做出「合規但醜」的畫面，所以套件兩層都內建：

1. **設計系統（用什麼）**——Epic 0 以五個人工關卡階段建立設計系統（框架 → 風格方向 → design token → 元件庫 → 版面），持久化在 `ai/context/design-system.md`。之後所有 UI 任務都必須重用這些 token／元件；缺的元件照既有風格補做並登記回元件庫 inventory。
2. **設計工藝（怎麼做得好看）**——`ai/skills/design-craft.md` 承載視覺品質紀律（Refactoring UI 原則、type scale、4 的倍數間距、分階色彩系統、depth 規則、互動五態），並附一份高品質開源參考清單，設計前先比對、不憑記憶瞎猜。交付前逐項對照 `ai/checklists/design-review-checklist.md`。

兩層都住在 repo 裡，所以任何電腦、任何 agent（Claude Code、Codex⋯）clone 下來就拿到同一套設計水準——不依賴某台電腦 home 目錄裡裝的隱形 skill。

## 對每個 agent 設下的規則

出自 `AGENTS.md`，任何 agent 動手做事之前都要先讀：

- 不得根據模糊需求做非小型變更。
- 從情境探索開始，不能靠假設。
- 實作前要符合 `definition-of-ready.md`，宣告完成前要符合 `definition-of-done.md`。
- UI 變更需要 `screen-spec.md` + `mockup-decision.md`，重用 `ai/context/design-system.md` 的設計系統，並遵循 `design-craft` 的視覺紀律。
- 高風險變更需要架構 + 安全性 + 測試審查。
- 優先沿用既有模式，而非新增抽象層。
- 變更範圍限制在已核准任務卡內；動了不相關檔案要說清楚。
- 沒有證據不能宣稱完成：指令、輸出、截圖、殘留風險。

Agent 的輸出從來都不等於核准——每個關卡仍需人工簽核（見 `ai/process/review-gates.md`）。

## 這套件取代了什麼

| 參考來源 | 借用的概念 |
| --- | --- |
| BMAD Method | 角色制的 AI 敏捷工作流程 |
| GitHub Spec Kit | 規格優先：clarify → plan → tasks → implement |
| Kiro Specs | 需求、設計、任務產物 |
| Task Master | PRD 拆解為任務、模型路由 |
| Serena | 語意化專案搜尋與情境擷取 |
| SuperClaude | slash-command 風格的可重複工作流程 |
| Archon | 確定性、以關卡為基礎的流程執行 |
| Plandex | 大情境規劃、diff 審查、受控執行 |
| CodeRabbit / Qodo | 以審查為先的品質關卡 |

不內建（vendor）這些工具——本套件是一層可以呼叫或與它們共存的流程。

## 專案結構

```text
AGENTS.md                     # Codex 入口
CLAUDE.md                     # Claude Code 入口
.claude/skills/               # Claude Code skills
.claude/agents/               # Claude Code 子代理（subagents）
.codex/skills/                # Codex skills
.codex/config.toml            # Codex 本機預設設定（選用）
ai/process/                   # 共用的流程規則
ai/templates/                 # 規格書、任務卡、審查報告範本
ai/context/                   # 專案地圖、設計系統與搜尋指引
ai/checklists/                # 安全性、測試與設計審查檢查清單
ai/skills/                    # .claude/skills 與 .codex/skills 共用的 skill 內容來源
ai/examples/                  # 任務與功能產物範例
tools/kanban/                 # 實作 ai/process/kanban.md 的本地看板
```

## 快速開始

**要開新專案？** 直接把這個 repo clone 下來，在裡面直接開發——`AGENTS.md`、`CLAUDE.md` 與整套 `ai/` 工具已經在根目錄了。

```bash
git clone https://github.com/pjwang2022/Monstrare.git my-project
cd my-project
rm -rf .git && git init   # 建立你自己的 git 歷史
```

接著在這個資料夾裡開 Claude Code 或 Codex，直接講你想做什麼就好：

```text
我要做一個線上預約系統。
```

因為還沒有 Epic/User Story 待辦清單，這會觸發 `project-kickoff` skill：把構想拆解成 Epic → User Story → Task，並把資料建進 `tools/kanban/`。之後每張任務卡會各自走過 [治理流程怎麼運作](#架構流程怎麼運作) 裡的各個階段。

**要加進既有的專案？** 跳到下面的[安裝到既有專案](#安裝到既有專案)，然後從情境探索開始，而不是 `project-kickoff`：

```text
使用 project-search skill 建立 ai/context/project-map.md 與 ai/context/code-search-guide.md。
先不要實作任何東西。
```

```text
針對 <功能構想> 使用 spec-interrogation。
建立功能規格書，若涉及 UI 則一併建立 screen spec，並產出 AI-ready 任務卡。
實作前先停下來，等待人工審閱。
```

## 安裝到既有專案

```bash
scripts/install-into-project.sh /path/to/your/project
```

會跳過目標專案已存在的 `AGENTS.md`／`CLAUDE.md`，接著把流程檔案、範本、檢查清單、Claude/Codex skills 複製過去。

```bash
scripts/check-governance.sh   # 在本專案根目錄執行，做套件自我檢查
```

## AI 看板

`ai/process/kanban.md` 是看板政策——追蹤的是任務是否已就緒、可以安全交給 agent 執行，而不只是狀態。`tools/kanban/` 是這個政策的其中一種實作：零依賴的本地看板，把政策的 12 個階段簡化成 6 條車道（Backlog → Blocked → Ready → Implementing → Verify → Done）。這個工具是選用的，政策本身不要求一定要用它。

```bash
npm run kanban   # 開 http://127.0.0.1:4420
```

![看板畫面](tools/kanban/docs/board-screenshot.png)

- **新增卡片**——點任一車道底部的「+ 新增卡片」，id 由 server 自動配號。
- **移動卡片**——拖到別的車道就改變階段，同車道內拖曳可調整順序。
- **編輯詳情**——點卡片開啟詳情面板：owner、risk、agent、Readiness 勾選、Review Gates、留言。
- **依 Epic/User Story 看進度**——切到右上角「藍圖」分頁。

![藍圖畫面](tools/kanban/docs/roadmap-screenshot.png)

所有操作都即時寫回 `cards/*.json`——沒有儲存按鈕、沒有資料庫；`git commit`／`git push` 就是存檔與分享狀態的方式。完整的欄位規格與 API 說明：[`tools/kanban/README.md`](tools/kanban/README.md)。
