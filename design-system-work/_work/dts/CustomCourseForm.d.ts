// CustomCourseForm — props copied from src/components/features/CustomCourseForm.tsx (documentation only; not type-checked).

/** Course category; from src/types/index.ts. The modal labels them 전공핵심 · 전공필수 · 전공선택 · 교양필수 · 교양선택 · 교직 · 자유선택, in this order. */
export type RequirementCategory =
  | 'major_required'
  | 'major_compulsory'
  | 'major_elective'
  | 'general_required'
  | 'general_elective'
  | 'free_elective'
  | 'teaching';

/** Second argument of onClickAdd. Inlined in the source; named here for readability. */
export interface CustomCourseData {
  /** Auto-generated `CUS-<Date.now() in base 36, upper-case>`; the user never types a code. */
  code: string;
  /** The 과목명 field, as typed. */
  name: string;
  /** The 학점 field (parseInt of the number input; initial 3, min 1, max 12). */
  credits: number;
  /** The 이수구분 selection; always set when this callback fires. */
  category?: RequirementCategory;
  /** The departmentId prop, passed back unchanged. */
  departmentId?: string;
}

export interface CustomCourseFormProps {
  /** Called by the 취소 button and again after a successful create; the parent unmounts the modal. Required. */
  onClose: () => void;
  /** Department the new course is saved under (`department` in the mutation). Undefined shows the amber 학과를 먼저 설정해주세요 line and keeps 추가 disabled. Default undefined. */
  departmentId?: string;
  /** Restricts and orders the 이수구분 options. Undefined lists all seven categories in categoryLabels order. CourseCatalog never passes it. Default undefined. */
  availableCategories?: RequirementCategory[];
  /** Semester the course is added to. `term === 'spring'` renders 1학기, any other term 2학기, in the blue-50 banner. Null or undefined shows the amber-50 banner and keeps 추가 disabled. Default undefined. */
  focusedSemester?: { year: number; term: string } | null;
  /** Called after the create resolves, with the new course's `_id` as a string and the data to place it in the focused semester. Default undefined (the course is created but not placed). */
  onClickAdd?: (courseId: string, courseData: CustomCourseData) => void;
}

/** Client component. Renders its own fixed overlay; no children. Internal state: { name: '', credits: 3, category: '' }. The submit is disabled while `createCourse.isPending || !departmentId || !formData.category || !focusedSemester`. */
export declare function CustomCourseForm(props: CustomCourseFormProps): JSX.Element;
