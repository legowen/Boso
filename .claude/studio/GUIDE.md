# Studio Template 사용 가이드

1인 개발용 Claude Code 스튜디오 템플릿입니다. 게임이든 앱이든, 엔진이 무엇이든 같은
흐름(기획 → 스펙 → 계획 → 구현 → 검증 → 플레이테스트 → 완료)으로 작업하고, 엔진별
지식은 **플랫폼 팩**으로 갈아 끼웁니다.

[Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)의
구조와 아이디어(역할별 에이전트, 경로별 규칙, 훅, "실행해서 직접 본다" 원칙,
최소 문서 기본값)를 참고해서 새로 작성했습니다.

| | 원본 | 이 템플릿 |
|---|---|---|
| 에이전트 | 49개 (엔진 3종 고정) | 코어 14개 + 팩별 전문가 1개 |
| 스킬 | 74개 | 17개 |
| 엔진 | Godot / Unity / Unreal | 팩으로 추가: web-phaser, unity, godot, mobile-expo, `/new-pack`으로 확장 |
| 기본 진행 방식 | 매 단계 확인 | 자율 (되돌릴 수 없는 일만 확인) |
| 의존성 | Bash + Python + jq | Bash만 (Git Bash로 충분) |

---

## 1. 준비물

- **Git for Windows** (Git Bash 포함). 훅과 스크립트가 bash로 돌아갑니다.
- **Claude Code** (데스크톱 앱 또는 CLI)
- 팩별: web-phaser / mobile-expo → Node.js, unity → Unity 에디터, godot → `godot` 실행 파일
- 선택: 플레이테스트 스크린샷용 Playwright (`npm i -D playwright && npx playwright install chromium`),
  PR 자동 생성용 GitHub CLI (`gh`)

Claude Code는 반드시 **프로젝트 루트 폴더**(CLAUDE.md가 있는 곳)에서 여세요. 하위 폴더에서
열면 훅과 권한 규칙이 적용되지 않습니다.

## 2. 새 프로젝트 시작

1. 이 템플릿 폴더를 통째로 복사해서 새 이름으로 만듭니다
   (GitHub에 올렸다면 "Use this template"으로 새 레포 생성).
2. 새 폴더를 Claude Code로 엽니다.
3. `/start` → 게임/앱, 팩, 자율 수준, 문서 수준을 고르면 설정과 기본 문서가 만들어집니다.
4. **새 세션을 시작**합니다 (팩 에이전트는 세션 시작 때 로드됨).
5. `/brainstorm` (아이디어가 없을 때) 또는 `/spec <기능>` (있을 때)

## 3. 기존 프로젝트에 적용 (예: Boso)

1. 템플릿의 `.claude/` 폴더를 프로젝트 루트에 복사합니다. 프로젝트에 이미 `.claude/`가
   있으면 겹치는 파일은 덮지 말고 알려주세요 (`/adopt`가 병합합니다).
2. 템플릿 `.gitignore`의 studio 부분과 `.gitattributes` 내용은 `/adopt`가 병합합니다.
   CLAUDE.md는 **복사하지 마세요** (기존 것을 유지하고 `/adopt`가 필요한 줄만 추가합니다).
3. 프로젝트를 Claude Code로 열고 `/adopt`
   - 스택 감지, 기존 문서·검증 스크립트·브랜치 규칙 파악
   - 적용 계획을 보여주고 **승인 후에만** `chore/adopt-studio` 브랜치에서 적용
   - 기존 기획 문서를 바탕으로 brief/backlog/decisions 초안 작성 (추정한 줄은 `(inferred)` 표시)
4. 새 세션 → `/next`

## 4. 매일 쓰는 흐름

```
/next                           지금 어디까지 왔고 다음에 뭘 할지
/spec 몬스터 리스폰              기능 스펙 작성 (채팅에서 만든 스펙을 붙여넣어도 됨)
/plan-stories monster-respawn   스펙 → 작은 스토리들 (S-###), 스토리 1개 = 브랜치 1개
/build S-012                    브랜치 생성 → 구현 → 체크 → 적대적 검증 → (보이는 변경이면) 플레이테스트
                                → 실패하면 최대 3회 수정 루프 → 자율 모드면 /done까지 이어서 진행
/done                           증거 확인 → 리뷰 → 백로그 체크 → 기능 브랜치에 커밋 → (승인 시) push + PR
```

