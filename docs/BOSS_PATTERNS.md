# 보스 공격 패턴 (MapleStory 스타일)

Hug Guardian · Dr. Embrace · Vacuum King의 공격은 전부 **데이터**다. 숫자는 모두
출발점이므로 `src/data/bossPatterns.js`(패턴/페이즈)와 `src/data/monsters.js`(보스 HP)에서
Owen이 바로 조정하면 된다. 구조 설명은 `CLAUDE.md`의 "Bosses" 절.

```
bossPatterns.js (데이터) → BossBrain.js (순수 로직) → PatternExecutor.js (Phaser) → PatternBoss.js (루프)
```

## 페이즈

| 보스 | 페이즈 | 새로 열리는 것 |
|---|---|---|
| Hug Guardian | 100–60% | Paw Swipe · Hug Grab(기절) · Call Friends(Bangul ×2) |
| | 60–30% | Group Hug(기존 field hug, 초록 안전지대 유지) · Paw Swipe에 둔화 2초 |
| | <30% 격분 | Cuddle Shield(3초 무적 자세) · 쿨다운 ×0.7 · 이동 ×1.3 |
| Vacuum King | 100–50% | Suction · Dust Balls(부채꼴 ×3) · Floor Sweep |
| | 50–25% | Suction과 Dust Balls 동시 가능 · Call Flies(Pari ×2) |
| | <25% 격분 | Bag Burst(무작위 3곳) · Full Power Suction · 쿨다운 ×0.7 · 이동 ×1.3 |
| Dr. Embrace | 100–50% | Arm Reach · Check-up Slam |
| (튜토리얼) | <50% | Check-up Hug(기존 field hug) |

- 경계는 "엄밀히 미만": 정확히 60%는 아직 1페이즈, 1이라도 더 깎이면 2페이즈.
- 페이즈가 바뀌면 진행 중인 패턴을 취소하고 약 1초 **무적 포효**(화면 흔들림 + 번쩍임 + 문구).
  이 동안 맞은 공격은 "GUARD!"로 막힌다. 체력바에는 페이즈 경계마다 눈금이 있다.
- 격분은 쿨다운과 이동 속도만 줄이고 늘린다. **예고 시간은 절대 줄이지 않는다.**

## 패턴 종류와 파라미터

| type | 동작 | 피하는 법 | 주요 `params` |
|---|---|---|---|
| `meleeSwipe` | 보스 앞쪽 바닥 판정 | 물러나기 / 점프 | `range` `height` `damage` |
| `areaSlam` | 바닥 붉은 구역이 서서히 짙어진 뒤 타격 | 구역 밖으로 | `width` `hitHeight` `damage` `count` `target` `minGapPx` |
| `projectile` | 조준 발사(부채꼴) 또는 바닥을 가로지르는 팔 | 선에서 벗어나기 / 점프 | `count` `spreadDeg` `speed` `damage` `texture` `origin` |
| `dashSweep` | 보스가 납작해져 바닥을 돌진 | 점프 | `speed` `damage` `lowProfile` |
| `fieldWide` | 땅에 있는 모두 타격 | 공중에 있기 / 초록 안전지대 | `damage` `safeRadius` `airborne` |
| `pull` | 일정 시간 보스 쪽으로 끌어당김 | 반대로 걷기 | `durationMs` `pull` `lowerBody` `hold` `touchDamage` |
| `summon` | 기존 몬스터 소환(상한 4) | 처치 / 회피 | `monster` `count` `max` |
| `guard` | 일정 시간 피해 무효 | 기다리기 | `durationMs` |

공통 필드: `weight`(가중치) `cooldownMs`(패턴을 시작한 시점부터 센다) `telegraphMs`(예고) `overlap`
(true면 다른 `overlap` 패턴과 동시에 가능, 아니면 한 번에 하나), 그리고 `onHit: { status, ms }`.
패턴 사이에는 페이즈의 `gapMs`만큼 쉰다.

## 공정성 규칙 (validate + test가 강제)

