// AnonymousPlanModal — props copied from src/components/features/AnonymousPlanModal.tsx (documentation only, not type-checked).
// The source interface is module-private; it is exported here for the design system.

/** The fetched plan, from src/types/index.ts AnonymousPlanDetail. Loaded inside the component by useAnonymousPlanDetail(anonymousId, departmentId); never passed in. */
export interface AnonymousPlanDetail {
  /** Opaque per-department id the detail was fetched by. */
  anonymousId: string;
  /** Semesters in storage order; the modal groups them by `year` ascending and sorts with a one-argument comparator `(a) => a.term === 'spring' ? -1 : 1` (spring first for a two-semester year, not a general sort), rendering one ReadOnlySemesterColumn per entry. */
  semesters: Array<{
    /** Academic year — the "{year}학년" group heading and the start of each card title. */
    year: number;
    /** 'spring' renders 1학기 (and is intended to sort first); any other string renders 2학기. */
    term: string;
    /** Course rows handed to ReadOnlySemesterColumn; their total count feeds "{n}과목" in the header. */
    courses: Array<{
      /** Course code, shown under the name in the card row. */
      code: string;
      /** Course name, truncated to one line in the card row. */
      name: string;
      /** Credits, shown as "{credits}학점" in the row and summed by the card. */
      credits: number;
      /** Category key (major_required … free_elective) that picks the card chip's label and colors. */
      category: string;
    }>;
  }>;
  /** Credits across the whole plan — rendered as "총 {totalCredits}학점". */
  totalCredits: number;
}

export interface AnonymousPlanModalProps {
  /** Mount switch: when false the component returns null and the detail query is disabled (the hook receives null). Both call sites pass true and mount the component only while a plan is selected. */
  isOpen: boolean;
  /** Called on Escape (document keydown), on a click on the overlay outside the panel, by the 닫기 button, and automatically 2 seconds after a fetch error. */
  onClose: () => void;
  /** The plan to load with useAnonymousPlanDetail; null disables the query. A 404 (stale id) is not retried (the hook's `meta.onError` invalidation is never wired by the app's QueryClient). */
  anonymousId: string | null;
  /** Department scope forwarded to the detail query; omitted → unscoped. */
  departmentId?: string;
}

/** Function component. No ref, no children, no className; the overlay is `fixed inset-0 z-50`, above AllPlansModal (z-40). */
export declare function AnonymousPlanModal(props: AnonymousPlanModalProps): JSX.Element | null;
