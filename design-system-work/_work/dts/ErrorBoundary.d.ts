// ErrorBoundary — props and state copied from src/components/ErrorBoundary.tsx. The source exports only the class;
// the two interfaces are module-private there and exported here for documentation. Not type-checked.
import type * as React from 'react';

/** Props of the class component. */
export interface ErrorBoundaryProps {
  /** The subtree to guard; returned unchanged until a descendant throws during render. */
  children: React.ReactNode;
  /** Optional replacement for the built-in fallback card; returned as-is when set. No call site in the app passes it. */
  fallback?: React.ReactNode;
}

/** Internal state. */
export interface ErrorBoundaryState {
  /** True once getDerivedStateFromError has caught an error; switches the render to `fallback` or the built-in card. */
  hasError: boolean;
  /** The caught Error, whose message and stack fill the dev-only <details>; null before any error. */
  error: Error | null;
}

/** Client class component ('use client'); mount once around a page region. */
export declare class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /** Returns { hasError: true, error } from the thrown value. */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState;
  /** Reports to Sentry with the component stack as `extra.componentStack`. */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
  /** Retry handler wired to 다시 시도: window.location.reload(). */
  handleReset: () => void;
  render(): React.ReactNode;
}
