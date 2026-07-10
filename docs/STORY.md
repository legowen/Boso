# Boso 스토리 바이블 (v0.4)

> 이 문서는 기획용(한국어). 인게임 텍스트는 전부 영어 (프로젝트 컨벤션).

## 로그라인
"날 좀 보소!" — 주인의 관심을 잃은 강아지 보소가, 주인이 틀어박힌
다락방 연구소(Attic Laboratory)까지 집안을 가로질러 모험하는 이야기.

## 마가티아 오마주
- 마가티아의 두 연금술 결사(제뉴미스트/알카드노) → **Gearists vs Plushists**
  (장난감에 생명을 불어넣는 두 라이벌 장난감 연금술 결사)
- 연구소에서 탈출한 실험체들이 필드 몬스터가 됨
- Toy Workshop 맵에 두 결사의 NPC 등장 (Gearist Tinkerer / Plushist Sewmaster)

## 월드 (집 = 7개 맵)
1. **Sunny Backyard** (yard) — 시작 마을. NPC: Miyo the Cat, Old Bell
2. **Living Room** (livingroom) — 방울 사냥터
3. **Kitchen** (kitchen) — 공 사냥터, 첫 레이저 등장
4. **Hallway & Stairs** (hallway) — 세로맵 (1800x1400), 로프 등반
5. **Toy Workshop** (playroom) — 나비/파리 비행 벌레 구역, 결사 NPC
6. **Attic Laboratory** (attic) — Hug Guardian 보스전
7. **Vacuum Closet** (closet) — 히든. Hug Guardian 처치 시 비밀 포탈 개방

## 몬스터 도감 (레벨 낮은 순)
| 몬스터 | 컨셉 | 무브먼트 레퍼런스 | 구현 |
|---|---|---|---|
| Bangul (방울) | 비눗방울 실험체 | 메이플 달팽이 | 저속 지상 순찰, 랜덤 멈춤, 낭떠러지/벽에서 회전 |
| Gong (공) | 튀는 공 실험체 | 메이플 슬라임/버섯 | 지형 무시 랜덤 점프, 40% 확률 플레이어 방향, 스쿼시 연출 |
| Laser (레이저) | 레이저 포인터 점 | 스티치 | 중력 무시 자유비행 + 웨이포인트 배회, 플레이어 근접 시 돌진 |
| Nabi (나비) | 중간급 비행 벌레 | 나비 | 사인파 활공 |
| Pari (파리) | 중간급 비행 벌레 | 파리 | 불규칙 고속 지터, 50% 플레이어 방향 편향 |

## 보스
- **Hug Guardian** (필드 보스, 자쿰 오마주): 안아주고 싶어서 만들어진 거대
  장난감 골렘. 주인이 갑자기 껴안을 때의 그 압도감이 컨셉.
  패턴: 양팔 포옹 스윕(전 맵 가로지름) / 내려찍기(텔레그래프 0.8초) /
  **필드 전체 포옹** (안전지대 한 곳만 1.7초 텔레그래프, 자쿰 전멸기 스타일)
- **Vacuum King** (스페셜 히든 보스): 모든 반려동물의 근원적 공포, 청소기.
  Hug Guardian 처치 시 비밀 포탈 개방. 패턴: 흡입 3초 주기(플레이어
  끌어당김 — 도망치면 느리게 밀리고 서 있으면 끌려감) / 먼지뭉치 투사체.

## 엔딩 훅
Vacuum King 처치 → "The Owner finally turns around... 'BOSO!'" (데모 클리어)
- 타이틀 화면에 ★ DEMO CLEARED ★ 배지 표시 (localStorage 영속)

## 플레이어블
보소 두 빌드 (커스텀 이미지 후속 교체 예정 — docs/ASSETS.md 참고):
- **Boso — Brave Paw**: HP 150 / ATK 20 / 근접 강타형
- **Boso — Swift Paw**: SPD 240 / 점프 강화 / 스피드형
