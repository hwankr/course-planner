# 졸업 요건 위젯 가독성 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 수강 계획 페이지의 졸업 요건 위젯을 이수/수강중/예정/미계획 4단계 상태가 한눈에 구분되는 스택 바 + 명확한 수치 표기로 재작성한다.

**Architecture:** `RequirementsSummary.tsx`의 view 모드만 재작성한다. 겹침(절대배치) 바를 나란히 이어지는 flex 스택 바로 교체하고, 7회 반복되는 바 마크업을 로컬 컴포넌트(`StackedBar`, `BreakdownLine`, `TrackRow`)로 추출한다. 백엔드는 `SubRequirement`(전공핵심 서브 요건)에 수강중 학점 집계만 추가한다(현재 누락).

**Tech Stack:** Next.js 15 App Router, TypeScript, TailwindCSS, TanStack Query, Zustand

**Spec:** `docs/superpowers/specs/2026-07-08-graduation-requirements-readability-design.md`

## Global Constraints

- 테스트 인프라 없음(테스트 러너 미설치) — 검증은 `npx tsc --noEmit`, `npm run lint`, `npm run build`, dev 서버 시각 확인으로 수행. 새 테스트 프레임워크 추가 금지(YAGNI).
- 새 의존성 추가 금지.
- UI 문구는 한국어. 과목 상태 용어는 과목 카드와 동일하게: 이수 / 수강중 / 예정.
- CLAUDE.md 아키텍처 규칙 준수: 비즈니스 로직은 `services/`에만. (이번 서비스 변경은 기존 `calculateProgress` 내 집계 확장이므로 규칙에 부합)
- percentage 산식 변경 금지 (earned 기준 유지).
- empty state, 수정 폼(`RequirementForm`), 데이터 훅은 변경 금지.
- 상태 색상: 이수 `bg-blue-600`(충족 시 `bg-emerald-500`), 수강중 `bg-sky-400`, 예정 blue-300/blue-100 대각 빗금(`repeating-linear-gradient(135deg, #93c5fd 0 3px, #dbeafe 3px 6px)`), 미계획(트랙 배경) `bg-gray-100`.
- 커밋 메시지는 저장소 관례를 따른다: 한국어 conventional commit (`feat:`, `docs:` …).

---

### Task 1: 전공핵심 서브 요건에 수강중 학점 집계 추가 (타입 + 서비스 + 게스트 스토어)

**Files:**
- Modify: `src/types/index.ts:344-349` (`SubRequirement`)
- Modify: `src/services/graduationRequirement.service.ts` (accumulators ~173-179, enrolled 분기 ~261-266, 결과 조립 3곳)
- Modify: `src/stores/guestGraduationStore.ts` (multi-track 경로 ~182-270, single-track 경로 ~289-315)

**Interfaces:**
- Consumes: 기존 `GraduationProgress` / `SubRequirement` 타입, `calculateProgress`, `calculateGuestProgress`
- Produces: `SubRequirement.enrolled?: number` — Task 2의 UI가 `major.requiredMin.enrolled ?? 0`으로 읽는다. 서버·게스트 양쪽 모두 `requiredMin.enrolled`에 수강중 전공핵심 학점을 채운다.

- [ ] **Step 1: `SubRequirement` 타입에 `enrolled` 추가**

`src/types/index.ts`에서:

```typescript
export interface SubRequirement {
  required: number;
  earned: number;
  planned?: number;
  percentage: number;
}
```

를 다음으로 수정:

```typescript
export interface SubRequirement {
  required: number;
  earned: number;
  enrolled?: number;
  planned?: number;
  percentage: number;
}
```

- [ ] **Step 2: 서비스 accumulator에 `reqEnrolled` 추가**

`src/services/graduationRequirement.service.ts`의 track accumulators:

```typescript
  const tracks = {
    primaryMajor: { earned: 0, enrolled: 0, planned: 0, reqEarned: 0, reqPlanned: 0 },
    secondaryMajor: { earned: 0, enrolled: 0, planned: 0, reqEarned: 0, reqPlanned: 0 },
    minor: { earned: 0, enrolled: 0, planned: 0, reqEarned: 0, reqPlanned: 0 },
    general: { earned: 0, enrolled: 0, planned: 0 },
  };
```

