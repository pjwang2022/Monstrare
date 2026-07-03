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

if [[ ! -d "$target/ai/context" ]]; then
  cp -R "$root/ai/context" "$target/ai/"
fi

mkdir -p "$target/.claude" "$target/.codex"
cp -R "$root/.claude/skills" "$target/.claude/"
cp -R "$root/.claude/agents" "$target/.claude/"
cp -R "$root/.codex/skills" "$target/.codex/"

if [[ ! -d "$target/tools/kanban" ]]; then
  mkdir -p "$target/tools"
  cp -R "$root/tools/kanban" "$target/tools/"
fi

echo "AI Coding Governance Kit installed."

