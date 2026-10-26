/**
 * ProfileCard — documentation-only types for the profile-page PATTERN (banner, identity and settings Cards written
 * inline in src/app/(dashboard)/profile/page.tsx). No component exists in the source; these are the values the page's
 * JSX reads from the session, the user-profile query and the guest stores.
 */

/** MajorType from src/types — 'double' → 복수전공 (purple), 'minor' → 부전공 (orange), 'single' → no badge, no extra row. */
export type ProfileMajorType = 'single' | 'double' | 'minor';

/** Values behind the banner and the 기본 정보 read-only rows (signed-in branch). */
export interface ProfileIdentity {
  /** Display name; the avatar shows name.charAt(0).toUpperCase(), falling back to 'U' (and the name to 사용자). */
  name?: string;
  /** session.user.email, shown in the 이메일 row. */
  email: string;
  /** Primary department name; undefined renders 미설정 in gray-400 and hides the department badge. */
  departmentName?: string;
  /** Renders `${enrollmentYear}년` in the row and `${enrollmentYear}년 입학` as a badge; undefined → 미설정 / no badge. */
  enrollmentYear?: number;
  /** userProfile.curriculumYear || DEFAULT_CURRICULUM_YEAR (2026). */
  curriculumYear?: number;
  /** userProfile.majorType (optional in the source); drives the third badge and the extra 복수전공/부전공 row. Undefined behaves like 'single': no badge, no extra row. */
  majorType?: ProfileMajorType;
  /** Name after 복수전공: / 부전공:; the row falls back to 학과 미설정. */
  secondaryDepartment?: { name: string };
}

/** Values behind the 계정 정보 Card. */
export interface ProfileAccount {
  /** session.user.image — present → Google 계정 (chrome icon), absent → 이메일 계정 (mail icon). */
  image?: string;
  /** session.user.role, rendered with text-transform: capitalize; default 'student'. */
  role?: 'student' | 'admin';
  /** Guest branch: 계정 유형 reads 게스트 모드 (amber-600) and 데이터 저장 reads 이 브라우저에만 저장 (gray-500). */
  isGuest: boolean;
}

/** Local UI state the page keeps. */
export interface ProfilePageState {
  /** Toggled by the ghost sm Button (pencil / x) in the 기본 정보 header; swaps the rows for the edit form. */
  isEditing: boolean;
  /** formData.majorType — the toggle pair's current value; 부전공 is disabled while this is 'double'. */
  majorTypeDraft: ProfileMajorType;
  /** Disables 회원 탈퇴 and swaps its label for 삭제 중... */
  isDeleting: boolean;
  /** useQuery isLoading for ['user', 'me']; disables the pencil / x toggle in the 기본 정보 header. */
  isLoadingProfile: boolean;
  /** updateMutation.isPending: both 저장 Buttons (기본 정보 form, 전공 설정) read 저장 중... and are disabled. */
  isSaving: boolean;
  /** updateMutation.isError: red-500 text-sm line under 저장 showing updateMutation.error.message, else 저장에 실패했습니다. */
  saveError?: string;
}

/** The pattern as one documented unit; the page itself takes no props and reads these values inline. */
export interface ProfileCardProps {
  /** Banner and 기본 정보 row values. */
  identity: ProfileIdentity;
  /** 계정 정보 values. */
  account: ProfileAccount;
  /** Local UI state. */
  state: ProfilePageState;
}
