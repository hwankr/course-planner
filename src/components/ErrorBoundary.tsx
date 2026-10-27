'use client';

import * as Sentry from '@sentry/nextjs';
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] min-w-0 flex-col items-start justify-center gap-3 py-8" role="alert">
          <div className="w-full min-w-0 space-y-2">
            <h2 className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">문제가 발생했습니다</h2>
            <p className="m-0 text-[13px] leading-[18px] font-medium text-ink-2">
              일시적인 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>
            {this.state.error && process.env.NODE_ENV !== 'production' && (
              <details className="mt-4 w-full max-w-xl">
                <summary className="cursor-pointer text-[13px] text-ink-2 hover:text-ink">
                  오류 상세 정보
                </summary>
                <pre className="mt-2 overflow-auto bg-fill p-3 text-[12px] leading-4 text-ink">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="-ml-2.5 h-10 rounded-[8px] px-2.5 text-[14px] font-semibold text-primary transition-colors duration-150 hover:text-primary-hover"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
