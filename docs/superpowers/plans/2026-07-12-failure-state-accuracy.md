# 실패 상태 정확성 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 과목 상태 변경 실패 시 optimistic 상태만 정확히 복구하고, 졸업요건 조회 실패를 오류 및 안정적인 재시도 상태로 표시한다.

**Architecture:** 과목 상태 mutation handler는 현재 과목의 이전 상태만 context에 저장하고 plan/course별 lifecycle queue로 같은 과목 요청을 직렬화한다. 졸업요건 카드는 순수 상태 resolver와 재시도 helper를 사용해 loading/error/empty/ready 및 재시도 latch를 테스트 가능한 단위로 분리한다.

**Tech Stack:** Next.js App Router, TypeScript, Zustand, TanStack Query 5, React 19, Node test runner (`tsx --test`)

## Global Constraints

- `src/app/api/*`에는 비즈니스 로직을 추가하지 않는다.
- 게스트 모드는 네트워크 요청 없이 기존 로컬 store 동작을 유지한다.
- 오류 상태에서는 캐시된 수치, 0% fallback, 미설정 UI를 표시하지 않는다.
- 새로운 런타임 또는 테스트 의존성을 추가하지 않는다.
- 실제 commit 또는 push는 수행하지 않고 `git push --dry-run origin main`까지 검증한다.

---

### Task 1: 과목 상태 optimistic rollback

**Files:**
- Modify: `src/hooks/useCourseStatus.ts`
- Test: `tests/course-status-rollback.test.ts`

**Interfaces:**
- Consumes: `usePlanStore.getState()`, `planKeys.detail('my')`, `graduationRequirementKeys.progress()`
- Produces: `createCourseStatusMutationHandlers(queryClient)`와 plan/course별 serialized mutation context

- [x] **Step 1: Write failing rollback and overlap tests**

```ts
const firstContext = await handlers.onMutate(firstInput);
const secondContextPromise = handlers.onMutate(secondInput);

assert.equal(secondStarted, false);
handlers.onError(new Error('first failed'), firstInput, firstContext);
await handlers.onSettled(undefined, new Error('first failed'), firstInput, firstContext);

const secondContext = await secondContextPromise;
handlers.onError(new Error('second failed'), secondInput, secondContext);
assert.equal(currentCourseStatus(), 'planned');
```

The focused test also moves the target course and changes another course while the first request is pending, then verifies those edits survive rollback. A real `QueryObserver` simulation verifies settlement marks the canonical query stale without immediately fetching and hydrating an older whole plan over those edits.

- [x] **Step 2: Run focused tests and verify RED**

Run: `npm test -- tests/course-status-rollback.test.ts`
Expected: the original implementation fails because it has no rollback, then the first whole-plan fix fails overlap tests by reverting intervening edits and starting the second lifecycle early.

- [x] **Step 3: Implement targeted rollback and per-course serialization**