를 다음으로 수정 (세 트랙에 `reqEnrolled: 0` 추가):

```typescript
  const tracks = {
    primaryMajor: { earned: 0, enrolled: 0, planned: 0, reqEarned: 0, reqEnrolled: 0, reqPlanned: 0 },
    secondaryMajor: { earned: 0, enrolled: 0, planned: 0, reqEarned: 0, reqEnrolled: 0, reqPlanned: 0 },
    minor: { earned: 0, enrolled: 0, planned: 0, reqEarned: 0, reqEnrolled: 0, reqPlanned: 0 },
    general: { earned: 0, enrolled: 0, planned: 0 },
  };
```

- [ ] **Step 3: enrolled 분기에서 전공핵심 집계**

같은 파일의 트랙 누적 분기:

```typescript
        } else if (entry.status === 'enrolled') {
          track.enrolled += credits;
        } else if (entry.status === 'planned') {
```

를 다음으로 수정:

```typescript
        } else if (entry.status === 'enrolled') {
          track.enrolled += credits;
          if (isMajorRequired) track.reqEnrolled += credits;
        } else if (entry.status === 'planned') {
```

- [ ] **Step 4: 결과 조립 3곳에 `enrolled` 반환 추가**

같은 파일에서 `requiredMin` 객체 3곳(primaryMajor, secondaryMajor, minor)에 각각 `enrolled` 필드를 추가한다. `earned:` 줄 다음, `planned:` 줄 앞에 넣는다.

primaryMajor (result 본문):

```typescript
      requiredMin: {
        required: requirement.primaryMajorRequiredMin,
        earned: tracks.primaryMajor.reqEarned + priorPrimaryMajorRequired,
        enrolled: tracks.primaryMajor.reqEnrolled,
        planned: tracks.primaryMajor.reqPlanned,
        percentage: pct(tracks.primaryMajor.reqEarned + priorPrimaryMajorRequired, requirement.primaryMajorRequiredMin),
      },
```

secondaryMajor 블록:

```typescript
      requiredMin: {
        required: requirement.secondaryMajorRequiredMin || 0,
        earned: tracks.secondaryMajor.reqEarned + priorSecondaryMajorRequired,
        enrolled: tracks.secondaryMajor.reqEnrolled,
        planned: tracks.secondaryMajor.reqPlanned,
        percentage: pct(tracks.secondaryMajor.reqEarned + priorSecondaryMajorRequired, requirement.secondaryMajorRequiredMin || 0),
      },
```

minor 블록:

```typescript
      requiredMin: {
        required: requirement.minorRequiredMin || 0,
        earned: tracks.minor.reqEarned + priorMinorRequired,
        enrolled: tracks.minor.reqEnrolled,
        planned: tracks.minor.reqPlanned,
        percentage: pct(tracks.minor.reqEarned + priorMinorRequired, requirement.minorRequiredMin || 0),
      },
```

`emptyProgress()` 헬퍼 안의 `requiredMin`들은 수정하지 않아도 된다(`enrolled`는 optional).

- [ ] **Step 5: 게스트 스토어 multi-track 경로에 수강중 전공핵심 집계 추가**

`src/stores/guestGraduationStore.ts`에서:

```typescript
    const primaryReqCompleted = sumCr(filterByDeptRequired(completed, userDepartmentId));
    const primaryReqPlanned = sumCr(filterByDeptRequired(planned, userDepartmentId));
```

를 다음으로 수정:

```typescript
    const primaryReqCompleted = sumCr(filterByDeptRequired(completed, userDepartmentId));
    const primaryReqEnrolled = sumCr(filterByDeptRequired(enrolled, userDepartmentId));
    const primaryReqPlanned = sumCr(filterByDeptRequired(planned, userDepartmentId));
```

그리고:

