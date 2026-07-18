# 적대적 검증 보고서

## v0.7 튜토리얼 섬 + 케이지 이동 + 친구집 월드 업데이트

### 전체 시나리오 체크리스트 (수동 플레이 검증 절차)
1. **새 게임**: 타이틀 → 캐릭터 선택 (Brave Paw / Swift Paw / **Bomi** 3종,
   저장된 레벨 표시) → 인트로 (셸터 프롤로그, `{player}` 이름 치환) →
   `shelter_ward` 시작 (START_MAP)
2. **이동 튜토리얼** (Recovery Ward): 가이드 표지판 확인 — 이동(←→)/점프(ALT)/
   로프(↑↓)/하향 점프(↓+ALT)/포탈(↑). Nurse Mimsy 대화
3. **전투 튜토리얼** (Clinic Hallway): Dust Mote(부유)·Lonesome(움찔 후퇴)·
   Stray Kitten(연속 점프+돌진) 3종 고유 움직임 확인, CTRL 공격,
   Keeper Tobi 퀘스트(Dust Busters 3마리) 수주→완료
4. **튜토리얼 보스** (Shelter Yard): Dr. Embrace — armSweep/slam/fieldHug
   축소판 패턴 (Hug Guardian과 공용 HugBossBase), 처치 시
   `drEmbraceDefeated` + `tutorialCompleted` 플래그 저장 확인
5. **Owen 대화 → 케이지 15초** (Route A): 탑승 페이지에서 SPACE 탑승
   (걸어서 이탈 시 취소, 연타 방지 600ms), 케이지 내부 자유 이동,
   HUD 카운트다운, 습격 없음, 종료 시 `high_table` 자동 도착
6. **친구집 월드**: High Table Village 허브에서 5개 맵 순회 —
   sofa_ridge(Sock Slinker 수축-이완/Yarn Roller 가속 구르기),
   kitchen_floor(Crumb Hopper 다단 점프), hallway_run(RC Racer 드리프트
   텔레그래프), bookshelf_cliffs(세로맵, Moth Circler 램프 궤도+이탈 돌진),
   backyard_gate. Granny Tabby 퀘스트 체인(Sock Roundup → The Big Dog)
7. **Biggie**: 짖음 충격파(원형 넉백 파동)/덮치기 점프(포물선 낙하 텔레그래프)/
   Zoomies(좌우 왕복 질주, 접촉 데미지 증가). HP 0 → "친해짐" 연출
   (하트+배너+퇴장), `biggieDefeated` 저장 → 숨은 지름길 포탈 개방 +
   Owen 귀가 항로 잠금 해제 (이전에는 travelLockedLines)
8. **60초 항로 습격** (Route B): Owen 대화 → 케이지 60초 —
   Vroom(가장자리 텔레그래프 후 플레이어 높이 관통 돌진, 무적) /
   Rumble(저속 압박 + 확산 진동 파동, 처치 가능·트릿/EXP 직접 보상)
   윈도우 내 랜덤 타이밍 스폰 확인 → `yard` 도착 → 기존 하우스 스토리 진행
9. **사망 규칙**: 지역별 홈 리스폰 (shelter→ward / buddy→village / house→yard,
   사망 화면에 목적지 표기), 이동 중 사망 → 출발지 맵 풀피 복귀
10. **구세이브 호환**: v1 세이브(버전 필드 없음) 로드 → version:2 마이그레이션,
    기존 flags/characters 유실 없음, 기존 캐릭터 레벨/트릿/퀘스트 유지

### 자동 검증
- `npm run validate` — 1569 체크 통과. 신규 검사군: 여행 라우트 정합성
  (from/to 실존, duration>0, bgm 키, ambush 타입/스폰 윈도우), 도달성 BFS에
  케이지 라우트 엣지 포함(20/20), buddy 맵 마을(high_table) 기점 도달성,
  지역 태그/REGION_HOME/월드맵 레이아웃·타이틀 커버리지, NPC travelRoute
  참조(출발맵 일치/케이지 프롭 존재/잠금 대사), 가이드·케이지 배치,
  몬스터 14종·보스 4종·ambush 텍스처 키 레지스트리 정합성,
  보스 필수 배치 4곳(attic/closet/shelter_yard/backyard_gate)
- `npm run build` — vite build 에러 0

### 적대적 코드 리뷰 (서브에이전트 전체 델타 트레이스) — 발견 8건 전부 수정
1. **[HIGH] 사망 유예 1.5초 동안 죽은 채 상호작용 가능**: hp 0 → player-died
   이벤트까지 1.5초 사이에 대화 열기/탑승/포탈 진입이 가능 → 탑승 시 사망
   타이머가 씬 전환으로 소멸, 0 HP 동결 상태로 이동 후 도착 시 1 HP 부활
   → checkInteractions/updateDialogue/startTravel에 hp 가드 (포탈 진입도
   동일 가드로 차단 — 기존 main에도 있던 인접 버그 함께 해소)
2. **[MED] 이동 종료 직전 사망이 도착으로 무마**: 사망 후 1.5초 창에서
   elapsedMs가 계속 진행 → arrive()가 사망을 삼킴 → 라이드 클록을
   hp>0일 때만 진행 (사망은 항상 출발지 복귀 계약 유지)
3. **[MED] 덮치기 공중에서 Biggie 우호화 시 공중 정지 연출**: die()가
   공중 좌표에서 body를 끄고 하트/퇴장 트윈 재생 → 우호 연출 전
   지면 스냅 + 각도/스케일 리셋
4. **[MED] Bookshelf Cliffs 우측 기둥 진입 불가 (Brave Paw)**: 우측 첫
   로프 bottom(1290)이 Brave Paw 점프 정점(1299.5)보다 9.5px 높아
   사실상 진입 불가(메인 진행 경로) → 로프 bottomY 1290→1420 연장,
   지상에서 양쪽 기둥 모두 등반 가능
5. **[LOW] 튜토리얼 보스 스킵 가능**: 셸터 Owen 항로가 미게이트 →
   `travelRequiresFlag: 'drEmbraceDefeated'` + 잠금 대사 추가
   (셸터는 일방향이라 스킵 시 플래그 영구 미설정 문제 예방)
6. **[LOW] 일시정지가 탑승 잠금 타이머를 건너뜀**: boardingReadyAt을
   pause 시프트 목록에 추가
7. **[LOW] Zoomies 예열 래틀 트윈이 질주와 위치 경합** (+die 시 잔존):
   텔레그래프 해제/우호화 진입 시 killTweensOf
8. **[LOW] shyGhost 움찔 트윈이 후퇴 상태까지 잔존**: flinch→retreat
   전이 시 killTweensOf

리뷰 클린 판정(발췌): HugBossBase 추출은 원본 HugGuardian과 시맨틱 동일
(회귀 없음), 신규 AI 14종 상태기계 데드엔드 없음, pause 시프트가 신규
타이머 필드 전부 커버, MAP_STATE 인덱스 복원/탑승 저장 안전, 탑승 SPACE
이중 발화 불가, proj_bark 텍스처 가용성(TravelScene은 GameScene 경유로만
진입), 세이브 v2 마이그레이션 왕복 무손실, 포탈 도착 지점 핑퐁 산술 전수
확인, High Table 로프 체인 전 캐릭터 등반 가능, 검증기 신규 체크 건전성.

수정 후 재검증: `npm run validate` 1571 체크 통과, `npm run build` 에러 0.

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
