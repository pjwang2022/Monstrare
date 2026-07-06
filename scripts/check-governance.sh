#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "AGENTS.md"
  "CLAUDE.md"
  "ai/process/workflow.md"
  "ai/process/context-protocol.md"
  "ai/process/definition-of-ready.md"
  "ai/process/definition-of-done.md"
  "ai/process/review-gates.md"
  "ai/process/kanban.md"
  "ai/context/design-system.md"
  "ai/templates/feature-spec.md"
  "ai/templates/screen-spec.md"
  "ai/templates/task-card.md"
  "ai/templates/verification-report.md"
  "ai/checklists/security-checklist.md"
  "ai/checklists/testing-checklist.md"
  "ai/skills/project-kickoff.md"
  "ai/skills/project-search.md"
  "ai/skills/spec-interrogation.md"
  "ai/skills/ui-mockup-gate.md"
  "ai/skills/implementation-plan.md"
  "ai/skills/security-maintainability-review.md"
  "ai/skills/test-verification.md"
)

missing=0

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "missing: $file"
    missing=1
  fi
done

# ai/skills/ is the canonical content for every .claude/skills and .codex/skills
# thin stub. If a skill exists on one side but not the other (or not in the
# canonical source), a stub will point at a file that does not exist.
skill_names=()
for f in ai/skills/*.md; do
  skill_names+=("$(basename "${f%.md}")")
done

for name in "${skill_names[@]}"; do
  if [[ ! -f ".claude/skills/$name/SKILL.md" ]]; then
    echo "missing: .claude/skills/$name/SKILL.md (ai/skills/$name.md has no Claude Code stub)"
    missing=1
  fi
  if [[ ! -f ".codex/skills/$name/SKILL.md" ]]; then
    echo "missing: .codex/skills/$name/SKILL.md (ai/skills/$name.md has no Codex stub)"
    missing=1
  fi
done

for dir in .claude/skills/*/ .codex/skills/*/; do
  name="$(basename "$dir")"
  if [[ ! -f "ai/skills/$name.md" ]]; then
    echo "dangling stub: $dir points at ai/skills/$name.md, which does not exist"
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  echo "governance kit check failed"
  exit 1
fi

echo "governance kit check passed"

