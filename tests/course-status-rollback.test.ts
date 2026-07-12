import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import * as courseStatusModule from '../src/hooks/useCourseStatus';
import { graduationRequirementKeys } from '../src/hooks/useGraduationRequirements';
import { planKeys } from '../src/hooks/usePlans';
import { usePlanStore } from '../src/stores/planStore';
import type { IPlan, Term } from '../src/types';

type CourseStatus = 'planned' | 'enrolled' | 'completed' | 'failed';
type InvalidateFilters = Parameters<QueryClient['invalidateQueries']>[0];

type UpdateCourseStatusInput = {
  planId: string;
  year: number;
  term: Term;
  courseId: string;
  status: CourseStatus;
  grade?: string;
};

type CourseStatusMutationHandlers = {
  onMutate: (
    variables: UpdateCourseStatusInput
  ) => Promise<{
    planId: string;
    courseId: string;
    previousStatus?: CourseStatus;
    release: () => void;
  }>;
  onError: (
    error: Error,
    variables: UpdateCourseStatusInput,
    context?: {
      planId: string;
      courseId: string;
      previousStatus?: CourseStatus;
      release: () => void;
    }
  ) => void;
  onSuccess: (data: IPlan, variables?: UpdateCourseStatusInput) => unknown;
  onSettled: (
    data?: IPlan,
    error?: Error | null,
    variables?: UpdateCourseStatusInput,
    context?: {
      planId: string;
      courseId: string;
      previousStatus?: CourseStatus;
      release: () => void;
    }
  ) => unknown;
};

type CourseStatusModule = {
  createCourseStatusMutationHandlers?: (
    queryClient: QueryClient
  ) => CourseStatusMutationHandlers;
};

const mutationInput: UpdateCourseStatusInput = {
  planId: 'plan-123',
  year: 2026,
  term: 'spring',
  courseId: 'course-1',
  status: 'completed',
};

function createActivePlan() {
  return {
    id: 'plan-123',
    semesters: [
      {
        year: 2026,
        term: 'spring' as const,
        courses: [
          {
            id: 'course-1',
            code: 'CSE101',
            name: 'Intro to Computing',
            credits: 3,
            category: 'major_required' as const,
            departmentId: 'department-1',
            status: 'planned' as const,
          },
        ],
      },
      {
        year: 2026,
        term: 'fall' as const,
        courses: [
          {
            id: 'course-2',
            code: 'CSE201',
            name: 'Data Structures',
            credits: 3,
            status: 'enrolled' as const,
          },
        ],
      },
    ],
  };
}

function createAuthoritativePlan(): IPlan {
  return {
    _id: { toString: () => 'plan-123' },
    user: { toString: () => 'user-1' },
    semesters: [],
    createdAt: new Date('2026-07-12T00:00:00.000Z'),
    updatedAt: new Date('2026-07-12T01:00:00.000Z'),
  } as unknown as IPlan;
}

function getHandlerFactory() {
  const factory = (courseStatusModule as unknown as CourseStatusModule)
    .createCourseStatusMutationHandlers;

  if (typeof factory !== 'function') {
    assert.fail('createCourseStatusMutationHandlers must be exported');
  }

  return factory;
}

afterEach(() => {
  usePlanStore.getState().setActivePlan(null);
});

test('optimistically updates status after capturing the scalar prior status', async () => {
  const queryClient = new QueryClient();
  usePlanStore.getState().setActivePlan(createActivePlan());
  const handlers = getHandlerFactory()(queryClient);

  const context = await handlers.onMutate(mutationInput);

  assert.equal(
    usePlanStore.getState().activePlan?.semesters[0]?.courses[0]?.status,
    'completed'
  );
  assert.equal(context.previousStatus, 'planned');

  await handlers.onSettled(undefined, null, mutationInput, context);
  queryClient.clear();
});

