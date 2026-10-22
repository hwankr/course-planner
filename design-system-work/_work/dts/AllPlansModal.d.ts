// AllPlansModal — props copied from src/components/features/AllPlansModal.tsx (documentation only, not type-checked).
// The source interface is module-private; it is exported here for the design system.

/** One list row, from src/types/index.ts AnonymousPlanSummary. Fetched inside the component by useAnonymousPlans; never passed in. */
export interface AnonymousPlanSummary {
  /** Opaque per-department id; handed to AnonymousPlanModal when the plan card is clicked. */
  anonymousId: string;
  /** Credits across the whole plan — rendered as "{totalCredits}학점". */
  totalCredits: number;
  /** Course count — rendered as "{totalCourses}개 과목". */
  totalCourses: number;
  /** Semester count — rendered as "{semesterCount}개 학기". */
  semesterCount: number;
}

export interface AllPlansModalProps {
  /** Mount switch: when false the component returns null and queues a reset of the page (back to 1) and the selected plan (null). */
  isOpen: boolean;
  /** Called on Escape (document keydown) and on a click on the overlay outside the panel — both only while no detail modal is open — and by the 닫기 button. */
  onClose: () => void;
  /** Department whose anonymous plans are listed; forwarded to useAnonymousPlans(departmentId, page, 9, isOpen) and to the AnonymousPlanModal detail. Omitted → the API uses the signed-in user's department, or answers 400 for a guest. */
  departmentId?: string;
}

/** Function component. No ref, no children, no className; the overlay is `fixed inset-0 z-40` and the detail modal opens above it at z-50. */
export declare function AllPlansModal(props: AllPlansModalProps): JSX.Element | null;
