/**
 * StatusStates — documentation-only types for the status-state PATTERN (loading, empty and error
 * markup repeated inline in pages). No component exists in the source; these are the props of the
 * Next.js special files and the guard that render it, plus the recipe names used by the stylesheet.
 */

/** Props Next.js passes to src/app/(dashboard)/error.tsx and src/app/global-error.tsx. */
export interface ErrorPageProps {
  /** The thrown error; `digest` is Next's hash for server-side errors. `message` renders only when NODE_ENV !== 'production'. */
  error: Error & { digest?: string };
  /** Re-renders the failed segment; both files call it from the 다시 시도 button. */
  reset: () => void;
}

/** src/components/providers/OnboardingGuard.tsx */
export interface OnboardingGuardProps {
  /** Rendered once the stores are hydrated and the session is authenticated and onboarded; the arc spinner shows meanwhile. */
  children: React.ReactNode;
}

/** The three spinner recipes, named by source: loading.tsx ring, OnboardingGuard arc (planner at 48px), Lucide Loader2. */
export type StatusSpinnerRecipe = 'ring' | 'arc' | 'arc-lg' | 'loader';

/** Skeleton recipes: RequirementsSummary bar, admin title and blocks (block-lg = h-64), calendar cell. */
export type StatusSkeletonRecipe = 'bar' | 'title' | 'block' | 'block-lg' | 'cell';

/** Statistics Card icon variants: BarChart3 (no data), AlertCircle (fetch error), Info (department not set). */
export type StatusStatIcon = 'bar-chart-3' | 'alert-circle' | 'info';

/** Which piece of the pattern a block of markup renders. */
export type StatusStateKind =
  | 'loading'
  | 'skeleton'
  | 'error-page'
  | 'global-error'
  | 'not-found'
  | 'stat-card'
  | 'empty-box'
  | 'list-empty'
  | 'banner';

export interface StatusStatesProps {
  /** The state block being rendered. */
  kind: StatusStateKind;
  /** Spinner recipe when `kind` is 'loading'. */
  spinner?: StatusSpinnerRecipe;
  /** Skeleton recipe when `kind` is 'skeleton'. */
  skeleton?: StatusSkeletonRecipe;
  /** Heading text — the <h2> of a page column or stat card, or the first line of a list empty state. */
  title?: string;
  /** Body text — the <p> under the heading, or the sole line of the admin box and banner. */
  body?: string;
  /** Action label: a <button onClick={reset}> on the error pages, a next/link on the 404 and the stat card. */
  action?: string;
  /** href of the Link variants: '/planner' on not-found.tsx, '/profile' on the statistics Cards. */
  href?: string;
  /** Statistics Card icon when `kind` is 'stat-card'. */
  icon?: StatusStatIcon;
}
