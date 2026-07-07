#!/usr/bin/env bash
set -euo pipefail

target="${1:-}"

if [[ -z "$target" ]]; then
  echo "usage: scripts/install-into-project.sh /path/to/project"
  exit 1
fi

if [[ ! -d "$target" ]]; then
  echo "target is not a directory: $target"
  exit 1
fi

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

copy_if_missing() {
  local source="$1"
  local dest="$2"

  if [[ -e "$dest" ]]; then
    echo "skip existing: $dest"
    return
  fi

  mkdir -p "$(dirname "$dest")"
  cp "$source" "$dest"
  echo "installed: $dest"
}

copy_if_missing "$root/AGENTS.md" "$target/AGENTS.md"
copy_if_missing "$root/CLAUDE.md" "$target/CLAUDE.md"

mkdir -p "$target/ai"
cp -R "$root/ai/process" "$target/ai/"
cp -R "$root/ai/templates" "$target/ai/"
cp -R "$root/ai/checklists" "$target/ai/"
cp -R "$root/ai/skills" "$target/ai/"
cp -R "$root/ai/examples" "$target/ai/"

# Context files are project-owned once filled in: never overwrite existing
# ones, but do add newly introduced templates (e.g. design-system.md) that an
# older install would not have.
for f in "$root/ai/context"/*.md; do
  copy_if_missing "$f" "$target/ai/context/$(basename "$f")"
done

# Artifacts directory: project-owned output home (see ai/artifacts/README.md).
# Only seed the convention README; never touch produced artifacts.
mkdir -p "$target/ai/artifacts"
copy_if_missing "$root/ai/artifacts/README.md" "$target/ai/artifacts/README.md"

# Governance self-check and GitHub process templates.
copy_if_missing "$root/scripts/check-governance.sh" "$target/scripts/check-governance.sh"
copy_if_missing "$root/.github/pull_request_template.md" "$target/.github/pull_request_template.md"
copy_if_missing "$root/.github/ISSUE_TEMPLATE/ai_task.yml" "$target/.github/ISSUE_TEMPLATE/ai_task.yml"
copy_if_missing "$root/.codex/config.toml" "$target/.codex/config.toml"

mkdir -p "$target/.claude" "$target/.codex"
cp -R "$root/.claude/skills" "$target/.claude/"
cp -R "$root/.claude/agents" "$target/.claude/"
cp -R "$root/.codex/skills" "$target/.codex/"

if [[ ! -d "$target/tools/kanban" ]]; then
  mkdir -p "$target/tools"
  cp -R "$root/tools/kanban" "$target/tools/"
  # These are Monstrare's own board-design history (old 12-stage naming,
  # variant selection records), not part of the tool: don't ship them.
  rm -rf "$target/tools/kanban/mockups"
  rm -f "$target/tools/kanban/mockup-decision.md" "$target/tools/kanban/screen-spec.md"
fi

echo "Monstrare installed."

