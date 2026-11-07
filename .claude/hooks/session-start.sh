#!/usr/bin/env bash
# SessionStart hook: prints a short orientation that Claude receives as context.
# After compaction or resume it also restores the session checkpoint in full.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=../scripts/lib.sh
. "$HERE/../scripts/lib.sh"
ROOT="$(studio_root)" || exit 0
payload=$(cat 2>/dev/null || true)
source_kind=$(printf '%s' "$payload" | json_str source 2>/dev/null || true)

bash "$ROOT/.claude/scripts/status.sh" --short 2>/dev/null

name=$(cfg_get project.name 2>/dev/null || true)
packs=$(cfg_get packs 2>/dev/null || true)
main=$(cfg_get git.main_branch 2>/dev/null || echo main)
if [ -z "$name" ] && [ "$packs" = "[]" ]; then
  echo "[hint]   Studio not set up for this project: run /start (new project) or /adopt (existing code)."
fi
if git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  br=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || true)
  if [ "$br" = "$main" ] && [ -n "$(git -C "$ROOT" status --porcelain 2>/dev/null)" ]; then
    echo "[hint]   Uncommitted changes on $main. Move them to a feature branch before committing (git switch -c <prefix><slug>)."
  fi
fi
if [ -f "$ROOT/CLAUDE.md" ] && ! grep -q '@\.claude/studio/STUDIO\.md' "$ROOT/CLAUDE.md"; then
  echo "[hint]   CLAUDE.md does not import .claude/studio/STUDIO.md; the studio rules are not loaded. /adopt fixes this."
fi

state="$ROOT/.claude/state/active.md"
if [ -f "$state" ]; then
  case "$source_kind" in
    compact|resume)
      echo "[checkpoint] restored from .claude/state/active.md:"
      sed 's/^/  /' "$state" ;;
    *)
      echo "[checkpoint] .claude/state/active.md exists (updated $(date -r "$state" '+%Y-%m-%d %H:%M' 2>/dev/null || echo '?')); read it before continuing earlier work." ;;
  esac
fi
exit 0
