#!/usr/bin/env bash
# status.sh — observations about where the project stands (no verdicts).
# Used by /next and the session-start hook.  Usage: status.sh [--short]
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"
ROOT="$(studio_root)" || { echo "status: cannot find .claude/studio.yaml" >&2; exit 1; }
SHORT=no; [ "${1:-}" = "--short" ] && SHORT=yes
c() { cfg_get "$1" 2>/dev/null || true; }

name=$(c project.name); [ -n "$name" ] || name="(unnamed)"
echo "[studio] $name · $(c project.type) · stage $(c project.stage) · packs $(c packs) · rigor $(c mode.rigor) · automation $(c mode.automation)"
echo "[lang]   talk $(c language.conversation) · docs $(c language.docs) · code $(c language.code) · in-game $(c language.ingame)"

main=$(c git.main_branch); [ -n "$main" ] || main=main
if git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  br=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')
  dirty=$(git -C "$ROOT" status --porcelain 2>/dev/null | grep -c . || true)
  last=$(git -C "$ROOT" log -1 --pretty='%h %s' 2>/dev/null || echo 'no commits')
  ahead=""
  if [ "$br" != "$main" ] && git -C "$ROOT" rev-parse --verify -q "$main" >/dev/null; then
    ahead=" · $(git -C "$ROOT" rev-list --count "$main..HEAD" 2>/dev/null) commits ahead of $main"
  fi
  echo "[git]    branch $br$ahead · $dirty uncommitted · last: $last"
else
  echo "[git]    not a git repository"
fi

backlog="$ROOT/$(c docs.backlog)"
if [ -f "$backlog" ]; then
  inprog=$(grep -E '^- \[~\] ' "$backlog" | sed 's/^- \[~\] //' | head -3)
  nexts=$(awk '/^## Now/{s=1;next} /^## /{s=0} s && /^- \[ \] /{sub(/^- \[ \] /,""); print}' "$backlog" | head -3)
  open_s=$(grep -cE '^- \[[ ~]\] S-' "$backlog" || true)
  open_b=$(grep -cE '^- \[[ ~]\] B-' "$backlog" || true)
  done_n=$(grep -cE '^- \[x\] ' "$backlog" || true)
  echo "[backlog] open stories $open_s · open bugs $open_b · done $done_n"
  [ -n "$inprog" ] && printf '%s\n' "$inprog" | sed 's/^/  in progress: /'
  [ -n "$nexts" ] && printf '%s\n' "$nexts" | sed 's/^/  now: /'
else
  echo "[backlog] none yet ($(c docs.backlog))"
fi

if [ "$SHORT" = no ]; then
  for k in validate lint test build; do
    log="$ROOT/.claude/state/checks/$k.log"
    if [ -f "$log" ]; then
      res=$(grep -E '^# RESULT:|^NOT CONFIGURED' "$log" | tail -1 | sed 's/^# RESULT: //')
      when=$(head -1 "$log" | sed -n 's/^# \([0-9-]* [0-9:]*\).*/\1/p')
      echo "[check]  $k: ${res:-?} ${when:+($when)}"
    else
      echo "[check]  $k: never run"
    fi
  done
  for d in brief backlog decisions; do
    p=$(c docs.$d); [ -n "$p" ] && [ ! -f "$ROOT/$p" ] && echo "[docs]   missing $d: $p"
  done
fi
exit 0
