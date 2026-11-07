#!/usr/bin/env bash
# sync.sh — bring framework files from the studio template into this project.
#   sync.sh <template-dir>           dry run: list what would change
#   sync.sh <template-dir> --apply   copy the changes
# Framework-owned (copied): .claude/studio/, .claude/scripts/, .claude/hooks/,
#   .claude/packs/, and the core agents, skills and rules that exist in the template.
# Project-owned (never overwritten): .claude/studio.yaml, .claude/settings.json,
#   CLAUDE.md, .claude/state/, design/, pack copies installed in .claude/agents|rules,
#   skills and agents the project added itself. Differences there are reported only.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"
ROOT="$(studio_root)" || { echo "sync: cannot find .claude/studio.yaml" >&2; exit 2; }
TPL="${1:-}"; APPLY=no; [ "${2:-}" = "--apply" ] && APPLY=yes
[ -n "$TPL" ] || { sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }
TPL=$(cd "$TPL" 2>/dev/null && pwd) || { echo "sync: no such folder: $1" >&2; exit 2; }
[ -f "$TPL/.claude/studio.yaml" ] || { echo "sync: $TPL is not a studio template (no .claude/studio.yaml)" >&2; exit 2; }
[ "$TPL" != "$ROOT" ] || { echo "sync: template and project are the same folder" >&2; exit 2; }

added=0; updated=0; same=0
consider() { # <relative path>
  local rel="$1" src="$TPL/$1" dst="$ROOT/$1"
  if [ ! -f "$dst" ]; then
    echo "  ADD     $rel"; added=$((added+1))
    [ "$APPLY" = yes ] && mkdir -p "$(dirname "$dst")" && cp "$src" "$dst"
  elif ! cmp -s "$src" "$dst"; then
    echo "  UPDATE  $rel"; updated=$((updated+1))
    [ "$APPLY" = yes ] && cp "$src" "$dst"
  else
    same=$((same+1))
  fi
}

echo "Template: $TPL"
echo "Project:  $ROOT"
echo "Framework files:"
cd "$TPL" || exit 2
for f in $(find .claude/studio .claude/scripts .claude/hooks .claude/packs -type f 2>/dev/null | sed 's#^\./##' | sort); do
  consider "$f"
done
for f in $(find .claude/agents .claude/rules -maxdepth 1 -type f -name '*.md' 2>/dev/null | sed 's#^\./##' | sort); do
  consider "$f"
done
for f in $(find .claude/skills -type f 2>/dev/null | sed 's#^\./##' | sort); do
  consider "$f"
done
echo "  ($same unchanged)"

echo "Project-owned files (not copied, review by hand if they differ):"
for f in .claude/settings.json; do
  [ -f "$TPL/$f" ] && [ -f "$ROOT/$f" ] && ! cmp -s "$TPL/$f" "$ROOT/$f" && echo "  DIFFERS $f"
done
missing=$(bash "$TPL/.claude/scripts/config.sh" --file "$TPL/.claude/studio.yaml" show | sed 's/ = .*//' | while read -r k; do
  cfg_get "$k" "$ROOT/.claude/studio.yaml" >/dev/null 2>&1 || echo "$k"
done)
if [ -n "$missing" ]; then
  echo "  studio.yaml is missing keys the template has (add them by hand, with the template's comment):"
  printf '%s\n' "$missing" | sed 's/^/    /'
fi
for f in $(find "$ROOT/.claude/scripts" "$ROOT/.claude/hooks" -type f 2>/dev/null); do
  rel=${f#"$ROOT"/}; [ -f "$TPL/$rel" ] || echo "  ONLY IN PROJECT $rel"
done

if [ "$APPLY" = yes ]; then
  chmod +x "$ROOT"/.claude/scripts/*.sh "$ROOT"/.claude/hooks/*.sh 2>/dev/null || true
  echo "Applied: $added added, $updated updated. Next: re-activate active packs (pack.sh activate <pack>), run selftest.sh, start a new session."
else
  echo "Dry run: $added to add, $updated to update. Re-run with --apply to copy."
fi
