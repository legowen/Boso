#!/usr/bin/env bash
# PostToolUse hook (Write|Edit): fast feedback right after a file changes.
#   - invalid JSON
#   - Korean/CJK text written into code when language.code is en
#   - CJK text written into game data when language.ingame is en
# Only the newly written text is checked for language, so old files do not nag.
# Exit 2 + stderr shows the problem to Claude (the edit has already happened).
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=../scripts/lib.sh
. "$HERE/../scripts/lib.sh"
ROOT="$(studio_root)" || exit 0
payload=$(cat)
fp=$(printf '%s' "$payload" | json_str file_path 2>/dev/null || true)
[ -n "$fp" ] || exit 0
rel=$(rel_path "$fp" "$ROOT")
case "$rel" in OUTSIDE:*) exit 0 ;; esac
abs="$ROOT/$rel"
problems=""

tool=$(printf '%s' "$payload" | json_str tool_name 2>/dev/null || true)
case "$tool" in
  Write) new=$(printf '%s' "$payload" | json_str content 2>/dev/null || true) ;;
  Edit)  new=$(printf '%s' "$payload" | json_str new_string 2>/dev/null || true) ;;
  *)     new="" ;;
esac

if [ -n "$new" ] && ! is_exempt_path "$rel"; then
  code_lang=$(cfg_get language.code 2>/dev/null || true)
  ingame=$(cfg_get language.ingame 2>/dev/null || true)
  data=$(cfg_get paths.data 2>/dev/null || true)
  if is_code_file "$rel" && [ "$code_lang" = en ]; then
    hits=$(printf '%s\n' "$new" | LC_ALL=C grep -nE "$CJK_RE" || true)
    if [ -n "$hits" ] && [ "$ingame" != en ]; then
      kept=""
      while IFS= read -r l; do looks_like_comment "${l#*:}" && kept="$kept$l
"; done <<EOF2
$hits
EOF2
      hits=$(printf '%s' "$kept" | sed '/^$/d')
    fi
    [ -n "$hits" ] && problems="${problems}- $rel: Korean/CJK text in code (language.code is en). Use English for comments and identifiers; put player-facing text in data or i18n files.
$(printf '%s\n' "$hits" | head -5 | sed 's/^/    new text line /')
"
  elif [ -n "$data" ] && [ "$ingame" = en ]; then
    case "$rel" in
      "$data"/*)
        hits=$(printf '%s\n' "$new" | LC_ALL=C grep -nE "$CJK_RE" || true)
        [ -n "$hits" ] && problems="${problems}- $rel: Korean/CJK text in game data while language.ingame is en.
$(printf '%s\n' "$hits" | head -5 | sed 's/^/    new text line /')
" ;;
    esac
  fi
fi

case "$rel" in
  *.json)
    if [ -f "$abs" ]; then
      msg=$(json_valid "$abs"); rc=$?
      [ $rc -eq 1 ] && problems="${problems}- $rel is not valid JSON: $msg
"
    fi ;;
esac

if [ -n "$problems" ]; then
  printf 'Studio check after edit:\n%s' "$problems" >&2
  exit 2
fi
exit 0