test('rolls back only the moved course status and preserves intervening plan edits', async () => {
  const queryClient = new QueryClient();
  usePlanStore.getState().setActivePlan(createActivePlan());
  const handlers = getHandlerFactory()(queryClient);

  const context = await handlers.onMutate(mutationInput);

  usePlanStore.getState().addCourseToSemester(2027, 'spring', {
    id: 'course-3',
    code: 'CSE301',
    name: 'Operating Systems',
    credits: 3,
    status: 'planned',
  });
  usePlanStore.getState().moveCourse(
    2026,
    'spring',
    2027,
    'fall',
    mutationInput.courseId
  );
  usePlanStore.getState().updateCourseStatus(
    2026,
    'fall',
    'course-2',
    'failed'
  );

  handlers.onError(new Error('request failed'), mutationInput, context);

  const currentPlan = usePlanStore.getState().activePlan;
  const movedSemester = currentPlan?.semesters.find((semester) =>
    semester.courses.some((course) => course.id === mutationInput.courseId)
  );
  const movedCourse = movedSemester?.courses.find(
    (course) => course.id === mutationInput.courseId
  );
  const unrelatedCourse = currentPlan?.semesters
    .flatMap((semester) => semester.courses)
    .find((course) => course.id === 'course-2');

  assert.equal(movedSemester?.year, 2027);
  assert.equal(movedSemester?.term, 'fall');
  assert.equal(movedCourse?.status, 'planned');
  assert.equal(unrelatedCourse?.status, 'failed');
  assert.ok(
    currentPlan?.semesters.some((semester) =>
      semester.courses.some((course) => course.id === 'course-3')
    )
  );

  await handlers.onSettled(
    undefined,
    new Error('request failed'),
    mutationInput,
    context
  );
  queryClient.clear();
});

test('serializes overlapping same-course lifecycles so two failures restore the original status', async () => {
  const queryClient = new QueryClient();
  usePlanStore.getState().setActivePlan(createActivePlan());
  const handlers = getHandlerFactory()(queryClient);
  const firstInput = { ...mutationInput, status: 'completed' as const };
  const secondInput = { ...mutationInput, status: 'failed' as const };

  const firstContext = await handlers.onMutate(firstInput);
  let secondStarted = false;
  const secondContextPromise = handlers.onMutate(secondInput).then((context) => {
    secondStarted = true;
    return context;
  });

  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(
    secondStarted,
    false,
    'the second optimistic lifecycle must wait for the first to settle'
  );

  const firstError = new Error('first request failed');
  handlers.onError(firstError, firstInput, firstContext);
  await handlers.onSettled(undefined, firstError, firstInput, firstContext);

  const secondContext = await secondContextPromise;
  assert.equal(
    usePlanStore.getState().activePlan?.semesters[0]?.courses[0]?.status,
    'failed'
  );

  const secondError = new Error('second request failed');
  handlers.onError(secondError, secondInput, secondContext);
  await handlers.onSettled(undefined, secondError, secondInput, secondContext);

  assert.equal(
    usePlanStore.getState().activePlan?.semesters[0]?.courses[0]?.status,
    'planned'
  );
  queryClient.clear();
});

test('uses the canonical current-plan key for cancellation and settled reconciliation', async (t) => {
  const queryClient = new QueryClient();
  const cancelQueries = t.mock.method(queryClient, 'cancelQueries');
  const invalidateQueries = t.mock.method(queryClient, 'invalidateQueries');
  usePlanStore.getState().setActivePlan(createActivePlan());
  const handlers = getHandlerFactory()(queryClient);

  const context = await handlers.onMutate(mutationInput);
  await handlers.onSettled(undefined, null, mutationInput, context);

  assert.deepEqual(cancelQueries.mock.calls[0]?.arguments[0], {
    queryKey: planKeys.detail('my'),
  });
  assert.deepEqual(invalidateQueries.mock.calls[0]?.arguments[0], {
    queryKey: planKeys.detail('my'),
    refetchType: 'none',
  });
  assert.notDeepEqual(cancelQueries.mock.calls[0]?.arguments[0], {
    queryKey: planKeys.detail(mutationInput.planId),
  });
  queryClient.clear();
});

