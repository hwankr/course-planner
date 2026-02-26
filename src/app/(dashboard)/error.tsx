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
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-red-100 p-3">
        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">문제가 발생했습니다</h2>
        <p className="text-sm text-gray-600">일시적인 오류가 발생했습니다. 다시 시도해주세요.</p>
        {process.env.NODE_ENV !== 'production' && error.message && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">오류 상세 정보</summary>
            <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-700">{error.message}</pre>
          </details>
        )}
      </div>
      <button
        onClick={() => reset()}
        className="rounded-md bg-[#153974] px-4 py-2 text-sm font-medium text-white hover:bg-[#003E7E] focus:outline-none focus:ring-2 focus:ring-[#00AACA] focus:ring-offset-2"
      >
        다시 시도
      </button>
    </div>
  );
}
