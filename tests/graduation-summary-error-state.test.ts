import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

type SummaryStateInput = {
  requirement: unknown | null | undefined;
  progress: unknown | null | undefined;
  requirementIsLoading: boolean;
  progressIsLoading: boolean;
  requirementIsError: boolean;
  progressIsError: boolean;
  retryingAfterError: boolean;
};

async function loadResolver() {
  try {
    return await import('../src/lib/graduationSummaryState');
  } catch (error) {
    assert.fail(`graduation summary state resolver is unavailable: ${String(error)}`);
  }
}

function settledInput(overrides: Partial<SummaryStateInput> = {}): SummaryStateInput {
  return {
    requirement: null,
    progress: null,
    requirementIsLoading: false,
    progressIsLoading: false,
    requirementIsError: false,
    progressIsError: false,
    retryingAfterError: false,
    ...overrides,
  };
}

function deferred<T>() {
  let resolvePromise!: (value: T | PromiseLike<T>) => void;
  let rejectPromise!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

test('requirement API error with no requirement resolves to error instead of empty', async () => {
  const { resolveGraduationSummaryState } = await loadResolver();

  assert.equal(
    resolveGraduationSummaryState(
      settledInput({ requirement: undefined, requirementIsError: true })
    ),
    'error'
  );
});

test('progress API error with a requirement resolves to error instead of ready', async () => {
  const { resolveGraduationSummaryState } = await loadResolver();

  assert.equal(
    resolveGraduationSummaryState(
      settledInput({ requirement: { totalCredits: 130 }, progressIsError: true })
    ),
    'error'
  );
});

test('successful null requirement resolves to empty', async () => {
  const { resolveGraduationSummaryState } = await loadResolver();

  assert.equal(resolveGraduationSummaryState(settledInput()), 'empty');
});

test('successful present requirement resolves to ready', async () => {
  const { resolveGraduationSummaryState } = await loadResolver();

  assert.equal(
    resolveGraduationSummaryState(
      settledInput({
        requirement: { totalCredits: 130 },
        progress: { total: { percentage: 50 } },
      })
    ),
    'ready'
  );
});

test('initial loading has priority over query errors', async () => {
  const { resolveGraduationSummaryState } = await loadResolver();

  assert.equal(
    resolveGraduationSummaryState(
      settledInput({
        requirement: undefined,
        progress: undefined,
        requirementIsLoading: true,
        progressIsError: true,
      })
    ),
    'loading'
  );
});

test('retry latch keeps a no-data refetch in the error state despite transient query flags', async () => {
  const { resolveGraduationSummaryState } = await loadResolver();

  assert.equal(
    resolveGraduationSummaryState(
      settledInput({
        requirement: undefined,
        progress: undefined,
        requirementIsLoading: true,
        progressIsLoading: true,
        requirementIsError: false,
        progressIsError: false,
        retryingAfterError: true,
      })
    ),
    'error'
  );
});

test('settled undefined requirement data never resolves to ready', async () => {
  const { resolveGraduationSummaryState } = await loadResolver();

  assert.equal(
    resolveGraduationSummaryState(
      settledInput({ requirement: undefined, progress: { total: {} } })
    ),
    'loading'
  );
});

test('settled undefined progress data never resolves to ready', async () => {
  const { resolveGraduationSummaryState } = await loadResolver();

  assert.equal(
    resolveGraduationSummaryState(
      settledInput({ requirement: { totalCredits: 130 }, progress: undefined })
    ),
    'loading'
  );
});

test('retry helper starts both refetches and keeps the latch set until both settle', async () => {
  const { retryGraduationSummaryQueries } = await loadResolver();
  assert.equal(typeof retryGraduationSummaryQueries, 'function');

  const requirementRefetch = deferred<void>();
  const progressRefetch = deferred<void>();
  const events: string[] = [];
  const retryPromise = retryGraduationSummaryQueries({
    setRetryingAfterError(value: boolean) {
      events.push(`retrying:${value}`);
    },
    refetchRequirement() {
      events.push('requirement:start');
      return requirementRefetch.promise;
    },
    refetchProgress() {
      events.push('progress:start');
      return progressRefetch.promise;
    },
  });

  assert.deepEqual(events, [
    'retrying:true',
    'requirement:start',
    'progress:start',
  ]);

  requirementRefetch.resolve();
  await Promise.resolve();
  assert.equal(events.includes('retrying:false'), false);

  progressRefetch.resolve();
  await retryPromise;
  assert.equal(events.at(-1), 'retrying:false');
});

test('retry helper clears the latch after a failed refetch and waits for both calls to settle', async () => {
  const { retryGraduationSummaryQueries } = await loadResolver();
  assert.equal(typeof retryGraduationSummaryQueries, 'function');

  const expectedError = new Error('unexpected refetch failure');
  const requirementRefetch = deferred<void>();
  const progressRefetch = deferred<void>();
  const latchStates: boolean[] = [];
  const retryPromise = retryGraduationSummaryQueries({
    setRetryingAfterError(value: boolean) {
      latchStates.push(value);
    },
    refetchRequirement: () => requirementRefetch.promise,
    refetchProgress: () => progressRefetch.promise,
  });
  const rejected = assert.rejects(retryPromise, expectedError);

  requirementRefetch.reject(expectedError);
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(latchStates, [true]);

  progressRefetch.resolve();
  await rejected;
  assert.deepEqual(latchStates, [true, false]);
});

test('requirements summary renders query failures and retries both queries', async () => {
  const source = await readFile(
    new URL('../src/components/features/RequirementsSummary.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /const requirementQuery = useGraduationRequirement\(\);/);
  assert.match(source, /const progressQuery = useGraduationProgress\(\);/);
  assert.match(
    source,
    /const \[retryingAfterError, setRetryingAfterError\] = useState\(false\);/
  );
  assert.match(source, /\n\s*progress,\s*\n/);
  assert.match(source, /retryingAfterError,/);
  assert.match(source, /if \(summaryState === 'error'\)/);
  assert.match(source, /role="alert"/);

  const retryHandler = source.match(
    /const handleRetry = async \(\) => \{([\s\S]*?)\n  \};/
  )?.[1];
  assert.ok(retryHandler, 'retry handler source should be present');
  assert.match(retryHandler, /retryGraduationSummaryQueries\(\{/);
  assert.match(
    retryHandler,
    /refetchRequirement:\s*\(\) => requirementQuery\.refetch\(\)/
  );
  assert.match(
    retryHandler,
    /refetchProgress:\s*\(\) => progressQuery\.refetch\(\)/
  );
  assert.match(retryHandler, /setRetryingAfterError/);
  assert.match(retryHandler, /Sentry\.captureException\(error\)/);

  assert.match(source, /disabled=\{isRetrying\}/);
  assert.match(source, /졸업요건 정보를 불러오지 못했습니다\./);
  assert.match(source, /'다시 시도'/);
  assert.match(source, /'다시 시도 중\.\.\.'/);
});
