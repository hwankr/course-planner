// AddSemesterDialog — props copied from src/components/features/AddSemesterDialog.tsx (documentation only, not type-checked).
// The source interface is module-private; it is exported here for the design system.

/** Semester half, from src/types/index.ts. 'spring' renders as 1학기, 'fall' as 2학기. */
export type Term = 'spring' | 'fall';

export interface AddSemesterDialogProps {
  /** Mount switch: when false the component returns null (no overlay, no panel); the window keydown listener stays registered while the component is mounted and simply ignores Escape until isOpen is true. */
  isOpen: boolean;
  /** Called on Escape (window keydown), on a click on the overlay outside the panel, and by the 취소 Button. */
  onClose: () => void;
  /** Called on form submit with the chosen grade year (1–5) and term, only when the pair is not a duplicate and isLoading is false. */
  onAdd: (year: number, term: Term) => void;
  /** Semesters already in the plan: seeds the default selection (the one after the latest, year capped at 5; 1학년 1학기 when empty) and drives the duplicate warning. */
  existingSemesters: Array<{ year: number; term: Term }>;
  /** Default false. Disables every control, dims the segments to opacity 0.5 with cursor not-allowed, and puts 추가 in its spinner + 로딩중... state. */
  isLoading?: boolean;
}

/** Function component. No ref, no children, no className; the overlay is `fixed inset-0 z-50`. */
export declare function AddSemesterDialog(props: AddSemesterDialogProps): JSX.Element | null;