```typescript
    const secondaryReqCompleted = sumCr(filterByDeptRequired(completed, secondaryDepartmentId));
    const secondaryReqPlanned = sumCr(filterByDeptRequired(planned, secondaryDepartmentId));
```

를 다음으로 수정:

```typescript
    const secondaryReqCompleted = sumCr(filterByDeptRequired(completed, secondaryDepartmentId));
    const secondaryReqEnrolled = sumCr(filterByDeptRequired(enrolled, secondaryDepartmentId));
    const secondaryReqPlanned = sumCr(filterByDeptRequired(planned, secondaryDepartmentId));
```

multi-track 경로의 `requiredMin` 3곳(primaryMajor / secondaryMajor / minor)에 `enrolled`를 추가한다:

- primaryMajor: `earned: primaryReqCompleted + priorPrimaryMajorRequired,` 다음 줄에 `enrolled: primaryReqEnrolled,`
- secondaryMajor: `earned: secondaryReqCompleted + priorSecondaryMajorRequired,` 다음 줄에 `enrolled: secondaryReqEnrolled,`
- minor: `earned: secondaryReqCompleted + priorMinorRequired,` 다음 줄에 `enrolled: secondaryReqEnrolled,`

- [ ] **Step 6: 게스트 스토어 single-track 경로에도 추가**

같은 파일에서:

```typescript
  const majorReqEarned = sumCredits(completed, ['major_required']);
  const majorReqPlanned = sumCredits(planned, ['major_required']);
```

를 다음으로 수정:

```typescript
  const majorReqEarned = sumCredits(completed, ['major_required']);
  const majorReqEnrolled = sumCredits(enrolled, ['major_required']);
  const majorReqPlanned = sumCredits(planned, ['major_required']);
```

그리고 그 아래 return의 `requiredMin`:

```typescript
      requiredMin: {
        required: requirement.primaryMajorRequiredMin,
        earned: majorReqEarned + priorPrimaryMajorRequired,
        enrolled: majorReqEnrolled,
        planned: majorReqPlanned,
        percentage: pct(majorReqEarned + priorPrimaryMajorRequired, requirement.primaryMajorRequiredMin),
      },
```

- [ ] **Step 7: 타입 검사**

Run: `npx tsc --noEmit`
Expected: 에러 없이 종료 (exit 0)

- [ ] **Step 8: Commit**

```bash
git add src/types/index.ts src/services/graduationRequirement.service.ts src/stores/guestGraduationStore.ts
git commit -m "feat: 전공핵심 서브 요건에 수강중 학점 집계 추가"
```

---

### Task 2: RequirementsSummary view 모드 재작성 (스택 바 + 수치 라인)

**Files:**
- Modify: `src/components/features/RequirementsSummary.tsx` (view 모드 전체: `// View mode - requirement exists` 주석부터 컴포넌트 끝까지. 파일 상단 훅/empty state/수정 폼은 변경 금지)

**Interfaces:**
- Consumes: Task 1의 `SubRequirement.enrolled?: number` (`major.requiredMin.enrolled ?? 0`으로 읽음). `GroupProgress`(required/earned/enrolled/planned/percentage), `TrackProgress`(+requiredMin).
- Produces: 없음 (leaf UI). 로컬 컴포넌트 `StackedBar`, `BreakdownLine`, `TrackRow`는 export하지 않는다.

- [ ] **Step 1: 파일 상단(import 아래, `export function RequirementsSummary` 위)에 로컬 컴포넌트 추가**