```ts
interface UpdateCourseStatusInput {
  planId: string;
  year: number;
  term: Term;
  courseId: string;
  status: 'planned' | 'enrolled' | 'completed' | 'failed';
  grade?: string;
}

interface CourseStatusMutationContext {
  planId: string;
  courseId: string;
  previousStatus: UpdateCourseStatusInput['status'] | undefined;
  release: () => void;
}

export function createCourseStatusMutationHandlers(queryClient: QueryClient) {
  const courseMutationQueues = new Map<string, Promise<void>>();

  return {
    onMutate: async (
      variables: UpdateCourseStatusInput
    ): Promise<CourseStatusMutationContext> => {
      const queueKey = JSON.stringify([variables.planId, variables.courseId]);
      const previousLifecycle = courseMutationQueues.get(queueKey) ?? Promise.resolve();
      let releaseCurrent!: () => void;
      let released = false;
      const currentLifecycle = new Promise<void>((resolve) => {
        releaseCurrent = resolve;
      });
      const queuedLifecycle = previousLifecycle.then(() => currentLifecycle);
      courseMutationQueues.set(queueKey, queuedLifecycle);
      const release = () => {
        if (released) return;
        released = true;
        releaseCurrent();
        if (courseMutationQueues.get(queueKey) === queuedLifecycle) {
          courseMutationQueues.delete(queueKey);
        }
      };

      try {
        await previousLifecycle;
        await queryClient.cancelQueries({ queryKey: planKeys.detail('my') });
        const activePlan = usePlanStore.getState().activePlan;
        const previousStatus = activePlan?.id === variables.planId
          ? activePlan.semesters
              .flatMap((semester) => semester.courses)
              .find((course) => course.id === variables.courseId)?.status
          : undefined;
        usePlanStore.getState().updateCourseStatus(
          variables.year,
          variables.term,
          variables.courseId,
          variables.status
        );
        return {
          planId: variables.planId,
          courseId: variables.courseId,
          previousStatus,
          release,
        };
      } catch (error) {
        release();
        throw error;
      }
    },
    onError: (
      _error: Error,
      _variables: UpdateCourseStatusInput,
      context: CourseStatusMutationContext | undefined
    ) => {
      if (!context || context.previousStatus === undefined) return;
      const { activePlan, updateCourseStatus } = usePlanStore.getState();
      if (!activePlan || activePlan.id !== context.planId) return;
      const currentSemester = activePlan.semesters.find((semester) =>
        semester.courses.some((course) => course.id === context.courseId)
      );
      if (!currentSemester) return;
      updateCourseStatus(
        currentSemester.year,
        currentSemester.term,
        context.courseId,
        context.previousStatus
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: graduationRequirementKeys.progress(),
      });
    },
    onSettled: async (
      _data: IPlan | undefined,
      _error: Error | null,
      _variables: UpdateCourseStatusInput,
      context: CourseStatusMutationContext | undefined
    ) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: planKeys.detail('my'),
          refetchType: 'none',
        });
      } finally {
        context?.release();
      }
    },
  };
}
```

The implementation keeps queue construction inline, releases on setup failure, never replaces the whole canonical query data during the mutation lifecycle, and memoizes the handler factory with `useMemo([queryClient])` so the queue survives rerenders. The current-plan query is marked stale for later normal lifecycle reconciliation.

- [x] **Step 4: Verify GREEN and task review**

Run: `npm test -- tests/course-status-rollback.test.ts`
Expected: 7/7 PASS. Independent task review must approve targeted rollback, moved-course handling, queue cleanup, same-course ordering, no immediate whole-plan hydration, and nonblocking progress invalidation.

---

### Task 2: 졸업요건 오류 및 재시도 상태

**Files:**
- Create: `src/lib/graduationSummaryState.ts`
- Modify: `src/components/features/RequirementsSummary.tsx`
- Test: `tests/graduation-summary-error-state.test.ts`

**Interfaces:**
- Consumes: both query data values, `isLoading`, `isError`, `isFetching`, `refetch`, and a local `retryingAfterError` latch
- Produces: `resolveGraduationSummaryState(input)` and `retryGraduationSummaryQueries(input)`

- [x] **Step 1: Write failing state-priority and retry lifecycle tests**

```ts
assert.equal(resolveGraduationSummaryState({
  requirement: undefined,
  progress: null,
  requirementIsLoading: false,
  progressIsLoading: false,
  requirementIsError: false,
  progressIsError: false,
  retryingAfterError: false,
}), 'loading');

assert.equal(resolveGraduationSummaryState({
  requirement: undefined,
  progress: undefined,
  requirementIsLoading: true,
  progressIsLoading: true,
  requirementIsError: false,
  progressIsError: false,
  retryingAfterError: true,
}), 'error');
```

Behavior tests use deferred refetch promises to prove both calls start together and the latch stays true until both settle, including rejection cleanup.

- [x] **Step 2: Run focused tests and verify RED**

Run: `npm test -- tests/graduation-summary-error-state.test.ts`
Expected: the initial implementation fails because query errors have no explicit branch; the first fix then fails retry-latch and undefined-data cases.

- [x] **Step 3: Implement resolver and retry helper**