채팅(claude.ai)에서 기획한 내용은 `/spec`에 그대로 붙여넣으면 템플릿 형식의 스펙이
됩니다. 이후 수정은 레포 안의 문서에서 합니다 (한 곳에서만 관리).

## 5. 명령어

| 명령 | 용도 |
|---|---|
| `/start` | 새 프로젝트 설정 |
| `/adopt` | 기존 프로젝트에 적용 |
| `/next` | 현재 상태와 다음 한 걸음 |
| `/brainstorm` | 컨셉 3안 → 1페이지 brief |
| `/spec` | 기능 스펙 (아이디어 또는 붙여넣은 스펙) |
| `/plan-stories` | 스펙 → 스토리, 백로그 정리 |
| `/build` | 스토리 하나를 끝까지 구현·검증 |
| `/qa` | 수정 없이 적대적 검증만 |
| `/playtest` | 실행해서 스크린샷 찍고 확인 |
| `/code-review` | diff 리뷰 (한 브랜치 한 관심사, 규칙, 충돌 위험) |
| `/done` | 스토리 마감·커밋·(승인 시) PR |
| `/bug-report` | 버그를 재현 절차와 함께 백로그에 등록 |
| `/asset-spec` | 스프라이트·사운드 명세와 생성 프롬프트 |
| `/balance` | 데이터 기반 밸런스 분석 |
| `/release` | 버전·패치노트·체크리스트 (배포는 직접) |
| `/new-pack` | 새 엔진/플랫폼 팩 만들기 (Flutter, Unreal 등) |
| `/studio-sync` | 템플릿 개선사항을 프로젝트로 가져오기 |

## 6. 에이전트

| 역할 | 에이전트 |
|---|---|
| 기획·방향 | producer, creative-director, technical-director |
| 디자인 | game-designer, narrative-designer, ux-designer, art-director, audio-designer |
| 구현 | developer, backend-engineer, + 팩 전문가 (phaser-specialist, unity-specialist, godot-specialist, mobile-specialist) |
| 검증 | qa-validator (수정 권한 없음), code-reviewer (수정 권한 없음), playtester |
| 출시 | release-manager |

자세한 내용: `.claude/studio/roster.md`

## 7. 설정 (`.claude/studio.yaml`)

| 키 | 기본값 | 의미 |
|---|---|---|
| `mode.automation` | autonomous | autonomous: 기능 브랜치 안에서 알아서 진행, 아래 "항상 확인" 목록만 물어봄 · guided: 스토리마다 계획을 보여주고 대기 · ask-first: 모든 쓰기 전에 확인 |
| `mode.rigor` | minimal | minimal: brief 1장 + 필요할 때만 스펙 · standard: 스펙·디렉터 리뷰 추가 |
| `language.*` | ko / ko / en / en | 대화 / 기획 문서 / 코드·주석·커밋 / 게임 내 텍스트 |
| `git.block_commit_on_main` | true | main 직접 커밋 차단 |
| `git.validate_on_commit` | true | 커밋 전에 `checks.validate` 실행 |
| `git.auto_push` | false | push·PR은 물어보고 진행 |
| `checks.*` | 팩 기본값 | validate / test / build / lint / run 명령. 비어 있으면 "NOT CONFIGURED"로 표시 (통과로 치지 않음) |
| `paths.*` | 팩 기본값 | 코드·데이터·에셋·다국어 문자열 위치 |
| `art.style`, `art.pipeline` | 비어 있음 | 에셋 명세와 생성 프롬프트에 사용 |

변경: `bash .claude/scripts/config.sh set mode.rigor standard` (또는 Claude에게 부탁)

**항상 확인하는 일** (모든 모드): push·PR·main 병합, 이 작업이 만들지 않은 파일 삭제,
의존성 추가/변경, `.claude/`·CLAUDE.md·CI·배포 설정 변경, 세이브 데이터 형식 변경,
비용·인증정보·배포가 걸린 일, 스펙에 없는 플레이어 경험 결정.

**자율 모드 팁:** 파일 수정 때마다 권한 창이 뜨면 Claude Code에서 "Accept edits" 모드로
바꾸거나, 이 PC에서만 쓰는 `.claude/settings.local.json`에
`{"permissions": {"defaultMode": "acceptEdits"}}`를 넣으세요. 위험한 명령은 훅과 deny 규칙이 막습니다.