```tsx
// ============================================
// View-mode presentational components
// ============================================

const PLANNED_STRIPES =
  'repeating-linear-gradient(135deg, #93c5fd 0 3px, #dbeafe 3px 6px)';

interface SegmentValues {
  earned: number;
  enrolled?: number;
  planned?: number;
  required: number;
}

function isMet({ earned, required }: SegmentValues) {
  return required > 0 && earned >= required;
}

/** 이수 → 수강중 → 예정 순서로 나란히 이어지는 스택 바. 누적 100% 초과분은 클램프. */
function StackedBar({ earned, enrolled = 0, planned = 0, required, size = 'md' }: SegmentValues & { size?: 'lg' | 'md' | 'sm' }) {
  const height = size === 'lg' ? 'h-2.5' : size === 'md' ? 'h-2' : 'h-1.5';
  const met = isMet({ earned, required });

  let widths = { earned: 0, enrolled: 0, planned: 0 };
  if (required > 0) {
    const e = Math.min((earned / required) * 100, 100);
    const n = Math.min((enrolled / required) * 100, Math.max(0, 100 - e));
    const p = Math.min((planned / required) * 100, Math.max(0, 100 - e - n));
    widths = { earned: e, enrolled: n, planned: p };
  }

  return (
    <div className={`flex-1 ${height} bg-gray-100 rounded-full overflow-hidden flex`}>
      {widths.earned > 0 && (
        <div className={met ? 'bg-emerald-500' : 'bg-blue-600'} style={{ width: `${widths.earned}%` }} />
      )}
      {widths.enrolled > 0 && (
        <div className="bg-sky-400" style={{ width: `${widths.enrolled}%` }} />
      )}
      {widths.planned > 0 && (
        <div style={{ width: `${widths.planned}%`, backgroundImage: PLANNED_STRIPES }} />
      )}
    </div>
  );
}

/** 바 아래 수치 라인: 색 점 + "이수 N · 수강중 N · 예정 N · 미계획 N". 0인 항목은 숨김. */
function BreakdownLine({ earned, enrolled = 0, planned = 0, required, prior = 0, className = '' }: SegmentValues & { prior?: number; className?: string }) {
  const met = isMet({ earned, required });
  const unplanned = Math.max(0, required - earned - enrolled - planned);

  if (met && enrolled === 0 && planned === 0) {
    return <p className={`text-[11px] text-emerald-600 ${className}`}>요건 충족</p>;
  }

  return (
    <p className={`text-[11px] text-gray-400 flex items-center gap-x-2.5 gap-y-0.5 flex-wrap ${className}`}>
      <span className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-[2px] inline-block ${met ? 'bg-emerald-500' : 'bg-blue-600'}`} />
        이수 {earned}
        {prior > 0 && <>(기이수 {prior} 포함)</>}
      </span>
      {enrolled > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-[2px] inline-block bg-sky-400" />
          수강중 {enrolled}
        </span>
      )}
      {planned > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-[2px] inline-block" style={{ backgroundImage: PLANNED_STRIPES }} />
          예정 {planned}
        </span>
      )}
      {unplanned > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-[2px] inline-block bg-gray-200" />
          미계획 {unplanned}
        </span>
      )}
    </p>
  );
}

/** 요건 한 줄: 라벨 + 스택 바 + "이수/필요" + 아래 수치 라인. sub=true면 들여쓴 얇은 서브 행. */
function TrackRow({ label, earned, enrolled = 0, planned = 0, required, prior = 0, sub = false }: SegmentValues & { label: string; prior?: number; sub?: boolean }) {
  const met = isMet({ earned, required });
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`w-16 flex-shrink-0 whitespace-nowrap ${sub ? 'pl-3 text-[11px] text-gray-400' : 'text-xs text-gray-600'}`}>
          {sub ? `└ ${label}` : label}
        </span>
        <StackedBar earned={earned} enrolled={enrolled} planned={planned} required={required} size={sub ? 'sm' : 'md'} />
        <span className={`w-16 flex-shrink-0 text-right whitespace-nowrap ${sub ? 'text-[11px]' : 'text-xs'} ${met ? 'text-emerald-600' : 'text-gray-500'}`}>
          {met && '✓ '}
          <span className="font-medium">{earned}</span>/{required}
        </span>
      </div>
      <BreakdownLine
        earned={earned}
        enrolled={enrolled}
        planned={planned}
        required={required}
        prior={prior}
        className="mt-0.5 pl-[72px]"
      />
    </div>
  );
}
```

- [ ] **Step 2: view 모드 렌더링 교체**

`// View mode - requirement exists` 주석부터 컴포넌트 끝(`</Card>` 반환 포함)까지를 아래 코드로 전부 교체한다. `fmtCredits` 헬퍼도 이 범위에 있으므로 함께 삭제된다. progress fallback·prior 변수 선언은 유지하되 아래처럼 정리한다.

