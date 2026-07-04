# Monstrare

[English](README.md) | **繁體中文**

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

## 對每個 agent 設下的規則

出自 `AGENTS.md`，任何 agent 動手做事之前都要先讀：

- 不得根據模糊需求做非小型變更。
- 從情境探索開始，不能靠假設。
- 實作前要符合 `definition-of-ready.md`，宣告完成前要符合 `definition-of-done.md`。
- UI 變更需要 `screen-spec.md` + `mockup-decision.md`。
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
ai/context/                   # 專案地圖與搜尋指引
ai/checklists/                # 安全性與測試關卡檢查清單
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

**要加進既有的專案？** 跳到下面的[安裝到既有專案](#安裝到既有專案)。

不管走哪條路，檔案就定位後：

1. 執行專案情境搜尋：

   ```text
   使用 project-search skill 建立 ai/context/project-map.md 與 ai/context/code-search-guide.md。
   先不要實作任何東西。
   ```

2. 透過規格關卡開始一個新功能：

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

`ai/process/kanban.md` 是看板政策——追蹤的是任務是否已就緒、可以安全交給 agent 執行，而不只是狀態。上面的 `tools/kanban/` 實作是選用的，政策本身不要求一定要用這個工具。

建議欄位：

```text
Inbox（收件匣） -> Needs Clarification（待釐清） -> Needs Product Approval（待產品核准）
-> Needs UI Mockup（待 UI Mockup） -> Needs Architecture Plan（待架構規劃）
-> Needs Task Cards（待任務卡） -> AI Ready（AI 就緒） -> Agent Working（Agent 執行中）
-> Needs Verification（待驗證） -> Needs Review（待審查） -> Human Acceptance（待人工驗收） -> Done（完成）
```

## 建議搭配的工具

- 若可用，使用 Serena MCP 做語意化程式碼搜尋。
- 想從 PRD 自動展開任務時，使用 Task Master。
- 想要完整的規格優先指令堆疊時，使用 Spec Kit。
- 使用 CodeRabbit、Qodo、Codex Review 或 Claude 的審查子代理作為最後一層審查。
- 針對 lint、型別檢查、測試、build、安全性掃描，使用確定性的 CI 檢查。

## GitHub 工作流程

- `.github/ISSUE_TEMPLATE/ai_task.yml`：AI-ready 任務的建立表單。
- `.github/pull_request_template.md`：驗證與審查證據的 PR 範本。

讓 GitHub Issues 與 PR 使用跟 Claude Code、Codex 與本地任務卡一致的治理語言。
