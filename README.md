# AI Coding Governance Kit

A cloneable workflow layer for AI coding agents.

This repository is designed to be copied into an existing software project so
Claude Code, Codex, and other agentic coding tools can follow the same product,
architecture, implementation, security, and verification process.

The goal is not to make agents more autonomous. The goal is to make agent work
smaller, better specified, easier to review, and easier to verify.

## What This Replaces

This kit combines patterns from:

- BMAD Method: role-based AI agile workflows.
- GitHub Spec Kit: spec-first development with clarify, plan, tasks, and implement phases.
- Kiro Specs: requirements, design, and task artifacts.
- Task Master: PRD-to-task decomposition and model routing.
- Serena: semantic project search and context retrieval.
- SuperClaude: slash-command style repeatable workflows.
- Archon: deterministic, gate-based workflow execution.
- Plandex: large-context planning, diff review, and controlled execution.
- CodeRabbit and Qodo: review-first quality gates.

It does not vendor those tools. It provides a consistent process layer that can
call or coexist with them.

## Core Idea

AI should not begin implementation from vague intent.

Every non-trivial change must move through these gates:

```text
Intake
-> Clarification
-> Product Spec
-> UI Mockup Gate, when UI is involved
-> Architecture Plan
-> AI-Ready Task Cards
-> Implementation
-> Verification Evidence
-> Review
-> Human Acceptance
```

## Repository Layout

```text
AGENTS.md                     # Codex entrypoint
CLAUDE.md                     # Claude Code entrypoint
.claude/skills/               # Claude Code skills
.claude/agents/               # Claude Code subagents
.codex/skills/                # Codex skills
.codex/config.toml            # Optional Codex local defaults
ai/process/                   # Shared workflow rules
ai/templates/                 # Specs, task cards, review reports
ai/context/                   # Project map and search guides
ai/checklists/                # Security and testing gates
ai/skills/                    # Canonical skill content shared by .claude/skills and .codex/skills
ai/examples/                  # Example task and feature artifacts
tools/kanban/                 # Local Kanban board implementing ai/process/kanban.md
```

## Quick Start

1. Copy this folder into the root of your project.
2. Copy `AGENTS.md` and `CLAUDE.md` to your project root, or keep them in this folder and import them from your existing agent files.
3. Ask your agent to run the project intake:

```text
Use the project-search skill to create ai/context/project-map.md and ai/context/code-search-guide.md.
Do not implement anything yet.
```

4. Start a feature through the spec gate:

```text
Use spec-interrogation for: <feature idea>.
Create a feature spec, screen specs if UI is involved, and AI-ready task cards.
Stop before implementation for human review.
```

## Install Into Another Project

From this repository:

```bash
scripts/install-into-project.sh /path/to/your/project
```

The installer skips existing `AGENTS.md` and `CLAUDE.md` files, then copies the
shared process files, templates, checklists, Claude skills/subagents, and Codex
skills into the target project.

Run the kit self-check from the repository root:

```bash
scripts/check-governance.sh
```

## AI Kanban

Use `ai/process/kanban.md` as the board policy. The board is not just for task
status; it tracks whether a task is ready for safe agent execution.

A working, zero-dependency implementation of this board is included at
`tools/kanban/` (`npm run kanban`). It is optional; the policy in
`ai/process/kanban.md` does not require this specific tool.

Recommended columns:

```text
Inbox
-> Needs Clarification
-> Needs Product Approval
-> Needs UI Mockup
-> Needs Architecture Plan
-> Needs Task Cards
-> AI Ready
-> Agent Working
-> Needs Verification
-> Needs Review
-> Human Acceptance
-> Done
```

## Principles

- Specifications are the source of truth.
- Human review happens before implementation, not only after code is written.
- Context is budgeted and justified.
- Agents may search, but they must report what they read and why.
- UI work requires mockup alternatives before implementation.
- High-risk work requires architecture, security, and test review.
- Completion means evidence, not assertion.

## Recommended Tool Pairings

- Use Serena MCP for semantic code search when available.
- Use Task Master when you want automated task expansion from a PRD.
- Use Spec Kit if you want a full spec-first command stack.
- Use CodeRabbit, Qodo, Codex Review, or Claude review agents as a final review layer.
- Use deterministic CI checks for lint, typecheck, tests, build, and security scanning.

## GitHub Workflow

This kit includes:

- `.github/ISSUE_TEMPLATE/ai_task.yml` for AI-ready task intake.
- `.github/pull_request_template.md` for verification and review evidence.

The intent is to make GitHub Issues and PRs carry the same governance language
as Claude Code, Codex, and local task cards.
