# Decisions

<!-- Append-only, 날짜 · 제목. Format: .claude/studio/workflow.md → "Decisions log format".
     아래 첫 항목들은 스튜디오 도입 때 코드에 이미 반영된 결정을 기록한 것. -->

## 2026-11-07 · 게임 데이터는 Phaser 없는 순수 모듈로 둔다 (도입 시 기록)
- Context: 맵·몬스터·보스·여행 데이터가 커지면서 연결 오류(포탈, 스폰, 도달 가능성)가 잦아짐
- Decision: `src/data/`는 Phaser를 import하지 않고, `scripts/validate.mjs`가 Node에서 전부 검증
- Consequence: 새 데이터 필드는 같은 스토리에서 validate 규칙을 추가해야 함. 커밋 전 validate 자동 실행

## 2026-11-07 · 화면 텍스트는 i18n 키로만, 한글은 ko.js에만 (도입 시 기록)
- Context: 영어/한국어 동시 지원
- Decision: 데이터는 키만 저장, 화면은 `t(key)`. 한글은 `src/i18n/ko.js`에만. en/ko 키·플레이스홀더 일치를 validate가 검사
- Consequence: 새 텍스트는 en.js와 ko.js에 함께 추가. 스튜디오 훅도 ko.js 밖의 한글을 막음

## 2026-11-07 · 세이브는 localStorage 3슬롯, 스키마 v1 (도입 시 기록)
- Context: 이어하기와 여러 회차 지원
- Decision: 슬롯별 JSON, 위치는 좌표가 아닌 `spawnId`, 손상 슬롯은 자동 삭제하지 않음, 레거시 세이브는 부팅 시 1회 변환
- Consequence: 스키마 변경은 버전 올림 + 마이그레이션 필수 (항상 확인 목록)

## 2026-11-07 · 보스 패턴은 데이터 → 순수 두뇌 → 실행기 → 루프로 분리 (도입 시 기록)
- Context: 보스 공격을 공정하고 튜닝 가능하게
- Decision: `bossPatterns.js` → `BossBrain.js`(순수, 시드 테스트) → `PatternExecutor.js` → `PatternBoss.js`, 시간은 프레임 델타 시계
- Consequence: 공정성 규칙(텔레그래프 최소치 등)은 validate와 브라우저 테스트로 강제. 새 패턴은 시나리오 추가

## 2026-11-07 · 보스의 "처치 이력"과 "현재 생존"을 분리 (도입 시 기록)
- Context: 보스 리스폰과 스토리 진행이 섞이면 플래그가 꼬임
- Decision: 스토리 진행은 영구 플래그, 생존 여부는 `lastDefeatedAt` + `respawnSec`로 벽시계 기준 계산
- Consequence: 첫 처치에서만 스토리 이벤트 실행

## 2026-11-07 · Claude Code 스튜디오 워크플로 도입
- Context: 브랜치 충돌과 채팅/코드 간 기획 분산
- Decision: 스토리 1개 = 브랜치 1개 = PR 1개, main 직접 커밋 차단, 기획 문서는 docs/BRIEF·BACKLOG·DECISIONS, 작업 스펙은 docs/specs (gitignore)
- Consequence: CLAUDE.md는 시스템 설명의 기준으로 유지. GAME_DESIGN.md와 docs/STORY.md(v0.4)는 과거 자료로만 취급
