"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

export default function GlobalError({
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
    <html lang="ko">
      <body className="bg-white text-ink antialiased">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-3 px-5 py-8" role="alert">
          <h2 className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">심각한 오류가 발생했습니다</h2>
          <p className="m-0 text-[13px] leading-[18px] font-medium text-ink-2">예상치 못한 오류가 발생했습니다. 페이지를 새로고침해주세요.</p>
          <button
            type="button"
            onClick={() => reset()}
            className="-ml-2.5 h-10 rounded-[8px] px-2.5 text-[14px] font-semibold text-primary transition-colors duration-150 hover:text-primary-hover"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
