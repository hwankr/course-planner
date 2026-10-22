/**
 * Onboarding — documentation-only types for the onboarding PATTERN: the first-run wizard markup in
 * src/app/(dashboard)/onboarding/page.tsx and the profile banner in src/app/(dashboard)/profile/page.tsx.
 * No component exists in the source: both files are default-exported Next.js pages that take no props.
 * These interfaces name the page state that drives each piece and the recipe names the stylesheet uses.
 */

/** src/types/index.ts — the major track a student follows. */
export type MajorType = 'single' | 'double' | 'minor';

/** The wizard step; `useState(1)` in the source, only ever 1 or 2. */
export type OnboardingStep = 1 | 2;

/** One stepper circle's look: current (navy→blue gradient), done (emerald Check), upcoming (gray-200). */
export type OnboardingStepState = 'current' | 'done' | 'upcoming';

/** A 복수전공 / 부전공 toggle's look: off, on (purple for double, orange for minor), disabled (부전공 while double is on). */
export type MajorTypeToggleState = 'off' | 'on' | 'disabled';

/** Department row from useDepartments(), mapped to SearchableSelect options { value: _id, label: name, group: college }. */
export interface OnboardingDepartment {
  /** Mongo id; becomes `departmentId` / `secondaryDepartmentId`. */
  _id: string;
  /** Department code (unused by the page). */
  code: string;
  /** Option label and the banner's department badge text. */
  name: string;
  /** Option group header; also sent to /api/department-requirements. */
  college?: string;
}

/** The step-2 numbers, as sent to useCompleteOnboarding (`graduationRequirements`) or the guest graduation store. */
export interface OnboardingGraduationRequirements {
  /** Chosen in step 1; decides which extra columns render. */
  majorType: MajorType;
  /** 졸업학점 — default 120, must be ≥ 1 (졸업학점은 1 이상이어야 합니다.). */
  totalCredits: number;
  /** 교양학점 — default 30. */
  generalCredits: number;
  /** 전공학점 — default 63. */
  primaryMajorCredits: number;
  /** 전공핵심 (최소) — default 24. */
  primaryMajorRequiredMin: number;
  /** 복수전공 전공학점 — double only, default 36. */
  secondaryMajorCredits?: number;
  /** 복수전공 전공핵심 (최소) — double only, default 12. */
  secondaryMajorRequiredMin?: number;
  /** 부전공 전공학점 — minor only, default 21. */
  minorCredits?: number;
  /** 부전공 전공핵심 (최소) — minor only, default 9. */
  minorRequiredMin?: number;
  /** 부전공시 주전공 최소학점 — minor only, default 0. */
  minorPrimaryMajorMin?: number;
  /** 기이수 졸업학점 — default 0. */
  earnedTotalCredits: number;
  /** 기이수 교양학점 — default 0. */
  earnedGeneralCredits: number;
  /** 기이수 전공학점 — default 0. */
  earnedPrimaryMajorCredits: number;
  /** 기이수 전공핵심학점 — default 0. */
  earnedPrimaryMajorRequiredCredits: number;
  /** 기이수 복수전공 전공학점 — double only. */
  earnedSecondaryMajorCredits?: number;
  /** 기이수 복수전공 전공핵심 — double only. */
  earnedSecondaryMajorRequiredCredits?: number;
  /** 기이수 부전공 전공학점 — minor only. */
  earnedMinorCredits?: number;
  /** 기이수 부전공 전공핵심 — minor only. */
  earnedMinorRequiredCredits?: number;
  /** 기준 연도 — default DEFAULT_REQUIREMENT_YEAR (2025); the <select> offers 2025 and 2026. */
  requirementYear: number;
}

/** Page state behind the wizard (OnboardingPage itself has no props). */
export interface OnboardingProps {
  /** Which Card renders and how the stepper paints. */
  step: OnboardingStep;
  /** Options for both SearchableSelects; the secondary one filters out `departmentId`. */
  departments: OnboardingDepartment[];
  /** While true the 학과 select is disabled with placeholder 불러오는 중.... */
  isDeptLoading: boolean;
  /** Selected primary department; the toggle block renders only once it is set. */
  departmentId: string;
  /** Raw text of the 입학연도 number input (placeholder 예: 2024); validated 2000 … current year + 1. */
  enrollmentYear: string;
  /** 'single' | 'double' | 'minor' — default 'single'. */
  majorType: MajorType;
  /** Which toggles render; default ['single', 'double', 'minor'], refreshed from /api/department-requirements. */
  availableMajorTypes: MajorType[];
  /** 복수전공 학과 / 부전공 학과 selection; must differ from `departmentId`. */
  secondaryDepartmentId: string;
  /** Step-2 numbers (see OnboardingGraduationRequirements). */
  requirements: OnboardingGraduationRequirements;
  /** 학과 기준표에서 불러왔습니다. 수정할 수 있습니다. — set after a successful auto-fill, rendered as the emerald notice. */
  autoFillMessage: string;
  /** Current validation / request error, rendered as the red-500 line; '' hides it. */
  error: string;
  /** completeMutation.isPending (signed-in users only): 완료 becomes 처리 중... and is disabled. */
  isPending: boolean;
  /** Guest mode writes to the local stores instead of calling the API. */
  isGuest: boolean;
}

/** The stepper piece alone. */
export interface OnboardingStepperProps {
  /** 1: step 1 current, step 2 upcoming, empty track. 2: step 1 done (Check), filled connector, step 2 current. */
  step: OnboardingStep;
}

/** The toggle pair; the same markup is repeated in profile/page.tsx 전공 설정 (guest and authenticated). */
export interface MajorTypeToggleProps {
  /** Current value; 'double' turns the 복수전공 button on and disables 부전공, 'minor' turns 부전공 on. */
  majorType: MajorType;
  /** A button renders only when its type is listed; default all three. profile/page.tsx always renders both. */
  availableMajorTypes?: MajorType[];
  /** Clicking an off button selects its type; clicking the on button returns to 'single'. Both clear the secondary department. */
  onChange: (next: MajorType) => void;
}

/** Profile banner data (profile/page.tsx, authenticated view only). */
export interface ProfileBannerProps {
  /** userProfile.name ?? session.user.name; the avatar shows its first character upper-cased (fallback 'U'), the heading the name (fallback 사용자). */
  name?: string;
  /** Renders the yu-navy department badge when set. */
  department?: Pick<OnboardingDepartment, '_id' | 'code' | 'name'> | null;
  /** Renders the yu-cyan {year}년 입학 badge when set. */
  enrollmentYear?: number | null;
  /** 'double' → purple 복수전공 badge, 'minor' → orange 부전공 badge, 'single' or undefined → no badge. */
  majorType?: MajorType;
  /** Appended to the major-type badge as ": {name}" when set. */
  secondaryDepartment?: Pick<OnboardingDepartment, '_id' | 'code' | 'name'> | null;
}
