#!/usr/bin/env bash
# lib.sh — shared helpers for studio scripts and hooks. Source it; do not run it.
# Portable: bash 3.2+, POSIX awk/grep/sed. No jq, no Python required.
# Works under Git Bash on Windows, macOS and Linux.

# ---------------------------------------------------------------- locating
# studio_root: the project root (the folder that holds .claude/studio.yaml).
studio_root() {
  if [ -n "${STUDIO_ROOT:-}" ] && [ -f "$STUDIO_ROOT/.claude/studio.yaml" ]; then
    printf '%s\n' "$STUDIO_ROOT"; return 0
  fi
  if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
    local d
    d=$(to_posix_path "$CLAUDE_PROJECT_DIR")
    if [ -f "$d/.claude/studio.yaml" ]; then printf '%s\n' "$d"; return 0; fi
  fi
  local here
  here=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)
  if [ -n "$here" ] && [ -f "$here/.claude/studio.yaml" ]; then printf '%s\n' "$here"; return 0; fi
  return 1
}

is_windows() {
  [ "${STUDIO_FORCE_WINDOWS:-}" = 1 ] && return 0
  case "$(uname -s 2>/dev/null)" in MINGW*|MSYS*|CYGWIN*) return 0 ;; esac
  return 1
}

# to_posix_path: C:\a\b or C:/a/b -> /c/a/b on Windows shells; others unchanged.
to_posix_path() {
  local p="$1"
  p=$(printf '%s' "$p" | sed 's#\\#/#g')
  case "$p" in
    [A-Za-z]:/*)
      local drive rest
      drive=$(printf '%s' "${p%%:*}" | tr 'A-Z' 'a-z')
      rest="${p#?:}"
      p="/$drive$rest"
      ;;
  esac
  printf '%s\n' "$p"
}

# rel_path <path> <root>: project-relative path, or the normalized absolute path
# prefixed with "OUTSIDE:" when the file is not under root.
rel_path() {
  local p r lp lr
  p=$(to_posix_path "$1"); r=$(to_posix_path "$2"); r="${r%/}"
  case "$p" in /*) ;; *) printf '%s\n' "${p#./}"; return 0 ;; esac
  if is_windows; then
    lp=$(printf '%s' "$p" | tr 'A-Z' 'a-z'); lr=$(printf '%s' "$r" | tr 'A-Z' 'a-z')
  else
    lp="$p"; lr="$r"
  fi
  case "$lp" in
    "$lr"/*) printf '%s\n' "${p:$(( ${#r} + 1 ))}" ;;
    *) printf 'OUTSIDE:%s\n' "$p" ;;
  esac
}

# ---------------------------------------------------------------- config
# cfg_get <section.key> [file]: prints the value (quotes and comments stripped).
# Lists come back as their inline text, e.g. "[web-phaser, unity]".
# Prints nothing and returns 1 when the key is absent.
cfg_get() {
  local key="$1" file="${2:-}"
  [ -n "$file" ] || file="$(studio_root)/.claude/studio.yaml"
  [ -f "$file" ] || return 1
  awk -v want="$key" '
    function trim(s) { sub(/^[ \t\r]+/, "", s); sub(/[ \t\r]+$/, "", s); return s }
    function nocomment(s,   i, c, q, out) {
      out = ""; q = ""
      for (i = 1; i <= length(s); i++) {
        c = substr(s, i, 1)
        if (q != "") {
          out = out c
          if (q == "\"" && c == "\\") { i++; out = out substr(s, i, 1); continue }
          if (c == q) q = ""
          continue
        }
        if (c == "\"" || c == "\047") { q = c; out = out c; continue }
        if (c == "#" && (i == 1 || substr(s, i - 1, 1) ~ /[ \t]/)) break
        out = out c
      }
      return out
    }
    function unquote(s,   i, c, out) {
      if (s ~ /^\047.*\047$/) return substr(s, 2, length(s) - 2)
      if (s !~ /^".*"$/) return s
      s = substr(s, 2, length(s) - 2); out = ""
      for (i = 1; i <= length(s); i++) {
        c = substr(s, i, 1)
        if (c == "\\" && i < length(s)) { i++; c = substr(s, i, 1) }
        out = out c
      }
      return out
    }
    /^[ \t]*#/ || /^[ \t]*$/ { next }
    {
      line = nocomment($0)
      if (line ~ /^[^ \t]/) {
        k = line; sub(/:.*/, "", k); k = trim(k)
        v = line; sub(/^[^:]*:/, "", v); v = trim(v)
        section = k
        if (k == want) { print unquote(v); found = 1; exit }
        next
      }
      if (line ~ /^  [^ \t]/) {
        k = line; sub(/:.*/, "", k); k = trim(k)
        v = line; sub(/^[^:]*:/, "", v); v = trim(v)
        if (section "." k == want) { print unquote(v); found = 1; exit }
      }
    }
    END { exit found ? 0 : 1 }
  ' "$file"
}

