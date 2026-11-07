#!/usr/bin/env bash
# pack.sh — manage platform packs (.claude/packs/<name>/).
#   list                  available packs and which are active
#   activate <name>       install the pack's agents, rules and skills; fill empty
#                         checks/paths from its pack.yaml; rebuild the Stack block
#                         in CLAUDE.md
#   deactivate <name>     remove what activate installed; rebuild the Stack block
#   new <name>            scaffold a new pack from .claude/packs/_template
#   stack                 rebuild the Stack block in CLAUDE.md from active packs
#   status                active packs and whether installed copies drifted
# Agents load when a session starts: start a new session after activate/deactivate.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"
ROOT="$(studio_root)" || { echo "pack: cannot find .claude/studio.yaml" >&2; exit 1; }
PACKS="$ROOT/.claude/packs"
CFG="$ROOT/.claude/studio.yaml"

die() { echo "pack: $*" >&2; exit 1; }
active_packs() { list_items "$(cfg_get packs "$CFG" 2>/dev/null || echo '[]')"; }
is_active() { active_packs | grep -qxF "$1"; }
pack_dir() { [ -f "$PACKS/$1/pack.yaml" ] || die "no pack named '$1' (see: pack.sh list)"; printf '%s\n' "$PACKS/$1"; }

rebuild_stack() {
  local md="$ROOT/CLAUDE.md" tmp block p
  [ -f "$md" ] || { echo "note: no CLAUDE.md; Stack block not written"; return 0; }
  if ! grep -q '<!-- studio:stack:start -->' "$md" || ! grep -q '<!-- studio:stack:end -->' "$md"; then
    echo "note: CLAUDE.md has no studio:stack markers; Stack block not written (/adopt adds them)"
    return 0
  fi
  block="$ROOT/.claude/state/.stack.$$"
  mkdir -p "$ROOT/.claude/state"
  : > "$block"
  for p in $(active_packs); do
    if [ -f "$PACKS/$p/STACK.md" ]; then cat "$PACKS/$p/STACK.md" >> "$block"; echo >> "$block"; fi
  done
  [ -s "$block" ] || echo "No platform pack is active yet." > "$block"
  tmp="$md.tmp.$$"
  awk -v blockfile="$block" '
    /<!-- studio:stack:start -->/ { print; while ((getline l < blockfile) > 0) print l; skip = 1; next }
    /<!-- studio:stack:end -->/ { skip = 0 }
    !skip { print }
  ' "$md" > "$tmp" && mv "$tmp" "$md"
  rm -f "$block"
  echo "CLAUDE.md Stack block rebuilt"
}

fill_from_pack() {
  local dir="$1" key cur val
  for key in checks.validate checks.test checks.build checks.lint checks.run paths.code paths.data paths.assets paths.i18n; do
    val=$(cfg_get "$key" "$dir/pack.yaml" 2>/dev/null || true)
    [ -n "$val" ] || continue
    cur=$(cfg_get "$key" "$CFG" 2>/dev/null || true)
    if [ -z "$cur" ]; then
      cfg_set "$key" "$val" "$CFG" && echo "  set $key = $val"
    elif [ "$cur" != "$val" ]; then
      echo "  kept $key = $cur   (pack suggests: $val)"
    fi
  done
}

