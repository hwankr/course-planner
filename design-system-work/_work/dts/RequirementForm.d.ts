// RequirementForm — props copied from src/components/features/RequirementForm.tsx (documentation only).

/** Major track of the student; from src/types/index.ts. */
export type MajorType = 'single' | 'double' | 'minor';

/** Shape the form edits and submits. Credits are parsed with parseInt; fields of the other tracks are omitted on submit. */
export interface RequirementFormData {
  /** Which track the credit sections cover; drives the 복수전공 / 부전공 sections. */
  majorType: 'single' | 'double' | 'minor';
  /** 졸업학점 — total credits required (min 1). */
  totalCredits: number;
  /** 전공학점 — primary major credits required. */
  primaryMajorCredits: number;
  /** 전공핵심 (최소) — minimum core credits inside the primary major; must not exceed primaryMajorCredits. */
  primaryMajorRequiredMin: number;
  /** 교양학점 — general education credits required. */
  generalCredits: number;
  /** 복수전공 학점 — only when majorType is 'double'. */
  secondaryMajorCredits?: number;
  /** 복수전공핵심 (최소) — only when majorType is 'double'. */
  secondaryMajorRequiredMin?: number;
  /** 부전공 학점 — only when majorType is 'minor'. */
  minorCredits?: number;
  /** 부전공핵심 (최소) — only when majorType is 'minor'. */
  minorRequiredMin?: number;
  /** 주전공 최소 학점 — primary-major floor when a minor is declared. */
  minorPrimaryMajorMin?: number;
  /** 기이수 졸업학점 — credits already earned per the transcript (default input '0'). */
  earnedTotalCredits: number;
  /** 기이수 전공 — earned primary major credits. */
  earnedPrimaryMajorCredits: number;
  /** 기이수 교양 — earned general education credits. */
  earnedGeneralCredits: number;
  /** 기이수 전공핵심 — earned primary major core credits. */
  earnedPrimaryMajorRequiredCredits: number;
  /** 기이수 복수전공 — only when majorType is 'double'. */
  earnedSecondaryMajorCredits?: number;
  /** 기이수 복수전공핵심 — only when majorType is 'double'. */
  earnedSecondaryMajorRequiredCredits?: number;
  /** 기이수 부전공 — only when majorType is 'minor'. */
  earnedMinorCredits?: number;
  /** 기이수 부전공핵심 — only when majorType is 'minor'. */
  earnedMinorRequiredCredits?: number;
  /** Year of the last semester already counted in the earned credits; null when the cutoff select is "선택 안 함". */
  priorCutoffYear?: number | null;
  /** Term of that semester; null together with priorCutoffYear. */
  priorCutoffTerm?: 'spring' | 'fall' | null;
}

export interface RequirementFormProps {
  /** Existing requirement to edit; when present the submit label reads 수정 instead of 저장. */
  initialData?: RequirementFormData;
  /** Called with the parsed, validated data when the form submits. */
  onSubmit: (data: RequirementFormData) => void;
  /** Called by the 취소 outline button. */
  onCancel: () => void;
  /** Puts the submit Button in its isLoading state (spinner + 로딩중..., disabled). */
  isLoading?: boolean;
  /** When provided, renders the 학과 기준표에서 불러오기 button; resolves with values to prefill, or null. */
  onLoadFromDeptReq?: () => Promise<Partial<RequirementFormData> | null>;
  /** The user's track; hides radio options that do not apply. Undefined shows all three. */
  userMajorType?: MajorType;
  /** Selected value of the year <select> next to the load button (2025 | 2026); the select renders only with onYearChange. */
  requirementYear?: number;
  /** Change handler for the year <select>. */
  onYearChange?: (year: number) => void;
  /** 계획에 존재하는 학기 목록 (기이수 반영 기준 학기 선택지); renders the cutoff <select> when non-empty. Labels look like "2학년 1학기". */
  semesterOptions?: Array<{ year: number; term: 'spring' | 'fall'; label: string }>;
  /** 기준 학기 자동 제안: 계획에서 '이수' 과목이 있는 가장 마지막 학기; drives the amber suggestion banner. */
  suggestedCutoff?: { year: number; term: 'spring' | 'fall'; label: string } | null;
}
