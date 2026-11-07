# Backlog

<!-- Format: .claude/studio/workflow.md → "Backlog format". Skills parse this file.
     ID와 슬러그는 영어(브랜치 이름), 설명과 AC는 한국어. -->

## Now

## Next
- [ ] S-001 tutorial-skip — 튜토리얼(Shelter Isle)을 이미 끝낸 플레이어가 새 게임에서 건너뛸 수 있다 · spec: 필요 (/spec tutorial-skip)
  - Open: "이미 끝낸"의 기준 (다른 슬롯의 `tutorialCompleted`? 전역 설정?), 건너뛸 때 시작 맵과 지급할 레벨/아이템
- [ ] S-002 shop-npc — 트릿으로 아이템을 사는 상점 NPC · spec: 필요 (/spec shop-npc)

## Later
- [ ] S-003 quest-types — 수집/호위 퀘스트와 지역 간 퀘스트 체인 · spec: 필요
- [ ] S-004 real-bgm — 준비된 BGM 키(docs/ASSETS.md)에 실제 음원 연결 · spec: 필요 (음원 출처·라이선스)
- [ ] S-005 animation-polish — 공격 등 중간 프레임 추가, NPC 개별 변형 · spec: 필요 (/asset-spec)

## Bugs
- [ ] B-001 bgm-missing-file-errors — BGM 파일이 없을 때 오디오 디코드 오류가 페이지 에러로 남음 (sev: minor)
  - Repro: `public/assets/bgm/` 없이 `npm run dev` → 타이틀 화면 로드
  - Expected: 파일이 없으면 조용히 건너뜀 (CLAUDE.md: "Missing audio file = silent no-op")
  - Actual: dev 서버가 없는 파일에 `200 text/html`(index.html)을 돌려주고, 8개 키 모두 "Unable to decode audio data" — uncaught page error 14건 (스튜디오 도입 때 capture-web.mjs로 발견)
  - Suspect: src/scenes/PreloadScene.js:63 (`bgmFilePaths`로 존재하지 않는 파일까지 요청)
  - AC: BGM 파일이 하나도 없을 때 타이틀 로드 시 오디오 관련 page error 0건 (capture-web.mjs의 errors 목록으로 확인)
  - AC: 파일을 넣은 키는 지금처럼 재생된다
  - AC: 테스트 또는 validate 규칙이 이 경우를 다룬다
  - Visible: no

## Done