```tsx
  // View mode - requirement exists
  const total = progress?.total ?? { required: requirement.totalCredits, earned: 0, enrolled: 0, planned: 0, percentage: 0 };
  const major = progress?.primaryMajor ?? {
    required: requirement.primaryMajorCredits, earned: 0, enrolled: 0, planned: 0, percentage: 0,
    requiredMin: { required: requirement.primaryMajorRequiredMin, earned: 0, percentage: 0 },
  };
  const general = progress?.general ?? {
    required: requirement.generalCredits, earned: 0, enrolled: 0, planned: 0, percentage: 0,
  };

  const secondaryMajor = progress?.secondaryMajor;
  const minor = progress?.minor;
  const minorPrimaryMajorMin = progress?.minorPrimaryMajorMin;

  // Prior earned credits (기이수)
  const priorTotal = requirement.earnedTotalCredits || 0;
  const priorMajor = requirement.earnedPrimaryMajorCredits || 0;
  const priorGeneral = requirement.earnedGeneralCredits || 0;
  const priorMajorRequired = requirement.earnedPrimaryMajorRequiredCredits || 0;
  const priorSecondaryMajor = requirement.earnedSecondaryMajorCredits || 0;
  const priorSecondaryMajorRequired = requirement.earnedSecondaryMajorRequiredCredits || 0;
  const priorMinor = requirement.earnedMinorCredits || 0;
  const priorMinorRequired = requirement.earnedMinorRequiredCredits || 0;

  // 계획 반영 시 예상 진행률 (이수 + 수강중 + 예정)
  const projected = total.required > 0
    ? Math.min(Math.round(((total.earned + total.enrolled + total.planned) / total.required) * 100), 100)
    : 0;

  return (
    <Card>
      <CardContent className="py-3 px-3 sm:px-4">
        {/* 헤더: 제목 + 연도 뱃지 + 진행률 */}
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">졸업 요건</span>
            {requirement?.requirementYear && (
              <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                {requirement.requirementYear}년 기준
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-semibold ${total.percentage >= 100 ? 'text-emerald-600' : 'text-gray-800'}`}>
              {total.percentage}%
            </span>
            {projected > total.percentage && (
              <span className="text-xs text-gray-400 whitespace-nowrap">→ 계획 반영 시 {projected}%</span>
            )}
          </div>
        </div>

        {/* 총 학점 히어로 바 */}
        <div className="mt-2 flex items-center gap-2">
          <StackedBar earned={total.earned} enrolled={total.enrolled} planned={total.planned} required={total.required} size="lg" />
          <span className="text-xs text-gray-500 whitespace-nowrap">
            <span className="font-medium text-gray-700">{total.earned}</span>/{total.required}학점
          </span>
        </div>
        <BreakdownLine
          earned={total.earned}
          enrolled={total.enrolled}
          planned={total.planned}
          required={total.required}
          prior={priorTotal}
          className="mt-1.5"
        />

        {/* 요건별 상세 */}
        <div className="mt-3 pt-3 border-t space-y-2.5">
          <TrackRow label="전공" earned={major.earned} enrolled={major.enrolled} planned={major.planned} required={major.required} prior={priorMajor} />
          <TrackRow label="핵심" sub earned={major.requiredMin.earned} enrolled={major.requiredMin.enrolled ?? 0} planned={major.requiredMin.planned ?? 0} required={major.requiredMin.required} prior={priorMajorRequired} />
          {minorPrimaryMajorMin && (
            <TrackRow label="주전공최소" sub earned={minorPrimaryMajorMin.earned} required={minorPrimaryMajorMin.required} />
          )}

          {secondaryMajor && (
            <>
              <TrackRow label="복수전공" earned={secondaryMajor.earned} enrolled={secondaryMajor.enrolled} planned={secondaryMajor.planned} required={secondaryMajor.required} prior={priorSecondaryMajor} />
              <TrackRow label="핵심" sub earned={secondaryMajor.requiredMin.earned} enrolled={secondaryMajor.requiredMin.enrolled ?? 0} planned={secondaryMajor.requiredMin.planned ?? 0} required={secondaryMajor.requiredMin.required} prior={priorSecondaryMajorRequired} />
            </>
          )}

          {minor && (
            <>
              <TrackRow label="부전공" earned={minor.earned} enrolled={minor.enrolled} planned={minor.planned} required={minor.required} prior={priorMinor} />
              <TrackRow label="핵심" sub earned={minor.requiredMin.earned} enrolled={minor.requiredMin.enrolled ?? 0} planned={minor.requiredMin.planned ?? 0} required={minor.requiredMin.required} prior={priorMinorRequired} />
            </>
          )}

          <TrackRow label="교양" earned={general.earned} enrolled={general.enrolled} planned={general.planned} required={general.required} prior={priorGeneral} />
        </div>

        {/* 푸터: 도움말 + 요건 수정 */}
        <div className="mt-3 pt-2.5 border-t flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] text-gray-400">과목 카드의 상태(예정·수강중·이수)를 바꾸면 바로 반영됩니다.</span>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#153974] bg-[#153974]/10 hover:bg-[#153974]/20 rounded-md transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            요건 수정
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
```

주의사항:
- 기존 `fmtCredits` 함수, 범례 행("이수/계획" legend), 헤더 미니 바, 절대배치 겹침 세그먼트는 모두 삭제된 상태여야 한다.
- `TrackRow label="핵심"`은 `sub` prop 때문에 `└ 핵심`으로 렌더링된다.
- `minorPrimaryMajorMin`은 `SubRequirement`(enrolled/planned 없음)이므로 earned/required만 넘긴다.

- [ ] **Step 3: 타입/린트 검사**

Run: `npx tsc --noEmit`
Expected: exit 0

Run: `npm run lint`
Expected: 에러 0 (기존 파일에서 새로 발생한 경고 없음)

- [ ] **Step 4: Commit**

```bash
git add src/components/features/RequirementsSummary.tsx
git commit -m "feat: 졸업 요건 위젯 가독성 개선 - 상태별 스택 바 + 수치 라인"
```

---

### Task 3: 빌드 및 시각 검증

**Files:** 없음 (검증 전용; 발견된 문제 수정 시 해당 파일)

**Interfaces:**
- Consumes: Task 1, 2의 전체 변경
- Produces: 검증 증거 (빌드 로그, 스크린샷/스냅샷)

- [ ] **Step 1: 프로덕션 빌드**

Run: `npm run build`
Expected: 빌드 성공 (exit 0)

- [ ] **Step 2: dev 서버 시각 확인**

Run: `npm run dev` (백그라운드) 후 브라우저에서 `http://localhost:3000/planner` 접속 (게스트 모드로 진입 가능).

확인 시나리오:
1. 과목을 학기에 추가(예정 상태) → 히어로 바에 빗금 세그먼트 + "예정 N" 표기
2. 과목 상태를 수강중으로 변경 → 하늘색 세그먼트 + "수강중 N" 표기
3. 과목 상태를 이수로 변경 → 진한 파랑 세그먼트 확장, % 증가
4. 요건 충족(earned ≥ required) 트랙 → 초록 바 + `✓ N/N` + "요건 충족"
5. 기이수 학점 입력(요건 수정) → "이수 N (기이수 M 포함)" 표기
6. 전공핵심 과목을 수강중으로 → `└ 핵심` 행에도 하늘색 세그먼트 반영 (Task 1 검증)
7. 모바일 뷰포트(375px) → 헤더/수치 라인 줄바꿈 정상, 가로 스크롤 없음

- [ ] **Step 3: 문제 발견 시 수정 후 재검증, 커밋**

수정이 있었다면:

```bash
git add -A src/
git commit -m "fix: 졸업 요건 위젯 시각 검증 후속 수정"
```
