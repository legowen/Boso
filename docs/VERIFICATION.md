# 적대적 검증 보고서

## v0.6 Treats & Tasks 업데이트 검증 패스
- 자동 검증 976체크 통과 (기존 9그룹 + 신규: 퀘스트 무결성 — id 중복/
  실존 NPC giver/유효 타깃/보상 아이템 키, 드롭 테이블 — 범위/확률/아이템 키)
- vite build 에러 0
- 수동 트레이스 검증 및 수정:
  - **미드프레임 전환 가드**: Bark로 보스 막타 → 같은 프레임 엔딩 시작 시
    나머지 update 단계(핫키/상호작용)가 오버레이를 엔딩 위에 열 수 있던
    경로 차단 (isTransitioning 재확인)
  - 드롭 미끄러짐 방지 (setDragX), 토스트 스택 오프셋 (동시 표시 겹침 방지)
  - 프레임 순서: updateDialogue가 SPACE를 먼저 소비 → checkInteractions
    재오픈 불가 ✓; 드롭 타이머/barkReadyAt/MP리젠 일시정지 시프트 포함 ✓
  - updateBarks 중 killMonster/onBossDefeated 재진입 안전 (monsters 배열
    불변, boss null 가드) ✓; 사망 플레이어 줍기/물약/바크 전부 hp 가드 ✓
  - 구세이브 호환: characters.<id>에 treats/items/quests 없으면 기본값
    정규화 (getCharacter) ✓
  - 텍스처 키 4종(proj_bark/drop_*) 생성 크기 = ASSETS.md 표 일치 ✓

## v0.5 오픈월드 업데이트 검증 패스
- 자동 검증 915체크 통과 (11맵: 지지 규칙/로프 앵커/포탈 타깃/도달성 BFS
  루프 포함), vite build 에러 0
- 적대적 리뷰 (신규 델타 전체 트레이스) 발견 사항 전부 수정:
  - 월드맵 오버레이가 사망 화면/엔딩 위에 잔류 (update 게이트로 닫기 불가)
    → handlePlayerDeath/startEndingSequence에서 오버레이 강제 종료
  - 로보 windup 래틀 트윈이 넉백 변위를 상쇄 → 피격 시 windup 스태거
    (트윈 킬 + patrol 복귀 + 쿨다운)
  - 대화창이 HUD 상단 24px 가림 → 대화창 y 오프셋 상향
  - RESIZE 모드에서 오버레이가 구 뷰포트 크기로 잔류 → 리사이즈 시
    오버레이 자동 종료 (핸들러는 shutdown에서 해제)
  - 월드맵 뒤에서 대화가 보이지 않게 열리는 경로 차단
  - 스폰-포탈 여유 64px→90px+ 상향 (yard 스폰/부엌/복도 도착점),
    지하실 로보 스폰을 복도 도착점에서 이격
  - HUD 폭 380 (Lv 텍스트와 HP 수치 충돌 방지), EXP 바 최소 폭 가드
- 리뷰 클린 판정: JustDown 소비 순서(대화 재오픈 불가), charger 상태기계
  (넉백/월드바운드/일시정지 시프트), EXP 루프 종결성/영속 왕복,
  월드맵 레이아웃 11키 커버/엣지 dedupe/closet 게이트



## 2차 검증 패스 (Fable 5 재검토)
1차 수정 8건 전원 회귀 없음 확인 (Phaser 3.90 소스 레벨 검증:
Clock/TweenManager pause 시맨틱, Canvas 렌더러에서 postFX 안전성,
포탈 12쌍 도착 거리 전수 재계산). 추가 발견 및 수정:
- **B1**: 처치 프레임에 보스가 계속 행동 (접촉 데미지/패턴 발동) →
  handleTakingDamage 직후 defeated 재확인 + handleContactDamage/
  startPattern 가드
- **B2**: 벽시계(Date.now) AI 타이머가 일시정지를 무시 → 재개 시
  일시정지 시간만큼 몬스터/보스 타이머 시프트 (버스트 방지)
- **B3**: 사망 지연 1.5초 동안 죽은 플레이어가 공격 가능 →
  Player.update hp 가드 + 보스 handleTakingDamage에 hp 가드
  (엔딩과 사망 화면 동시 진행 경로 차단, handlePlayerDeath에
  isTransitioning 가드 추가)
- **B4**: repeat -1 트윈이 파괴된 대상에 계속 기록 →
  killTweensOf를 텔레그래프/먼지 파괴 경로 전체에 적용
- **B6**: 타이틀 화면 클릭+SPACE 중복 진입 → isStarting 가드
- 셧다운 시 time.paused/tweens 방어적 복원 (Clock은 restart를
  가로질러 유지되므로)
