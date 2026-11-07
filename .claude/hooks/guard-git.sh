#!/usr/bin/env bash
# PreToolUse hook (Bash|PowerShell): guards git commands.
#   force push                         -> blocked
#   push / gh pr create|merge          -> asks the user when git.auto_push is false
#   commit on git.main_branch          -> blocked when git.block_commit_on_main is true
#   commit with CJK text in code       -> blocked when language.code is en
#   commit with invalid staged JSON    -> blocked
#   commit while checks.validate fails -> blocked when git.validate_on_commit is true
# Exit 2 + stderr blocks the call and tells Claude why. Anything else allows it.
set -u
payload=$(cat)
# Fast exit for the many commands that are not git/gh (keeps Windows shells snappy).
case "$payload" in *git*|*'"gh '*|*' gh '*) ;; *) exit 0 ;; esac
HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=../scripts/lib.sh
. "$HERE/../scripts/lib.sh"
ROOT="$(studio_root)" || exit 0
cmd=$(printf '%s' "$payload" | json_str command 2>/dev/null || true)
[ -n "$cmd" ] || exit 0
case "$cmd" in *git*|*gh\ *) ;; *) exit 0 ;; esac

cfg() { cfg_get "$1" 2>/dev/null || true; }
problems=""
add_problem() { problems="${problems}- $*
"; }
ask() {
  local reason="$1"
  reason=$(printf '%s' "$reason" | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"%s"}}\n' "$reason"
  exit 0
}

# Split the command line into simple commands and find each git/gh subcommand.
# Prints lines: "<tool> <subcommand> <repo-dir-or-dot> <rest-of-args>"
parse() {
  printf '%s\n' "$cmd" | awk '{ gsub(/&&|\|\||;|\|/, "\n"); print }' | while IFS= read -r seg; do
    # shellcheck disable=SC2086
    set -f; set -- $seg; set +f
    while [ $# -gt 0 ]; do
      case "$1" in
        git|*/git|git.exe|*/git.exe|*\\git.exe) break ;;
        gh|gh.exe|*/gh|*/gh.exe) break ;;
      esac
      shift
    done
    [ $# -gt 0 ] || continue
    tool=$(basename "$1" .exe); shift
    repo="."
    while [ $# -gt 0 ]; do
      case "$1" in
        -C) repo="$2"; shift 2 ;;
        -c|--git-dir|--work-tree|--namespace) shift 2 ;;
        -*) shift ;;
        *) break ;;
      esac
    done
    [ $# -gt 0 ] || continue
    sub="$1"; shift
    if [ "$tool" = gh ] && [ $# -gt 0 ]; then sub="$sub-$1"; shift; fi
    printf '%s %s %s %s\n' "$tool" "$sub" "$repo" "$*"
  done
}

auto_push=$(cfg git.auto_push)
main=$(cfg git.main_branch); [ -n "$main" ] || main=main

while IFS= read -r line; do
  [ -n "$line" ] || continue
  tool=${line%% *}; rest=${line#* }; sub=${rest%% *}; rest=${rest#* }; repo=${rest%% *}; args=${rest#* }
  [ "$args" = "$repo" ] && args=""
  case "$tool:$sub" in
    git:push)
      if printf ' %s ' "$args" | grep -Eq '[[:space:]](--force|-f|--force-with-lease[^[:space:]]*|-[a-zA-Z]*f[a-zA-Z]*)[[:space:]]|[[:space:]]\+[^[:space:]]'; then
        echo "Blocked: force push is not allowed in this studio. Push normally; if history must be rewritten, ask the user to do it." >&2
        exit 2
      fi
      [ "$auto_push" = true ] || ask "Studio rule: pushing needs your OK (git.auto_push is false). Command: $cmd" ;;
    gh:pr-create|gh:pr-merge)
      [ "$auto_push" = true ] || ask "Studio rule: opening or merging a PR needs your OK. Command: $cmd" ;;
    git:merge)
      br=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || true)
      [ "$br" = "$main" ] && ask "Studio rule: merging into $main needs your OK. Command: $cmd" ;;
    git:commit)
      COMMIT_REPO="$repo"; COMMIT_ARGS="$args"; DO_COMMIT=yes ;;
  esac
done <<EOF2
$(parse)
EOF2