# cfg_set <section.key> <value> [file]: replaces the value in place, keeping any
# trailing comment. Fails when the key does not exist (add keys by editing).
cfg_set() {
  local key="$1" value="$2" file="${3:-}" tmp
  [ -n "$file" ] || file="$(studio_root)/.claude/studio.yaml"
  [ -f "$file" ] || { echo "config: no file $file" >&2; return 1; }
  tmp="$file.tmp.$$"
  STUDIO_VAL="$value" awk -v want="$key" '
    BEGIN { val = ENVIRON["STUDIO_VAL"] }
    function trim(s) { sub(/^[ \t\r]+/, "", s); sub(/[ \t\r]+$/, "", s); return s }
    function split_comment(s,   i, c, q) {
      q = ""
      for (i = 1; i <= length(s); i++) {
        c = substr(s, i, 1)
        if (q != "") {
          if (q == "\"" && c == "\\") { i++; continue }
          if (c == q) q = ""
          continue
        }
        if (c == "\"" || c == "\047") { q = c; continue }
        if (c == "#" && (i == 1 || substr(s, i - 1, 1) ~ /[ \t]/)) return i
      }
      return 0
    }
    function render(v,   i, c, out) {
      if (v ~ /^\[.*\]$/) return v
      if (v ~ /^[A-Za-z0-9._\/+@-]+$/) return v
      out = ""
      for (i = 1; i <= length(v); i++) {
        c = substr(v, i, 1)
        if (c == "\\" || c == "\"") out = out "\\"
        out = out c
      }
      return "\"" out "\""
    }
    {
      raw = $0; sub(/\r$/, "", raw)
      if (done || raw ~ /^[ \t]*#/ || raw ~ /^[ \t]*$/) { print raw; next }
      indent = ""; if (raw ~ /^  [^ \t]/) indent = "  "
      if (indent == "" && raw ~ /^[^ \t]/) { k = raw; sub(/:.*/, "", k); section = trim(k); full = section }
      else if (indent == "  ") { k = raw; sub(/:.*/, "", k); full = section "." trim(k) }
      else { print raw; next }
      if (full != want) { print raw; next }
      ci = split_comment(raw)
      comment = ""
      if (ci > 0) { comment = substr(raw, ci); body = substr(raw, 1, ci - 1) } else body = raw
      k = body; sub(/:.*/, "", k)
      newbody = k ": " render(val)
      if (comment != "") {
        pad = length(body) - length(newbody); if (pad < 1) pad = 1
        newbody = newbody sprintf("%" pad "s", "") comment
      }
      print newbody; done = 1; next
    }
    END { if (!done) exit 3 }
  ' "$file" > "$tmp"
  local rc=$?
  if [ $rc -ne 0 ]; then rm -f "$tmp"; echo "config: key not found: $key" >&2; return 1; fi
  mv "$tmp" "$file"
}

# list_items "[a, b]" -> one item per line
list_items() {
  printf '%s\n' "$1" | sed 's/^\[//; s/\]$//' | tr ',' '\n' | sed 's/^[ \t"]*//; s/[ \t"]*$//' | grep -v '^$' || true
}

# ---------------------------------------------------------------- hook payloads
# json_str <field>: the first string value of "field" in the JSON on stdin,
# decoded (\n, \t, \", \\, \/, \uXXXX incl. surrogate pairs -> UTF-8).
# Prints nothing when the field is missing or not a string.
json_str() {
  LC_ALL=C awk -v field="$1" '
    BEGIN { BINMODE = 3 }
    { buf = buf (NR > 1 ? "\n" : "") $0 }
    function hexval(h,   i, c, v) {
      v = 0
      for (i = 1; i <= 4; i++) {
        c = index("0123456789abcdef", tolower(substr(h, i, 1)))
        if (c == 0) return -1
        v = v * 16 + c - 1
      }
      return v
    }
    function utf8(cp) {
      if (cp < 128) return sprintf("%c", cp)
      if (cp < 2048) return sprintf("%c%c", 192 + int(cp / 64), 128 + cp % 64)
      if (cp < 65536) return sprintf("%c%c%c", 224 + int(cp / 4096), 128 + int(cp / 64) % 64, 128 + cp % 64)
      return sprintf("%c%c%c%c", 240 + int(cp / 262144), 128 + int(cp / 4096) % 64, 128 + int(cp / 64) % 64, 128 + cp % 64)
    }
    END {
      pat = "\"" field "\"[ \t\r\n]*:[ \t\r\n]*\""
      rest = buf; offset = 0
      while (match(rest, pat)) {
        start = offset + RSTART
        if (start == 1 || substr(buf, start - 1, 1) != "\\") break
        offset = offset + RSTART + RLENGTH - 1; rest = substr(buf, offset + 1)
        start = 0
      }
      if (!start) exit 1
      i = offset + RSTART + RLENGTH; out = ""; n = length(buf)
      while (i <= n) {
        c = substr(buf, i, 1)
        if (c == "\"") { printf "%s", out; exit 0 }
        if (c == "\\") {
          e = substr(buf, i + 1, 1)
          if (e == "n") out = out "\n"
          else if (e == "t") out = out "\t"
          else if (e == "r") out = out "\r"
          else if (e == "b" || e == "f") out = out ""
          else if (e == "u") {
            cp = hexval(substr(buf, i + 2, 4)); i += 4
            if (cp >= 55296 && cp <= 56319 && substr(buf, i + 2, 2) == "\\u") {
              lo = hexval(substr(buf, i + 4, 4))
              if (lo >= 56320 && lo <= 57343) { cp = 65536 + (cp - 55296) * 1024 + (lo - 56320); i += 6 }
            }
            if (cp >= 0) out = out utf8(cp)
          }
          else out = out e
          i += 2; continue
        }
        out = out c; i++
      }
      exit 1
    }
  '
}

# ---------------------------------------------------------------- text checks
# CJK_RE: an extended regex (for LC_ALL=C grep -E) matching Hangul syllables and
# jamo, Japanese kana and CJK ideographs as raw UTF-8 bytes.
CJK_RE=$'\xe1[\x84-\x87]|\xe3[\x81-\x86]|[\xe4-\xec][\x80-\xbf]|\xed[\x80-\x9e]'

# is_code_file <path>: true for source files where language.code applies.
is_code_file() {
  case "$1" in
    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs|*.vue|*.svelte) return 0 ;;
    *.cs|*.gd|*.gdshader|*.shader|*.hlsl|*.glsl|*.cginc) return 0 ;;
    *.py|*.lua|*.dart|*.swift|*.kt|*.kts|*.java|*.go|*.rs|*.rb|*.php) return 0 ;;
    *.c|*.cc|*.cpp|*.h|*.hpp|*.m|*.mm) return 0 ;;
  esac
  return 1
}