- 피해를 주는 공격의 `telegraphMs ≥ 600`, `fieldWide ≥ 1000`
- 같은 `fieldWide`는 연속 금지, 소환수는 보스당 동시 4마리까지
- 모든 페이즈에 "다음 선택 때까지 쿨다운이 끝나 있는" 패턴이 있어 보스가 멈추지 않음
- `pull`은 가장 느린 고양이(Bomi, 190)보다 약해서 반대로 걸으면 항상 버틸 수 있음
- 기절은 최대 1.5초, 끝난 뒤 2초간 새 기절 면역. 둔화는 이동 속도 ×0.6
- 모든 `nameKey`/`roarKey`는 en·ko에 존재, 소환 몬스터 id 존재, 페이즈는 `hpBelow` 내림차순에 첫 페이즈 1.0

## 전투 시간 튜닝

`BOSS_TYPES[id].balance = { intendedLevel, uptime }`와 `src/data/bossBalance.js`가 "전투가 몇 초
걸리나"를 계산한다(콤보 3타 DPS × 가동률 + 포효·방어 자세 시간). 목표는 의도한 레벨에서 **2~4분**이고,
벗어나면 `npm test`가 어느 보스·고양이가 몇 초인지 알려 준다.

| 보스 | 의도 레벨 | 가동률 | HP | 추정(설이 / 보미) |
|---|---|---|---|---|
| Hug Guardian | 10 | 0.35 | 7000 (기존 1500) | 약 178초 / 187초 |
| Vacuum King | 14 | 0.30 | 8000 (기존 2200) | 약 174초 / 192초 |

- 모델의 DPS는 브라우저에서 보스를 고정시키고 CTRL을 계속 누른 실측과 2% 안으로 맞는다
  (설이 L10 123 vs 모델 124, 보미 L10 116 vs 모델 118).
- **가동률(0.35 / 0.30)과 의도 레벨은 가정이다.** 실제 플레이로 확인해서 어긋나면 `balance` 값이나
  `hp`를 조정하자. 숙련자는 50% 이상 때릴 수 있어서 더 빨리 끝난다.

## 회피 가능성 검증 (브라우저, 저장소에는 미포함)

반응 속도 250ms를 가정한 봇이 두 고양이의 실제 물리로 각 공격을 피하는지 돌렸다.
같은 공격을 가만히 서서 맞는 대조군은 반드시 피해를 입는다.

- 피한 것: Paw Swipe(물러나기 / 점프), Hug Grab, Group Hug(점프 / 안전지대), Arm Reach(점프),
  Check-up Slam, Check-up Hug, Dust Balls(3방향 × 3위치), Floor Sweep(거리 150/400/800, 격분 포함),
  Bag Burst, Full Power Suction(보스 바로 아래·좌우·구석 포함)
- 이 검증에서 고친 것: Arm Reach가 너무 느려 점프로 못 넘던 문제(속도 150→240), Full Power Suction이
  Bomi보다 강해서 반대로 걸어도 끌려가던 문제(215→180), 보스가 내려앉는 시점을 예고 후반으로 미룸,
  조준선이 보스를 따라가도록 수정

## 스프라이트 (새 그림 없이 만든 연출과 필요한 프레임)

공격 프레임이 없어서 예고는 `Graphics`(반투명 붉은 영역 + 깜빡임), 틴트 번쩍임, 스케일 트윈,
이름 문구로 표현했다. 아틀라스에 아래 프레임이 생기면 `PatternExecutor`의 wind-up 트윈을 교체하면 된다.

- Hug Guardian: 팔 들어올리기(swipe 예고) · 팔 휘두르기(swipe 타격) · 양팔로 안기(Hug Grab / Group Hug) ·
  웅크려 방패 자세(Cuddle Shield) · 소환 손짓(Call Friends) · 포효(페이즈 전환)
- Vacuum King: 흡입구 열림(Suction / Full Power) · 납작한 바닥 청소 모드(Floor Sweep, 현재는 세로로 눌러서 표현) ·
  먼지 발사(Dust Balls) · 먼지통 팽창·폭발(Bag Burst) · 파리 방출(Call Flies) · 포효
- Dr. Embrace: 팔 뻗기(Arm Reach) · 내려치기(Slam) · 크게 안기(Check-up Hug)
- 플레이어: 기절 아이콘/이펙트 프레임(현재는 별 3개 도형), 둔화 이펙트
