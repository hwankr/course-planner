/**
 * ModalShell — documentation-only types for the modal-shell PATTERN: the overlay + panel markup the app
 * repeats inline around seven dialogs (six panel recipes; the admin/courses and admin/departments create/edit
 * forms share admin-form). No shell component exists in the source; these are the props of the
 * three components that render one, the page state the admin and calendar pages key theirs on, and the
 * recipe names the stylesheet uses.
 */

/** Which source recipe a shell follows (one .cp-modal__panel--* modifier each). */
export type ModalShellRecipe =
  | 'custom-course'   // CustomCourseForm.tsx — rounded-lg shadow-xl max-w-md, p-4 gutter
  | 'add-semester'    // AddSemesterDialog.tsx — Card panel, max-w-md, no gutter
  | 'all-plans'       // AllPlansModal.tsx — rounded-xl shadow-2xl max-w-4xl, gray-50 bands, z-40
  | 'admin-form'      // admin/courses + admin/departments — rounded-2xl p-6 shadow-xl max-w-lg
  | 'admin-confirm'   // admin/departments — rounded-2xl p-6 shadow-xl max-w-sm
  | 'calendar-event'; // calendar/page.tsx — Card panel, max-w-lg, opaque overlay

/** Overlay fill: bg-black/50 with or without the p-4 gutter, or the calendar's v3 `bg-black bg-opacity-50` that compiles to solid black under Tailwind v4. */
export type ModalOverlayRecipe = 'black-a50' | 'black-a50-gutter' | 'opaque-black';

/** The contract every shell shares, as the pages use it (not an interface in the source). */
export interface ModalShellProps {
  /** Source recipe; picks the panel's radius, shadow, max-width and header/footer layout. */
  recipe: ModalShellRecipe;
  /** Closes the dialog; (b) and (c) also call it on backdrop click and Escape. */
  onClose: () => void;
  /** Header text: `커스텀 과목 추가`, `학기 추가`, `익명 수강계획 전체 보기`, `과목 추가`/`과목 수정`, `학과 추가`/`학과 수정`, `학과 삭제`, `일정 추가`/`일정 수정`. */
  title: string;
  /** Optional body-sm gray-500 line under the title; only (a) and (c) render one. */
  subtitle?: string;
  /** Whether the header carries the hand-rolled X button; true for (c), (d courses) and (e) only. */
  closeButton?: boolean;
  /** The inner form, list or confirm text and its action row — the shell's children. */
  children?: React.ReactNode;
}

/** src/components/features/CustomCourseForm.tsx — mounted by the parent only while open. */
export interface CustomCourseFormProps {
  /** Closes the modal after a successful create or on 취소. */
  onClose: () => void;
  /** Department the custom course is created under; submit is disabled without it. */
  departmentId?: string;
  /** Restricts the 이수구분 select; defaults to every RequirementCategory. */
  availableCategories?: RequirementCategory[];
  /** Semester the new course is auto-added to; submit is disabled while null. */
  focusedSemester?: { year: number; term: string } | null;
  /** Called with the created course so the planner can place it in the focused semester. */
  onClickAdd?: (
    courseId: string,
    courseData: { code: string; name: string; credits: number; category?: RequirementCategory; departmentId?: string }
  ) => void;
}

/** src/components/features/AddSemesterDialog.tsx */
export interface AddSemesterDialogProps {
  /** Renders nothing while false; recomputes the year/term defaults when it turns true. */
  isOpen: boolean;
  /** Called on 취소, backdrop click and Escape. */
  onClose: () => void;
  /** Called on submit with the chosen grade year and term. */
  onAdd: (year: number, term: Term) => void;
  /** Existing semesters, used for the smart default and the duplicate warning. */
  existingSemesters: Array<{ year: number; term: Term }>;
  /** Disables every control and shows the Button spinner (default false). */
  isLoading?: boolean;
}

/** src/components/features/AllPlansModal.tsx */
export interface AllPlansModalProps {
  /** Renders nothing while false; locks body scroll and focuses the panel while true. */
  isOpen: boolean;
  /** Called on the 닫기 button, backdrop click and Escape (unless a detail modal is open). */
  onClose: () => void;
  /** Department whose anonymous plans are listed. */
  departmentId?: string;
}

/** Page state the admin and calendar shells are keyed on (no props; each page owns the modal). */
export interface InlineModalPageState {
  /** admin/courses, admin/departments: the create/edit form modal is open. */
  showForm: boolean;
  /** admin/departments: the delete confirm is open for this id. */
  deleteConfirmId: string | null;
  /** calendar: the event form modal is open. */
  showEventForm: boolean;
  /** admin pages: disables the submit button (and the departments form's 취소) and swaps its label to 저장 중.... */
  isSaving: boolean;
  /** admin/courses: switches the 과목 추가→과목 수정 title and the 추가→수정 submit label (CourseItem: see AdminList). */
  editingCourse: CourseItem | null;
  /** admin/departments: switches the 학과 추가→학과 수정 title and the 추가→수정 submit label. */
  editingId: string | null;
  /** calendar: switches the 일정 추가→일정 수정 title and the 추가→수정 submit label (CalendarEvent: see CalendarGrid). */
  editingEvent: CalendarEvent | null;
}

/** Re-exported from src/types for the signatures above. */
export type RequirementCategory =
  | 'major_required'
  | 'major_compulsory'
  | 'major_elective'
  | 'general_required'
  | 'general_elective'
  | 'free_elective'
  | 'teaching';

/** Semester term as AddSemesterDialog uses it. */
export type Term = 'spring' | 'fall';
