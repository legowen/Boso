#!/usr/bin/env bash
# selftest.sh — checks the studio framework itself (not the game).
#   structure, agent/skill/rule frontmatter, packs, settings.json, shell syntax and
#   line endings, config round trips, hook behaviour and pack activation in a
#   throwaway copy of the project.
# Usage: selftest.sh [--quick]   (--quick skips the hook and pack simulations)
# Exit 0 when nothing FAILs.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=lib.sh
. "$HERE/lib.sh"
ROOT="$(studio_root)" || { echo "selftest: cannot find .claude/studio.yaml" >&2; exit 2; }
C="$ROOT/.claude"
QUICK=no; [ "${1:-}" = "--quick" ] && QUICK=yes
pass=0; fail=0; warn=0
ok()   { pass=$((pass+1)); }
bad()  { fail=$((fail+1)); echo "FAIL  $*"; }
note() { warn=$((warn+1)); echo "WARN  $*"; }

fm() { # fm <file> <key>: frontmatter value
  awk -v k="$2" 'NR==1 && $0!="---" {exit} NR>1 && $0=="---" {exit} NR>1 { if (index($0, k":")==1) { v=substr($0, length(k)+2); sub(/^[ \t]+/, "", v); gsub(/^"|"$/, "", v); print v; exit } }' "$1"
}

echo "== structure"
for f in studio.yaml settings.json studio/STUDIO.md studio/workflow.md studio/roster.md studio/run-and-observe.md \
         scripts/lib.sh scripts/config.sh scripts/pack.sh scripts/run-check.sh scripts/status.sh scripts/sync.sh scripts/capture-web.mjs \
         hooks/session-start.sh hooks/guard-git.sh hooks/check-edit.sh packs/_template/pack.yaml; do
  [ -f "$C/$f" ] && ok || bad "missing .claude/$f"
done
grep -q '@\.claude/studio/STUDIO\.md' "$ROOT/CLAUDE.md" 2>/dev/null && ok || bad "CLAUDE.md does not import .claude/studio/STUDIO.md"

echo "== agents"
VALID_TOOLS=" Read Glob Grep Write Edit Bash Agent WebSearch WebFetch AskUserQuestion NotebookEdit TodoWrite PowerShell "
all_agents=""
for f in "$C"/agents/*.md "$C"/packs/*/agents/*.md; do
  [ -f "$f" ] || continue
  case "$f" in */packs/_template/*) continue ;; esac
  n=$(fm "$f" name); d=$(fm "$f" description); m=$(fm "$f" model); t=$(fm "$f" tools)
  stem=$(basename "$f" .md)
  [ "$n" = "$stem" ] && ok || bad "$f: name '$n' does not match file name"
  [ -n "$d" ] && ok || bad "$f: empty description"
  case "$m" in ""|inherit|sonnet|opus|haiku) ok ;; *) bad "$f: unknown model '$m'" ;; esac
  for tool in $(printf '%s' "$t" | tr ',' ' '); do
    case "$VALID_TOOLS" in *" $tool "*) ok ;; *) bad "$f: unknown tool '$tool'" ;; esac
  done
  grep -q '^## Studio contract' "$f" && ok || bad "$f: missing Studio contract section"
  case "$f" in "$C"/packs/*) ;; *) all_agents="$all_agents $n" ;; esac
done
pack_agents=""
for f in "$C"/packs/*/agents/*.md; do
  case "$f" in */packs/_template/*) continue ;; esac
  [ -f "$f" ] && pack_agents="$pack_agents $(fm "$f" name)"
done
dups=$(printf '%s\n' $all_agents $pack_agents | sort | uniq -d | sort -u)
for dname in $dups; do
  # an installed pack agent appears twice (pack source + installed copy): allowed
  cnt=$(ls "$C"/packs/*/agents/"$dname".md 2>/dev/null | wc -l)
  [ -f "$C/agents/$dname.md" ] && [ "$cnt" -eq 1 ] && continue
  bad "agent name '$dname' is defined more than once"
done