test('settled invalidation does not refetch an active plan or rehydrate over intervening edits', async (t) => {
  const queryClient = new QueryClient();
  const queryKey = planKeys.detail('my');
  const serverPlan = createActivePlan();
  queryClient.setQueryData(queryKey, serverPlan);
  let fetchCount = 0;
  const observer = new QueryObserver(queryClient, {
    queryKey,
    queryFn: async () => {
      fetchCount += 1;
      return structuredClone(serverPlan);
    },
    staleTime: Infinity,
  });
  let lastHydratedData = observer.getCurrentResult().data;
  const unsubscribe = observer.subscribe((result) => {
    if (result.data && result.data !== lastHydratedData) {
      lastHydratedData = result.data;
      usePlanStore.getState().setActivePlan(structuredClone(result.data));
    }
  });
  t.after(() => {
    unsubscribe();
    queryClient.clear();
  });
  usePlanStore.getState().setActivePlan(structuredClone(serverPlan));
  const handlers = getHandlerFactory()(queryClient);
  const context = await handlers.onMutate(mutationInput);

  usePlanStore.getState().addCourseToSemester(2027, 'spring', {
    id: 'course-3',
    code: 'CSE301',
    name: 'Operating Systems',
    credits: 3,
    status: 'planned',
  });
  const error = new Error('request failed');
  handlers.onError(error, mutationInput, context);

  assert.equal(fetchCount, 0, 'the observer must start from seeded fresh data');
  await handlers.onSettled(undefined, error, mutationInput, context);

  assert.equal(fetchCount, 0, 'settled invalidation must not immediately refetch');
  assert.equal(queryClient.getQueryState(queryKey)?.isInvalidated, true);
  assert.ok(
    usePlanStore.getState().activePlan?.semesters.some((semester) =>
      semester.courses.some((course) => course.id === 'course-3')
    ),
    'observer hydration must not erase the intervening course edit'
  );
});

test('onSuccess invalidates graduation progress without replacing current-plan query data', (t) => {
  const queryClient = new QueryClient();
  const invalidateQueries = t.mock.method(queryClient, 'invalidateQueries');
  const existingPlan = createAuthoritativePlan();
  const authoritativePlan = createAuthoritativePlan();
  queryClient.setQueryData(planKeys.detail('my'), existingPlan);
  const handlers = getHandlerFactory()(queryClient);

  handlers.onSuccess(authoritativePlan, mutationInput);

  assert.deepEqual(invalidateQueries.mock.calls[0]?.arguments[0], {
    queryKey: graduationRequirementKeys.progress(),
  });
  assert.strictEqual(queryClient.getQueryData(planKeys.detail('my')), existingPlan);
  queryClient.clear();
});

test('onSuccess progress invalidation cannot delay settled queue release', async (t) => {
  const queryClient = new QueryClient();
  let progressInvalidationStarted = false;
  const pendingProgressInvalidation = new Promise<void>(() => undefined);
  t.mock.method(queryClient, 'invalidateQueries', (filters: InvalidateFilters) => {
    if (
      JSON.stringify(filters?.queryKey) ===
      JSON.stringify(graduationRequirementKeys.progress())
    ) {
      progressInvalidationStarted = true;
      return pendingProgressInvalidation;
    }
    return Promise.resolve();
  });
  usePlanStore.getState().setActivePlan(createActivePlan());
  const handlers = getHandlerFactory()(queryClient);
  const firstInput = { ...mutationInput, status: 'completed' as const };
  const secondInput = { ...mutationInput, status: 'failed' as const };
  const firstContext = await handlers.onMutate(firstInput);
  const secondContextPromise = handlers.onMutate(secondInput);

  const successResult = handlers.onSuccess(
    createAuthoritativePlan(),
    firstInput
  );
  let settledFinished = false;
  const lifecyclePromise = Promise.resolve(successResult)
    .then(() =>
      handlers.onSettled(
        createAuthoritativePlan(),
        null,
        firstInput,
        firstContext
      )
    )
    .then(() => {
      settledFinished = true;
    });

  await new Promise<void>((resolve) => setImmediate(resolve));

  assert.equal(progressInvalidationStarted, true);
  assert.equal(
    successResult,
    undefined,
    'onSuccess must not return the unrelated invalidation promise'
  );
  assert.equal(
    settledFinished,
    true,
    'onSettled must run without waiting for graduation progress invalidation'
  );

  const secondContext = await secondContextPromise;
  const secondError = new Error('second request failed');
  handlers.onError(secondError, secondInput, secondContext);
  await handlers.onSettled(undefined, secondError, secondInput, secondContext);
  await lifecyclePromise;
  queryClient.clear();
});