## 8. 자동 안전장치 (훅)

| 훅 | 동작 |
|---|---|
| 세션 시작 | 프로젝트·브랜치·진행 중 스토리 요약, compact 후에는 `.claude/state/active.md` 복원 |
| git 가드 | force push 차단 · push/PR은 확인 · main 커밋 차단 · 코드에 한글/CJK 주석이 들어간 커밋 차단 · 깨진 JSON 커밋 차단 · `checks.validate` 실패 시 커밋 차단 |
| 편집 직후 검사 | 새로 쓴 코드의 한글 주석, 게임 데이터의 언어, JSON 문법을 즉시 알려줌 |

게임 내 텍스트를 한국어로 만드는 프로젝트라면 `language.ingame: ko`로 바꾸세요. 그러면
코드 안 문자열은 허용하고 한글 **주석**만 잡습니다. 번역 파일 폴더는 `paths.i18n`에 적으면 검사에서 빠집니다.

## 9. 플랫폼 팩

```
bash .claude/scripts/pack.sh list              # 목록
bash .claude/scripts/pack.sh activate unity    # 켜기 (새 세션 필요)
bash .claude/scripts/pack.sh deactivate unity  # 끄기
bash .claude/scripts/pack.sh status            # 설치본이 팩 원본과 달라졌는지
```

- 게임 + 동반 앱처럼 팩 여러 개를 동시에 켤 수 있습니다.
- 새 엔진은 `/new-pack flutter`처럼 만들면 공식 문서를 조사해서 전문가 에이전트·규칙·체크 명령·출시 체크리스트를 채웁니다.

## 10. 템플릿을 계속 개선하기

이 폴더(템플릿 원본)를 개선하면, 각 게임 프로젝트에서 `/studio-sync ../studio-template`로
가져옵니다. 프로젝트 설정(`studio.yaml`), 문서(`design/`), CLAUDE.md는 건드리지 않고
프레임워크 파일만 갱신하며, 먼저 변경 목록을 보여준 뒤 승인 시 적용합니다.

템플릿 원본에서는 팩을 활성화하지 마세요 (활성화하면 팩 에이전트가 코어 에이전트로 복사되어 동기화될 때 섞입니다).

## 11. 셀프 테스트

```
bash .claude/scripts/selftest.sh          # 전체 (훅·팩 활성화 시뮬레이션 포함, 몇 초)
bash .claude/scripts/selftest.sh --quick  # 구조·문법만
```

스크립트·훅·에이전트·스킬을 고친 뒤에 실행하세요.

## 12. 사용량 절약

- 에이전트 파일의 `model:` 값이 비용을 결정합니다. 디렉터는 `inherit`(세션 모델),
  구현·검증은 `sonnet`, 리뷰는 `haiku`가 기본입니다.
- 한 세션 동안 모든 서브에이전트를 한 모델로 고정하려면 Claude Code 시작 전에 환경 변수
  `CLAUDE_CODE_SUBAGENT_MODEL=sonnet`을 설정하세요.
- `/build` 한 번이 구현·검증·플레이테스트 에이전트를 차례로 부릅니다. 작은 수정은
  스킬 없이 그냥 요청하는 편이 쌉니다.

## 13. 폴더 구조

```
CLAUDE.md                     프로젝트 메모 + Stack 블록 + 스튜디오 규칙 import
design/                       brief.md, backlog.md, decisions.md, specs/ (specs는 기본 gitignore)
.claude/
  studio.yaml                 설정 (유일한 설정 파일)
  settings.json               훅과 권한
  studio/                     운영 규칙, 워크플로, 로스터, 실행·관찰 절차, 템플릿, 이 가이드
  agents/                     코어 에이전트 (+ 활성 팩 전문가)
  skills/                     슬래시 명령
  rules/                      경로별 규칙 (+ 활성 팩 규칙: <pack>.<name>.md)
  hooks/                      세션 시작, git 가드, 편집 후 검사
  scripts/                    config, pack, run-check, status, sync, selftest, capture-web
  packs/                      web-phaser, unity, godot, mobile-expo, _template
  state/                      로컬 작업 상태 (gitignore): active.md, 체크 로그, 플레이테스트 증거
```

## 출처

구조와 여러 원칙은 Donchitos의 Claude Code Game Studios (MIT License)를 참고했습니다.
자세한 내용은 `.claude/studio/CREDITS.md`.
