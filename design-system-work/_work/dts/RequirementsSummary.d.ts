// RequirementsSummary — props documentation (not type-checked).
// Source: src/components/features/RequirementsSummary.tsx, src/lib/graduationSummaryState.ts

/** The widget takes no props: it reads TanStack Query hooks (useGraduationRequirement, useGraduationProgress), next-auth session and the guest/plan Zustand stores itself. */
export interface RequirementsSummaryProps {}

/** The four render branches, resolved by resolveGraduationSummaryState(). */
export type GraduationSummaryState = 'loading' | 'error' | 'empty' | 'ready';

/** Input to resolveGraduationSummaryState(); query flags collapse to one GraduationSummaryState. */
export interface GraduationSummaryStateInput {
  /** Saved requirement; undefined = not loaded yet, null = none saved (→ 'empty'). */
  requirement: unknown | null | undefined;
  /** Computed progress; undefined = not loaded yet. */
  progress: unknown | null | undefined;
  /** useGraduationRequirement().isLoading → 'loading'. */
  requirementIsLoading: boolean;
  /** useGraduationProgress().isLoading → 'loading'. */
  progressIsLoading: boolean;
  /** useGraduationRequirement().isError → 'error'. */
  requirementIsError: boolean;
  /** useGraduationProgress().isError → 'error'. */
  progressIsError: boolean;
  /** True while the 다시 시도 refetch runs; keeps the card in 'error'. */
  retryingAfterError: boolean;
}

/** Credit counts shared by StackedBar, BreakdownLine and TrackRow. met = required > 0 && earned >= required. */
export interface SegmentValues {
  /** Credits already earned (이수); drawn blue-600, emerald-500 once met. */
  earned: number;
  /** Credits currently enrolled (수강중); drawn sky-400. Default 0. */
  enrolled?: number;
  /** Credits planned (예정); drawn with the blue hatch. Default 0. */
  planned?: number;
  /** Credits required by the rule; the 100% width of the bar. */
  required: number;
}

/** Internal: the stacked earned → enrolled → planned bar inside a gray-100 track. */
export interface StackedBarProps extends SegmentValues {
  /** Track height: 'lg' h-2.5 (hero), 'md' h-2 (track row), 'sm' h-1.5 (sub row). Default 'md'. */
  size?: 'lg' | 'md' | 'sm';
}

/** Internal: the 8px-swatch legend under a bar; collapses to "요건 충족" when met with nothing enrolled or planned. */
export interface BreakdownLineProps extends SegmentValues {
  /** Prior (transcript) credits included in earned; renders "(기이수 N 포함)" when > 0. Default 0. */
  prior?: number;
  /** Extra classes from the caller: 'mt-1.5' (hero) or 'mt-0.5 pl-[72px]' (track rows). Default ''. */
  className?: string;
}

/** Internal: one requirement row — label, bar, "earned/required", legend. */
export interface TrackRowProps extends SegmentValues {
  /** Row label: 전공, 핵심, 주전공최소, 복수전공, 부전공, 교양. */
  label: string;
  /** Prior credits forwarded to BreakdownLine. Default 0. */
  prior?: number;
  /** Indented thin sub-row prefixed "└ " (text-[11px] gray-400, bar size 'sm'). Default false. */
  sub?: boolean;
}