# is_exempt_path <rel> : paths the language check never applies to.
is_exempt_path() {
  local rel="$1" i18n item
  case "$rel" in
    OUTSIDE:*|.claude/*|design/*|docs/*|*.md|node_modules/*|*/node_modules/*|Library/*|Packages/*|.godot/*) return 0 ;;
  esac
  i18n=$(cfg_get paths.i18n 2>/dev/null || true)
  if [ -n "$i18n" ]; then
    local IFS=','
    for item in $i18n; do
      item=$(printf '%s' "$item" | sed 's/^[ \t]*//; s/[ \t]*$//; s#/*$##')
      [ -n "$item" ] || continue
      case "$rel" in "$item"|"$item"/*) return 0 ;; esac
    done
  fi
  return 1
}

# looks_like_comment <line>: true when the line is (mostly) a comment.
looks_like_comment() {
  printf '%s' "$1" | grep -Eq '^[[:space:]]*(//|/\*|\*|#|--|<!--|;)' && return 0
  printf '%s' "$1" | grep -Eq '[[:space:]](//|#)[[:space:]]' && return 0
  return 1
}

# json_valid <file>: 0 valid, 1 invalid (message on stdout), 2 no parser available.
json_valid() {
  local f="$1" out
  if command -v node >/dev/null 2>&1; then
    out=$(node -e 'try{JSON.parse(require("fs").readFileSync(process.argv[1],"utf8").replace(/^\uFEFF/,""))}catch(e){console.log(e.message);process.exit(1)}' "$f" 2>&1) && return 0
    printf '%s\n' "$out"; return 1
  fi
  local py
  for py in python3 python; do
    if command -v "$py" >/dev/null 2>&1 && "$py" -c 'import json' >/dev/null 2>&1; then
      out=$("$py" -c 'import json,sys
try:
    json.load(open(sys.argv[1], encoding="utf-8-sig"))
except Exception as e:
    print(e); sys.exit(1)' "$f" 2>&1) && return 0
      printf '%s\n' "$out"; return 1
    fi
  done
  return 2
}