- **밸런스**: closet 공격 발판 580→560 (Brave Paw 제자리 공격 도달),
  fieldHug 안전지대를 플레이어 ±350px 내로 (항상 회피 가능),
  attic 우측 파리 스폰을 히든 포탈 leash 범위 밖으로 이동
- 홀드 SPACE 키 반복이 타이틀→캐릭터선택→스토리를 관통하는 문제 →
  씬 진입 입력 유예 + 스토리 진행 디바운스



## 자동 검증 (scripts/validate.mjs) — PASSED (548 checks)
- 7개 맵 전 필드/지면 규칙, 포탈 target 존재 & 대상 스폰 지지 플랫폼 확인
- 스폰/포탈/NPC/지상몬스터 지지 규칙 (220px 이내 플랫폼)
- yard 기점 도달성 BFS: 7/7 (히든 포탈 엣지 포함)
- 몬스터 5종 타입 정의 일치, 보스 2종 배치(attic=hugGuardian, closet=vacuumKing)
- 로프 앵커링(topY=플랫폼 표면, x가 플랫폼 범위 내), BGM 키 5종 registry 일치
- 컨벤션: src/ 내 한글 0건, console.log 0건

## 빌드 검증 — PASSED
- vite build 에러 0 (번들 ~1.56MB는 Phaser 자체 크기, 정상)

## 적대적 코드 리뷰 (서브에이전트) — 발견 8건 전부 수정 완료
1. **포탈 핑퐁**: playroom→hallway 복귀 스폰이 상단 포탈 위(10px) →
   스폰 80px 오프셋 + 맵 진입 후 700ms 전역 포탈 잠금 추가
2. **일시정지 중 보스 공격 판정**: physics만 pause → time.paused +
   tweens.pauseAll/resumeAll 추가 (텔레그래프/리스폰 타이머 동결)
3. **사망 화면 고정 1024x768 가정**: RESIZE 모드에서 오정렬 →
   scrollFactor(0) + 실시간 scale 크기로 재작성
4. **보스 처치 플래그 유실**: 사망 트윈 onComplete에서 onBossDefeated 호출 →
   die() 즉시 호출로 이동 (트윈 중 씬 전환에도 킬 인정, 엔딩 보장)
5. **몬스터 넉백 1프레임 무효화**: AI가 매 프레임 속도 덮어씀 →
   knockedUntil(250ms) 동안 AI 조향 정지
6. **죽어가는 몬스터 300ms 판정 잔존**: isDying 플래그로 이중 킬/접촉
   데미지/음수 HP바 차단, 리스폰 타이머 중복 방지
7. **사망한 플레이어 반복 피격**: 접촉 데미지에 player.hp>0 가드 +
   Player.takeDamage 재진입 가드
8. **캐릭터 선택 중복 진입**: isLaunching 가드 (fade 리스너 중첩 방지)

추가 수정 (suspicion 대응):
- 새 게임 시작 시 MAP_STATE(인메모리 몬스터 상태) 초기화 (freshRun 플래그)
- VacuumKing 호스 텍스처 클리핑 3px 보정, 보스 부양 고도 380→430
  (Brave Paw 점프 도달성 개선)
- 로프 등반 중 피격 시 releaseRope (중력 복원, 유령 활강 방지)
- HUD/TitleScene 전역 resize 리스너 shutdown 시 해제 (씬 재시작 누적 방지)
- docs/ASSETS.md에 mp3 우선 권장 명시 (브라우저 포맷 선택 특성)

## 코드 교차 검증 — PASSED
- 텍스처 키 14종(OPTIONAL_TEXTURES): 생성처(exists 가드) ↔ 사용처 1:1
- 씬 키 5종 등록/전이 payload(mapKey/characterData/HP/MP/freshRun) 일치
- 구 시스템 잔재 0건: haven/bomi/seoli/MONSTER_ELITE/monster_elite 등
- 보스 ↔ 씬 표면 API 전수 확인 (takeDamage 시그니처, onBossDefeated 단일 호출)
- update 순서: Player → 몬스터 → 보스 (흡입이 입력 속도 위에 누적) 보장

## 알려진 한계 (다음 스레드 후보)
- 브라우저 실기 플레이테스트는 로컬에서 npm run dev로 확인 필요
  (컨테이너는 headless — 물리 밸런스 수치는 튜닝 여지 있음)
- 일시정지 중 Date.now() 기반 AI 타이머는 계속 진행 (재개 시 즉시 행동
  가능성 — 게임플레이 영향 경미)
- ogg 단독 드롭 시 일부 브라우저 무음 (mp3 권장, 문서화됨)
