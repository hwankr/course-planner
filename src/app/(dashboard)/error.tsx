'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-start justify-center gap-3 py-8" role="alert">
      <h2 className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">문제가 발생했습니다</h2>
      <p className="m-0 text-[13px] leading-[18px] font-medium text-ink-2">일시적인 오류가 발생했습니다. 다시 시도해주세요.</p>
      {process.env.NODE_ENV !== 'production' && error.message && (
        <details className="w-full max-w-xl">
          <summary className="cursor-pointer text-[13px] text-ink-2">오류 상세 정보</summary>
          <pre className="mt-2 overflow-auto rounded-[10px] bg-fill p-3 text-[12px] leading-4 text-ink">{error.message}</pre>
        </details>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="-ml-2.5 h-10 rounded-[8px] px-2.5 text-[14px] font-semibold text-primary transition-colors duration-150 hover:text-primary-hover"
      >
        다시 시도
      </button>
    </div>
  );
}
