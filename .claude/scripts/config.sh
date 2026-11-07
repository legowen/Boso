#!/usr/bin/env bash
# config.sh — read and write .claude/studio.yaml.
#   get <section.key>            print a value (exit 1 if the key is absent)
#   set <section.key> <value>    replace a value, keeping its comment
#   add <section.key> <item>     add an item to an inline list, e.g. packs
#   remove <section.key> <item>  remove an item from an inline list
#   show                         print every setting as section.key = value
# Options: --file <yaml> to operate on another file (pack.yaml).
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"

FILE=""
if [ "${1:-}" = "--file" ]; then FILE="$2"; shift 2; fi
cmd="${1:-}"; shift || true
[ -n "$FILE" ] || FILE="$(studio_root)/.claude/studio.yaml"

case "$cmd" in
  get)
    [ $# -eq 1 ] || { echo "usage: config.sh get <section.key>" >&2; exit 2; }
    cfg_get "$1" "$FILE" ;;
  set)
    [ $# -eq 2 ] || { echo "usage: config.sh set <section.key> <value>" >&2; exit 2; }
    cfg_set "$1" "$2" "$FILE" && echo "$1 = $2" ;;
  add|remove)
    [ $# -eq 2 ] || { echo "usage: config.sh $cmd <section.key> <item>" >&2; exit 2; }
    cur=$(cfg_get "$1" "$FILE") || { echo "config: key not found: $1" >&2; exit 1; }
    items=$(list_items "$cur")
    if [ "$cmd" = add ]; then
      printf '%s\n' "$items" | grep -qxF "$2" || items=$(printf '%s\n%s\n' "$items" "$2" | grep -v '^$')
    else
      items=$(printf '%s\n' "$items" | grep -vxF "$2" || true)
    fi
    new="[$(printf '%s\n' "$items" | grep -v '^$' | paste -sd ',' - | sed 's/,/, /g')]"
    cfg_set "$1" "$new" "$FILE" && echo "$1 = $new" ;;
  show)
    awk '
      /^[ \t]*#/ || /^[ \t]*$/ { next }
      { line = $0; sub(/[ \t]+#.*$/, "", line) }
      line ~ /^[^ \t]/ { k = line; sub(/:.*/, "", k); sec = k; v = line; sub(/^[^:]*:[ \t]*/, "", v); if (v != "") print sec " = " v; next }
      line ~ /^  [^ \t]/ { k = line; sub(/^  /, "", k); sub(/:.*/, "", k); v = line; sub(/^[^:]*:[ \t]*/, "", v); print sec "." k " = " v }
    ' "$FILE" ;;
  *)
    sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
