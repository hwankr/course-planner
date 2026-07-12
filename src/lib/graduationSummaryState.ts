export type GraduationSummaryState = 'loading' | 'error' | 'empty' | 'ready';

export interface GraduationSummaryStateInput {
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

export function resolveGraduationSummaryState(
  input: GraduationSummaryStateInput
): GraduationSummaryState {
  if (input.retryingAfterError) {
    return 'error';
  }

  if (input.requirementIsLoading || input.progressIsLoading) {
    return 'loading';
  }

  if (input.requirementIsError || input.progressIsError) {
    return 'error';
  }

  if (input.requirement === undefined || input.progress === undefined) {
    return 'loading';
  }

  if (input.requirement === null) {
    return 'empty';
  }

  return 'ready';
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

    if (errors.length > 0) {
      throw errors[0];
    }
  } finally {
    setRetryingAfterError(false);
  }
}