[ "${DO_COMMIT:-no}" = yes ] || exit 0
case "$COMMIT_REPO" in /*|[A-Za-z]:*) R="$COMMIT_REPO" ;; *) R="$ROOT/$COMMIT_REPO" ;; esac
git -C "$R" rev-parse --git-dir >/dev/null 2>&1 || exit 0

# 1. branch discipline (the very first commit of a repository is allowed)
if [ "$(cfg git.block_commit_on_main)" = true ] && git -C "$R" rev-parse --verify -q HEAD >/dev/null; then
  br=$(git -C "$R" rev-parse --abbrev-ref HEAD 2>/dev/null || true)
  if [ "$br" = "$main" ] || { [ "$main" = main ] && [ "$br" = master ]; }; then
    add_problem "You are on '$br'. One concern per branch: create one first, e.g. git switch -c $(cfg git.branch_prefix)<story-slug>, then commit there."
  fi
fi

# What will be committed: the index, plus tracked edits when -a/--all is used.
diff_range="--cached"
printf ' %s ' "$COMMIT_ARGS" | grep -Eq '[[:space:]](-a|--all|-[a-zA-Z]*a[a-zA-Z]*)[[:space:]]' && diff_range="HEAD"
git -C "$R" rev-parse --verify -q HEAD >/dev/null || diff_range="--cached"
files=$(git -C "$R" diff $diff_range --name-only --diff-filter=ACMR 2>/dev/null || true)

# 2. language of code
if [ "$(cfg language.code)" = en ] && [ -n "$files" ]; then
  ingame=$(cfg language.ingame)
  hits=""
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    is_code_file "$f" || continue
    is_exempt_path "$f" && continue
    found=$(git -C "$R" diff $diff_range -U0 --no-color -- "$f" 2>/dev/null | LC_ALL=C awk '
      /^@@/ { s = $0; sub(/^@@ -[0-9,]+ \+/, "", s); sub(/[ ,].*/, "", s); n = s + 0; next }
      /^\+\+\+/ { next }
      /^\+/ { print n ": " substr($0, 2); n++; next }
    ' | LC_ALL=C grep -E "$CJK_RE" || true)
    [ -n "$found" ] || continue
    if [ "$ingame" != en ]; then
      kept=""
      while IFS= read -r l; do looks_like_comment "${l#*: }" && kept="$kept$l
"; done <<EOF3
$found
EOF3
      found=$(printf '%s' "$kept" | sed '/^$/d')
      [ -n "$found" ] || continue
    fi
    hits="$hits$(printf '%s\n' "$found" | head -5 | sed "s#^#    $f:#")
"
  done <<EOF4
$files
EOF4
  if [ -n "$hits" ]; then
    add_problem "Korean/CJK text in code (language.code is en). Rewrite comments/identifiers in English; player-facing text goes to data or i18n files (paths.i18n):
$hits"
  fi
fi

# 3. JSON validity of staged JSON files
if [ -n "$files" ]; then
  tmpd="$ROOT/.claude/state/.guard.$$"; mkdir -p "$tmpd"
  while IFS= read -r f; do
    case "$f" in *.json) ;; *) continue ;; esac
    is_exempt_path "$f" && case "$f" in .claude/*) ;; *) continue ;; esac
    if [ "$diff_range" = "--cached" ]; then git -C "$R" show ":$f" > "$tmpd/x.json" 2>/dev/null || continue
    else cp "$R/$f" "$tmpd/x.json" 2>/dev/null || continue; fi
    msg=$(json_valid "$tmpd/x.json"); rc=$?
    [ $rc -eq 1 ] && add_problem "Invalid JSON in $f: $msg"
  done <<EOF5
$files
EOF5
  rm -rf "$tmpd"
fi

# 4. project validation
if [ -z "$problems" ] && [ "$(cfg git.validate_on_commit)" = true ]; then
  v=$(cfg checks.validate)
  if [ -n "$v" ]; then
    out=$(cd "$R" && bash -c "$v" 2>&1); rc=$?
    if [ $rc -ne 0 ]; then
      add_problem "checks.validate failed (exit $rc): $v
$(printf '%s\n' "$out" | tail -n 25 | sed 's/^/    | /')"
    fi
  fi
fi

if [ -n "$problems" ]; then
  printf 'Commit blocked by studio guard:\n%s' "$problems" >&2
  exit 2
fi
exit 0