cmd="${1:-}"; shift || true
case "$cmd" in
  list)
    for d in "$PACKS"/*/; do
      n=$(basename "$d"); case "$n" in _*) continue ;; esac
      [ -f "$d/pack.yaml" ] || continue
      mark="  "; is_active "$n" && mark="* "
      printf '%s%-14s %s\n' "$mark" "$n" "$(cfg_get pack.description "$d/pack.yaml" 2>/dev/null)"
    done
    echo "(* = active)" ;;

  activate)
    [ $# -eq 1 ] || die "usage: pack.sh activate <name>"
    name="$1"; dir=$(pack_dir "$name") || exit 1
    echo "Activating pack: $name"
    mkdir -p "$ROOT/.claude/agents" "$ROOT/.claude/rules" "$ROOT/.claude/skills"
    was_active=no; is_active "$name" && was_active=yes
    # install <src> <dest> <label>: copy, but never clobber a local edit or a
    # file that belongs to something else.
    install() {
      if [ ! -f "$2" ] || cmp -s "$1" "$2"; then cp "$1" "$2" && echo "  $3"
      elif [ "$was_active" = yes ]; then echo "  $3 (kept your local edits; pack.sh status shows drift)"
      else die "$(basename "$2") already exists and is not from pack '$name'; rename one of them first"
      fi
    }
    for f in "$dir"/agents/*.md; do
      [ -f "$f" ] || continue
      install "$f" "$ROOT/.claude/agents/$(basename "$f")" "agent  $(basename "$f")"
    done
    for f in "$dir"/rules/*.md; do
      [ -f "$f" ] || continue
      install "$f" "$ROOT/.claude/rules/$name.$(basename "$f")" "rule   $name.$(basename "$f")"
    done
    if [ -d "$dir/skills" ]; then
      for s in "$dir"/skills/*/; do
        [ -f "$s/SKILL.md" ] || continue
        sn=$(basename "$s")
        rm -rf "$ROOT/.claude/skills/$sn" && cp -R "$s" "$ROOT/.claude/skills/$sn" && echo "  skill  /$sn"
      done
    fi
    bash "$HERE/config.sh" add packs "$name" >/dev/null && echo "  packs  += $name"
    fill_from_pack "$dir"
    rebuild_stack
    echo "Done. Start a new Claude Code session so the new agents load." ;;

  deactivate)
    [ $# -eq 1 ] || die "usage: pack.sh deactivate <name>"
    name="$1"; dir=$(pack_dir "$name") || exit 1
    for f in "$dir"/agents/*.md; do [ -f "$f" ] && rm -f "$ROOT/.claude/agents/$(basename "$f")" && echo "  removed agent $(basename "$f")"; done
    for f in "$ROOT"/.claude/rules/"$name".*.md; do [ -f "$f" ] && rm -f "$f" && echo "  removed rule $(basename "$f")"; done
    if [ -d "$dir/skills" ]; then
      for s in "$dir"/skills/*/; do sn=$(basename "$s"); [ -d "$ROOT/.claude/skills/$sn" ] && rm -rf "$ROOT/.claude/skills/$sn" && echo "  removed skill /$sn"; done
    fi
    bash "$HERE/config.sh" remove packs "$name" >/dev/null && echo "  packs  -= $name"
    echo "  note: checks.* and paths.* were left as they are; edit .claude/studio.yaml if they came from this pack"
    rebuild_stack ;;

  new)
    [ $# -eq 1 ] || die "usage: pack.sh new <name>   (lowercase, dashes)"
    name="$1"
    printf '%s' "$name" | grep -Eq '^[a-z0-9][a-z0-9-]*$' || die "pack names are lowercase letters, digits and dashes"
    [ -e "$PACKS/$name" ] && die "pack '$name' already exists"
    cp -R "$PACKS/_template" "$PACKS/$name"
    for f in $(find "$PACKS/$name" -type f); do
      sed "s/__PACK__/$name/g" "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    done
    if [ -f "$PACKS/$name/agents/__PACK__-specialist.md" ]; then
      mv "$PACKS/$name/agents/__PACK__-specialist.md" "$PACKS/$name/agents/$name-specialist.md"
    fi
    echo "Created .claude/packs/$name — fill in pack.yaml, STACK.md, agents/, rules/, release.md"
    find "$PACKS/$name" -type f | sed "s#^$ROOT/#  #" ;;

  stack) rebuild_stack ;;

  status)
    act=$(active_packs)
    [ -n "$act" ] || { echo "No active packs."; exit 0; }
    for p in $act; do
      echo "$p"
      [ -d "$PACKS/$p" ] || { echo "  MISSING pack folder .claude/packs/$p"; continue; }
      for f in "$PACKS/$p"/agents/*.md; do
        [ -f "$f" ] || continue
        d="$ROOT/.claude/agents/$(basename "$f")"
        if [ ! -f "$d" ]; then echo "  agent $(basename "$f"): NOT INSTALLED"
        elif cmp -s "$f" "$d"; then echo "  agent $(basename "$f"): ok"
        else echo "  agent $(basename "$f"): modified locally"; fi
      done
      for f in "$PACKS/$p"/rules/*.md; do
        [ -f "$f" ] || continue
        d="$ROOT/.claude/rules/$p.$(basename "$f")"
        if [ ! -f "$d" ]; then echo "  rule $(basename "$f"): NOT INSTALLED"
        elif cmp -s "$f" "$d"; then echo "  rule $(basename "$f"): ok"
        else echo "  rule $(basename "$f"): modified locally"; fi
      done
    done ;;

  *) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