echo "== skills"
# Names Claude Code itself uses for built-in commands (a skill with the same name is shadowed or ambiguous).
RESERVED=" add-dir agents bug clear compact config context cost doctor exit export feedback help hooks ide init install-github-app login logout mcp memory model output-style permissions plan plugin pr-comments privacy-settings release-notes resume review rewind sandbox security-review stats status statusline terminal-setup todos upgrade usage verify vim "
for d in "$C"/skills/*/ "$C"/packs/*/skills/*/; do
  [ -d "$d" ] || continue
  s="$d/SKILL.md"; sn=$(basename "$d")
  case "$RESERVED" in *" $sn "*) bad "skill /$sn collides with a built-in Claude Code command name; rename it" ;; esac
  [ -f "$s" ] || { bad "$d has no SKILL.md"; continue; }
  [ "$(fm "$s" name)" = "$sn" ] && ok || bad "$s: name does not match folder"
  [ -n "$(fm "$s" description)" ] && ok || bad "$s: empty description"
  for ref in $(grep -oE '\*\*[a-z]+(-[a-z]+)+\*\*|\*\*(producer|developer|playtester)\*\*' "$s" | tr -d '*' | sort -u); do
    case " $all_agents $pack_agents " in *" $ref "*) ok ;; *) bad "$s: refers to unknown agent '$ref'" ;; esac
  done
done

echo "== rules"
for f in "$C"/rules/*.md "$C"/packs/*/rules/*.md; do
  [ -f "$f" ] || continue
  head -1 "$f" | grep -q '^---$' && grep -q '^paths:' "$f" && ok || bad "$f: missing paths frontmatter"
done

echo "== packs"
for d in "$C"/packs/*/; do
  p=$(basename "$d"); case "$p" in _*) continue ;; esac
  [ -f "$d/pack.yaml" ] || { bad "pack $p: no pack.yaml"; continue; }
  [ "$(cfg_get pack.name "$d/pack.yaml")" = "$p" ] && ok || bad "pack $p: pack.name differs from folder"
  [ -n "$(cfg_get pack.description "$d/pack.yaml")" ] && ok || bad "pack $p: empty description"
  for f in STACK.md release.md; do [ -f "$d/$f" ] && ok || bad "pack $p: missing $f"; done
  ls "$d"/agents/*.md >/dev/null 2>&1 && ok || bad "pack $p: no agent"
  grep -q "$p" "$C/studio/roster.md" && ok || note "pack $p is not listed in studio/roster.md"
done
for p in $(list_items "$(cfg_get packs)"); do
  [ -f "$C/packs/$p/pack.yaml" ] && ok || bad "active pack '$p' has no folder in .claude/packs"
done

echo "== references"
for f in "$C"/studio/*.md "$C"/agents/*.md "$C"/skills/*/SKILL.md "$C"/rules/*.md "$C"/packs/*/*.md "$C"/packs/*/agents/*.md "$ROOT/CLAUDE.md"; do
  [ -f "$f" ] || continue
  case "$f" in */packs/_template/*) continue ;; esac
  for ref in $(grep -oE '\.claude/[A-Za-z0-9_./-]+\.(md|sh|mjs|yaml|json)' "$f" | sort -u); do
    case "$ref" in .claude/state/*|.claude/settings.local.json) continue ;; esac  # created at runtime
    [ -e "$ROOT/$ref" ] && ok || bad "$f refers to missing $ref"
  done
done

echo "== settings and shell"
msg=$(json_valid "$C/settings.json"); rc=$?
case $rc in 0) ok ;; 1) bad "settings.json invalid: $msg" ;; 2) note "no JSON parser (node/python) to check settings.json" ;; esac
for h in $(grep -oE '\.claude/hooks/[a-z0-9-]+\.sh' "$C/settings.json" | sort -u); do
  [ -f "$ROOT/$h" ] && ok || bad "settings.json references missing $h"
done
for f in "$C"/scripts/*.sh "$C"/hooks/*.sh; do
  bash -n "$f" 2>/dev/null && ok || bad "syntax error in $f"
done
for f in "$C"/scripts/*.sh "$C"/hooks/*.sh "$C"/scripts/*.mjs; do
  if LC_ALL=C grep -q $'\r' "$f"; then bad "$f has CRLF line endings (run: git add --renormalize .)"; else ok; fi
done

if git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  ignored=$(cd "$ROOT" && find .claude CLAUDE.md -type f 2>/dev/null | grep -v '^\.claude/state/' | grep -v '^\.claude/settings\.local\.json$' | git check-ignore --stdin 2>/dev/null || true)
  if [ -n "$ignored" ]; then
    printf '%s\n' "$ignored" | head -5 | while IFS= read -r f; do echo "FAIL  .gitignore hides framework file $f"; done
    fail=$((fail + 1))
  else ok; fi
fi

[ "$QUICK" = yes ] && { echo "RESULT: $pass passed, $fail failed, $warn warnings (quick)"; [ $fail -eq 0 ]; exit; }

echo "== simulation (throwaway copy)"
T=$(mktemp -d 2>/dev/null || mktemp -d -t studio)
trap 'rm -rf "$T"' EXIT
mkdir -p "$T/p" && cp -R "$C" "$T/p/.claude" && cp "$ROOT/CLAUDE.md" "$T/p/CLAUDE.md"
rm -rf "$T/p/.claude/state" && mkdir -p "$T/p/.claude/state"
# reset to template defaults so the simulation does not depend on this project's settings
for p in $(list_items "$(cfg_get packs "$T/p/.claude/studio.yaml")"); do STUDIO_ROOT="$T/p" bash "$T/p/.claude/scripts/pack.sh" deactivate "$p" >/dev/null 2>&1; done
for kv in "git.main_branch=main" "git.branch_prefix=feat/" "git.block_commit_on_main=true" "git.validate_on_commit=true" \
          "git.auto_push=false" "language.code=en" "language.ingame=en" "checks.validate=" "paths.data=" "paths.i18n="; do
  cfg_set "${kv%%=*}" "${kv#*=}" "$T/p/.claude/studio.yaml" || bad "cannot reset ${kv%%=*} in the copy"
done
export STUDIO_ROOT="$T/p" CLAUDE_PROJECT_DIR="$T/p"
cd "$T/p" || exit 1
git init -q -b main . && git config user.email selftest@local && git config user.name selftest
git add -A >/dev/null 2>&1 && git commit -qm "init" >/dev/null 2>&1 || bad "could not create the test repository"

hook() { # hook <script> <expected-exit> <description> <json>
  local out rc
  out=$(printf '%s' "$4" | bash ".claude/hooks/$1" 2>&1); rc=$?
  if [ "$rc" = "$2" ]; then ok; else bad "hook $1: $3 (expected exit $2, got $rc) ${out:0:160}"; fi
}
J() { printf '{"tool_name":"%s","tool_input":{"command":"%s"}}' "$1" "$2"; }

echo x > a.js && git add a.js
hook guard-git.sh 2 "commit on main is blocked" "$(J Bash 'git commit -m \"feat: x\"')"
hook guard-git.sh 0 "git log mentioning commit is allowed" "$(J Bash 'git log --grep commit')"
hook guard-git.sh 0 "non-git command is allowed" "$(J Bash 'ls -la')"
git switch -qc feat/selftest
printf '// \xed\x95\x9c\xea\xb8\x80 comment\nconst a = 1;\n' > a.js && git add a.js
hook guard-git.sh 2 "CJK comment in code is blocked" "$(J Bash 'git commit -m \"feat: x\"')"
printf '// english comment\nconst a = 1;\n' > a.js && git add a.js
hook guard-git.sh 0 "clean commit on a feature branch is allowed" "$(J Bash 'git add -A && git commit -m \"feat: x\"')"
hook guard-git.sh 0 "PowerShell clean commit is allowed" "$(J PowerShell 'git commit -m \"feat: x\"')"
if command -v node >/dev/null 2>&1 || python3 -c 'import json' >/dev/null 2>&1; then
  printf '{"a": 1,}' > bad.json && git add bad.json
  hook guard-git.sh 2 "invalid staged JSON is blocked" "$(J Bash 'git commit -m \"feat: x\"')"
  git rm -q --cached bad.json && rm -f bad.json
else
  note "no JSON parser: skipped the invalid-JSON hook test"
fi
cfg_set checks.validate "exit 4" "$T/p/.claude/studio.yaml"
hook guard-git.sh 2 "failing checks.validate blocks the commit" "$(J Bash 'git commit -m \"feat: x\"')"
cfg_set checks.validate "" "$T/p/.claude/studio.yaml"
hook guard-git.sh 2 "force push is blocked" "$(J Bash 'git push --force origin feat/selftest')"
hook guard-git.sh 2 "+refspec push is blocked" "$(J Bash 'git push origin +feat/selftest')"
out=$(J Bash 'git push -u origin feat/selftest' | bash .claude/hooks/guard-git.sh 2>&1)
printf '%s' "$out" | grep -q '"permissionDecision":"ask"' && ok || bad "normal push should ask (got: ${out:0:120})"

W() { printf '{"tool_name":"%s","tool_input":{"file_path":"%s","%s":"%s"}}' "$1" "$2" "$3" "$4"; }
hook check-edit.sh 2 "CJK comment written to code is reported" "$(W Write "$T/p/src/x.js" content '// 한글\nconst x = 1;')"
hook check-edit.sh 0 "English code passes" "$(W Write "$T/p/src/x.js" content '// move\nconst x = 1;')"
hook check-edit.sh 0 "Korean in design docs passes" "$(W Edit "$T/p/design/brief.md" new_string '한글')"
hook check-edit.sh 0 "files outside the project are ignored" "$(W Edit "/somewhere/else/x.js" new_string '// 한')"
if command -v node >/dev/null 2>&1 || python3 -c 'import json' >/dev/null 2>&1; then
  mkdir -p src/data && printf '{"a":1' > src/data/m.json
  hook check-edit.sh 2 "invalid JSON after edit is reported" "$(W Write "$T/p/src/data/m.json" content '{')"
  rm -f src/data/m.json
fi
cfg_set language.ingame ko "$T/p/.claude/studio.yaml"
hook check-edit.sh 0 "Korean string literal allowed when in-game language is ko" "$(W Write "$T/p/src/x.js" content 'const t = \"한글\";')"
hook check-edit.sh 2 "Korean comment still reported when in-game language is ko" "$(W Write "$T/p/src/x.js" content 'const t = 1; // 한글')"
cfg_set language.ingame en "$T/p/.claude/studio.yaml"
out=$(printf '{"source":"startup"}' | bash .claude/hooks/session-start.sh 2>&1)
printf '%s' "$out" | grep -q '^\[studio\]' && ok || bad "session-start prints no [studio] line"

echo "== config round trip"
cfg_set art.style 'pixel "art" # not a comment' "$T/p/.claude/studio.yaml"
[ "$(cfg_get art.style "$T/p/.claude/studio.yaml")" = 'pixel "art" # not a comment' ] && ok || bad "config set/get round trip"
bash .claude/scripts/config.sh add packs zzz >/dev/null && bash .claude/scripts/config.sh remove packs zzz >/dev/null
[ "$(cfg_get packs "$T/p/.claude/studio.yaml")" = "[]" ] && ok || bad "config add/remove list round trip"

echo "== pack activation"
for d in .claude/packs/*/; do
  p=$(basename "$d"); case "$p" in _*) continue ;; esac
  bash .claude/scripts/pack.sh activate "$p" >/dev/null 2>&1 || { bad "pack.sh activate $p failed"; continue; }
  for f in "$d"agents/*.md; do [ -f ".claude/agents/$(basename "$f")" ] && ok || bad "$p: agent $(basename "$f") not installed"; done
  for f in "$d"rules/*.md; do [ -f ".claude/rules/$p.$(basename "$f")" ] && ok || bad "$p: rule $(basename "$f") not installed"; done
  list_items "$(cfg_get packs)" | grep -qxF "$p" && ok || bad "$p not added to packs"
  grep -q "(pack: $p)" CLAUDE.md && ok || bad "$p: Stack block not written to CLAUDE.md"
  bash .claude/scripts/pack.sh deactivate "$p" >/dev/null 2>&1 || bad "pack.sh deactivate $p failed"
  for f in "$d"agents/*.md; do [ -f ".claude/agents/$(basename "$f")" ] && bad "$p: agent $(basename "$f") left after deactivate" || ok; done
  list_items "$(cfg_get packs)" | grep -qxF "$p" && bad "$p still listed after deactivate" || ok
done
grep -q 'No platform pack is active yet.' CLAUDE.md && ok || bad "Stack block not reset after deactivating every pack"
bash .claude/scripts/pack.sh new zz-test >/dev/null 2>&1 && [ -f .claude/packs/zz-test/agents/zz-test-specialist.md ] && ! grep -rq '__PACK__' .claude/packs/zz-test && ok || bad "pack.sh new did not scaffold cleanly"

echo "RESULT: $pass passed, $fail failed, $warn warnings"
[ $fail -eq 0 ]
