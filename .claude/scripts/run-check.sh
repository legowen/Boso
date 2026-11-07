#!/usr/bin/env bash
# run-check.sh — run the project's check commands from .claude/studio.yaml.
#   run-check.sh <validate|lint|test|build>   one check
#   run-check.sh all                          validate, lint, test, build in order
# Prints PASS / FAIL (exit N) / NOT CONFIGURED per check and keeps the full output in
# .claude/state/checks/<name>.log. Observations only: NOT CONFIGURED is not a pass.
# Exit: 0 no failures, 1 at least one FAIL, 2 usage.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"
ROOT="$(studio_root)" || { echo "run-check: cannot find .claude/studio.yaml" >&2; exit 2; }
LOGS="$ROOT/.claude/state/checks"; mkdir -p "$LOGS"

one() {
  local name="$1" cmd rc log
  cmd=$(cfg_get "checks.$name" 2>/dev/null || true)
  log="$LOGS/$name.log"
  if [ -z "$cmd" ]; then
    printf '%-9s NOT CONFIGURED (checks.%s is empty)\n' "$name" "$name"
    printf 'NOT CONFIGURED\n' > "$log"; return 3
  fi
  {
    echo "# $(date '+%Y-%m-%d %H:%M:%S') $cmd"
    echo "# branch: $(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
  } > "$log"
  ( cd "$ROOT" && bash -c "$cmd" ) >> "$log" 2>&1
  rc=$?
  if [ $rc -eq 0 ]; then
    echo "# RESULT: PASS" >> "$log"; printf '%-9s PASS   (%s)\n' "$name" "$cmd"
  else
    echo "# RESULT: FAIL exit $rc" >> "$log"; printf '%-9s FAIL   exit %s (%s)\n' "$name" "$rc" "$cmd"
    tail -n 25 "$log" | sed 's/^/          | /'
  fi
  return $rc
}

case "${1:-}" in
  validate|lint|test|build)
    one "$1"; rc=$?
    [ $rc -eq 3 ] && exit 0
    [ $rc -eq 0 ] && exit 0 || exit 1 ;;
  all)
    pass=0; fail=0; nc=0
    for c in validate lint test build; do
      one "$c"; rc=$?
      case $rc in 0) pass=$((pass+1)) ;; 3) nc=$((nc+1)) ;; *) fail=$((fail+1)) ;; esac
    done
    echo "RESULT: $pass passed, $fail failed, $nc not configured"
    [ $fail -eq 0 ] ;;
  run)
    echo "run-check: 'run' starts the app; follow .claude/studio/run-and-observe.md instead" >&2; exit 2 ;;
  *)
    sed -n '2,8p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
