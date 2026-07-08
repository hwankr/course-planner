# 졸업 요건 위젯 가독성 재설계

**날짜**: 2026-07-08
**대상**: `src/components/features/RequirementsSummary.tsx` (view 모드) + 소규모 백엔드 보완
**상태**: 사용자 승인 완료 (목업 기반 승인)

## 배경 / 문제

수강 계획 페이지(`/planner`)의 졸업 요건 위젯은 진행 상황을 파악하기 어렵다:

1. **'수강중(enrolled)' 상태가 UI에 표시되지 않음** — `GraduationProgress`는 이수/수강중/예정을 구분해 내려주지만 UI는 이수·예정만 그린다.
2. **비슷한 파란색 3개가 절대배치로 겹쳐진 바** — 이수(blue-600), 기이수(blue-400), 예정(blue-300)이 겹쳐 있어 구분 불가. 기이수는 이수에 이미 포함된 값이라 겹침 자체가 시각적 노이즈.
3. **숫자 표기가 암호 같음** — `45+18/130학점` 형태.
4. **"미계획 학점"이 안 보임** — 앞으로 계획에 넣어야 할 학점을 직접 계산해야 한다.
5. **핵심(전공핵심) 서브 요건의 데이터 불일치** — 백엔드가 수강중 학점을 핵심 요건에 집계하지 않아, 같은 과목이 전공 바에는 반영되고 핵심 바에서는 사라진다.

## 목표

- 이수 / 수강중 / 예정 / 미계획 4가지 상태를 한눈에 구분
- 과목 카드의 상태 라벨(예정·수강중·이수)과 용어 일치
- 현재와 비슷한 컴팩트한 카드 크기 유지 (스택 바 방식)

## 설계

### 시각 체계 (스택 바)

겹침 대신 구간이 나란히 이어지는 스택 바. 세그먼트 순서와 색상:

| 상태 | 색상 (Tailwind) | 비고 |
|------|----------------|------|
| 이수 (earned, 기이수 포함) | `bg-blue-600` | 확정 학점 |
| 수강중 (enrolled) | `bg-sky-400` | 현재 학기 수강 |
| 예정 (planned) | blue-200 + 대각 빗금 | `repeating-linear-gradient` 인라인 스타일. 질감으로도 구분(색약 대응) |
| 미계획 (남은 트랙) | `bg-gray-100`~`200` | 바 배경 |
| 요건 충족 (earned ≥ required) | 이수 세그먼트 `bg-emerald-500`(계열) | 체크 아이콘 + "요건 충족" 텍스트(emerald) |

- 기이수 겹침 세그먼트 **제거**. 기이수 > 0이면 수치 라인에 `(기이수 N 포함)` 텍스트로 표기.
- 헤더의 미니 바 제거 → 헤더 아래 총 학점 히어로 바(h-2.5 내외) 하나로 통합.

### 수치 표기

- 각 바 오른쪽: `이수/필요` (예: **66**/130학점). 이수 숫자만 강조(font-medium).
- 각 바 아래 breakdown 라인(11px, 색 점 포함): `이수 66 · 수강중 9 · 예정 18 · 미계획 37`
  - 값이 0인 항목은 숨김 (이수는 항상 표시, 미계획은 > 0일 때 표시)
  - 색 점이 범례 역할을 겸함 → 별도 범례 행 제거
- 상단 퍼센트: `51%` 크게 + `→ 계획 반영 시 72%` 작게(muted). 계획 반영 % = (earned+enrolled+planned)/required.

### 레이아웃 (위→아래)

1. 헤더: "졸업 요건" + 연도 뱃지 + 우측 퍼센트(현재 → 계획 반영 시)
2. 총 학점 히어로 바 + breakdown 라인 (+ 우측 `66/130학점`)
3. 구분선
4. 트랙 행들: 전공(+ 핵심 서브행, 들여쓰기·얇은 바), 복수전공(+핵심), 부전공(+핵심), 주전공최소, 교양 — 각 행 = 라벨 + 스택 바 + `이수/필요`, 아래 breakdown 라인
5. 구분선
6. 푸터: 좌측 도움말 "과목 카드의 상태(예정·수강중·이수)를 바꾸면 바로 반영됩니다." + 우측 기존 '요건 수정' 버튼

모바일: 헤더·breakdown 라인에 `flex-wrap` 적용.

### 컴포넌트 구조

`RequirementsSummary.tsx` 내 로컬 컴포넌트로 추출 (7회 반복 마크업 제거):

- `StackedBar({ earned, enrolled, planned, required, met, size })` — flex 컨테이너 안에 세그먼트를 % 너비로 나란히 렌더. 누적 너비 100% 초과 시 순서대로 클램프.
- `BreakdownLine({ earned, enrolled, planned, unplanned, prior, met })` — 색 점 + 수치, 0 항목 숨김.
- `TrackRow({ label, progress, sub, indent })` — 라벨 + StackedBar + 우측 수치 + BreakdownLine.

empty state, 수정 폼(RequirementForm), 데이터 훅은 변경 없음.

### 백엔드 보완 (핵심 요건 수강중 집계)

- `src/types/index.ts`: `SubRequirement`에 `enrolled?: number` 추가.
- `src/services/graduationRequirement.service.ts` `calculateProgress`: 트랙별 `reqEnrolled` 집계(수강중 + major_required) 후 `requiredMin.enrolled`로 반환.
- `src/stores/guestGraduationStore.ts` `calculateGuestProgress`: 동일 로직 반영 (구현 시 requiredMin 계산부 확인).
- percentage 계산은 기존대로 earned 기준 유지.

## 엣지 케이스

- `required ≤ 0`: 0으로 나누기 방지 — 빈 회색 바 렌더.
- earned+enrolled+planned > required: 세그먼트 너비를 앞에서부터 누적 100%로 클램프.
- 수강중·예정 모두 0: breakdown 라인에서 해당 항목 생략, 바는 이수+미계획만.
- `minorPrimaryMajorMin`(SubRequirement, earned만 존재): earned 세그먼트만 렌더.

## 검증 계획

- `npm run lint`, `npm run build` 통과
- dev 서버에서 시각 확인: 일반 케이스(3상태 혼재), 요건 충족 케이스, 기이수 포함 케이스, 게스트 모드, 모바일 뷰포트

## 범위 제외

- 수정 폼(RequirementForm) UI 변경 없음
- percentage 산식 변경 없음 (earned 기준 유지)
- 대시보드 등 다른 페이지의 진행률 표시 변경 없음
