@AGENTS.md

# Claude Code 指令

本檔案為 Claude Code 專屬的路由層，補充上方 `AGENTS.md` 所定義的共用作業規則與流程（該檔案也供 Codex 等其他 AI 工具讀取，為單一事實來源）。詳細規則位於 `ai/process/`。

- 保持 `CLAUDE.md` 簡短。可重複使用的工作流程放在 `.claude/skills/`。

## Skill 路由

- 全新專案的 Epic/User Story/Task 拆解：`project-kickoff`
- 程式碼庫搜尋：`project-search`
- 需求釐清：`spec-interrogation`
- UI 替代方案與畫面狀態：`ui-mockup-gate`
- 技術規劃與任務卡：`implementation-plan`
- 安全性與可維護性審查：`security-maintainability-review`
- 測試與驗證證據：`test-verification`

## 子代理路由

- 產品面模糊性：`product-planner`
- UI 與互動品質：`ux-reviewer`
- 架構或跨切面變更：`architect`
- 安全性敏感變更：`security-reviewer`
- 測試策略與回歸風險：`test-engineer`

不得將代理（agent）輸出視為核准。人工核准仍是
`ai/process/review-gates.md` 中所定義各關卡（gate）的必要條件。