```ts
interface GraduationSummaryStateInput {
  requirement: unknown | null | undefined;
  progress: unknown | null | undefined;
  requirementIsLoading: boolean;
  progressIsLoading: boolean;
  requirementIsError: boolean;
  progressIsError: boolean;
  retryingAfterError: boolean;
}

interface RetryGraduationSummaryQueriesInput {
  setRetryingAfterError: (value: boolean) => void;
  refetchRequirement: () => Promise<unknown>;
  refetchProgress: () => Promise<unknown>;
}

export function resolveGraduationSummaryState(input: GraduationSummaryStateInput) {
  if (input.retryingAfterError) return 'error';
  if (input.requirementIsLoading || input.progressIsLoading) return 'loading';
  if (input.requirementIsError || input.progressIsError) return 'error';
  if (input.requirement === undefined || input.progress === undefined) return 'loading';
  return input.requirement === null ? 'empty' : 'ready';
}

export async function retryGraduationSummaryQueries({
  setRetryingAfterError,
  refetchRequirement,
  refetchProgress,
}: RetryGraduationSummaryQueriesInput): Promise<void> {
  const errors: unknown[] = [];
  const settle = async (refetch: () => Promise<unknown>) => {
    try {
      await refetch();
    } catch (error) {
      errors.push(error);
    }
  };

  setRetryingAfterError(true);
  try {
    await Promise.all([
      settle(refetchRequirement),
      settle(refetchProgress),
    ]);
    if (errors.length > 0) throw errors[0];
  } finally {
    setRetryingAfterError(false);
  }
}
```

The real helper records individual rejections, waits for both refetches to settle, and rethrows the first unexpected rejection after cleanup.

- [x] **Step 4: Connect the error card and stable retry state**

```tsx
const [retryingAfterError, setRetryingAfterError] = useState(false);
const summaryState = resolveGraduationSummaryState({
  requirement: requirementQuery.data,
  progress: progressQuery.data,
  requirementIsLoading: requirementQuery.isLoading,
  progressIsLoading: progressQuery.isLoading,
  requirementIsError: requirementQuery.isError,
  progressIsError: progressQuery.isError,
  retryingAfterError,
});

if (summaryState === 'error') {
  return (
    <Card role="alert" className="border-red-200">
      <CardContent className="py-4 flex items-center justify-between gap-3">
        <p className="text-sm text-red-600">졸업요건 정보를 불러오지 못했습니다.</p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? '다시 시도 중...' : '다시 시도'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

The actual component keeps the existing card markup inline, retries both queries through the helper, captures unexpected rejection with Sentry, and renders `졸업요건 정보를 불러오지 못했습니다.`, `다시 시도`, or `다시 시도 중...` as appropriate.

- [x] **Step 5: Verify GREEN and task review**

Run: `npm test -- tests/graduation-summary-error-state.test.ts`
Expected: 11/11 PASS. Independent review must approve retry transition behavior, undefined safety, branch exclusivity, and accessible alert/button markup.

---

### Task 3: Whole-change review and publish-readiness proof

**Files:**
- Review: all modified implementation, tests, and design/plan documents

- [ ] **Step 1: Run focused and full automated tests**

Run: `npm test -- tests/course-status-rollback.test.ts tests/graduation-summary-error-state.test.ts`
Expected: 18/18 PASS.

Run: `npm test`
Expected: 115/115 PASS with zero failures.

- [ ] **Step 2: Run static and production checks**

Run: `npx tsc -p tsconfig.json --noEmit --pretty false`
Expected: exit 0 with no TypeScript errors.

Run: `npm run lint`
Expected: exit 0 with no ESLint errors.

Run: `npm run build`
Expected: exit 0 and production build completes.

- [ ] **Step 3: Run broad independent review and address every blocking finding**

Confirm targeted rollback never discards intervening plan changes, same-course requests serialize, canonical reconciliation always releases the queue, error/refetch transitions never show 0% or the normal empty card, and guest behavior stays local-only.

- [ ] **Step 4: Prove diff and push readiness without publishing**

Run: `git -c core.whitespace=cr-at-eol diff --check`
Expected: exit 0 with no whitespace errors.

Run: `git status --short`
Expected: only intentional implementation/docs/tests plus the pre-existing untracked `AGENTS.md` appear.

Run: `git push --dry-run origin main`
Expected: authentication and remote target succeed without changing the remote.

Run: `git rev-list --left-right --count main...origin/main`
Expected: `0 0`; uncommitted intentional changes remain outside this branch commit comparison.
