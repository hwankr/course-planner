/**
 * Shared Type Definitions
 * @migration-notes 분리 시 프론트엔드/백엔드 양쪽에서 사용
 *                  공통 패키지로 분리하거나 양쪽에 복사
 */

import type { Types } from 'mongoose';

// ============================================
// User Types
// ============================================

export type UserRole = 'student' | 'admin';

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password?: string; // OAuth 사용자는 없을 수 있음
  name: string;
  image?: string;
  department?: Types.ObjectId;           // 주전공 학과 (기존)
  majorType: MajorType;                  // NEW: 전공 유형 (기본값: 'single')
  secondaryDepartment?: Types.ObjectId;  // NEW: 복수전공/부전공 학과
  enrollmentYear?: number;
  curriculumYear?: number;               // 커리큘럼 연도 (과목 카탈로그 필터용)
  studentId?: string;                    // 학번 (학생 고유번호)
  role: UserRole;
  provider?: 'credentials' | 'google';
  onboardingCompleted: boolean;
  lastLoginAt?: Date;                    // 마지막 접속 시간
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password?: string;
  name: string;
  department?: string;
  enrollmentYear?: number;
  provider?: 'credentials' | 'google';
}

// ============================================
// Course Types
// ============================================

/** 과목 개설 학기 (Course가 어느 학기에 개설되는지) */
export type Semester = 'spring' | 'summer' | 'fall' | 'winter';

export interface ICourse {
  _id: Types.ObjectId;
  code: string;
  name: string;
  credits: number;
  department?: Types.ObjectId;
  prerequisites: Types.ObjectId[];
  description?: string;
  semesters: Semester[]; // 개설 학기
  category?: RequirementCategory; // 전공필수, 전공선택, 교양 등
  recommendedYear?: number;        // 권장 학년 (1-4)
  recommendedSemester?: Semester;   // 권장 학기 (semantic: "when to take", NOT "when offered")
  createdBy?: Types.ObjectId;       // null=공식 과목, ObjectId=커스텀 과목
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseInput {
  code: string;
  name: string;
  credits: number;
  department?: string;
  prerequisites?: string[];
  description?: string;
  semesters: Semester[];
  category?: RequirementCategory;
  recommendedYear?: number;
  recommendedSemester?: Semester;
  createdBy?: string; // userId for custom courses, undefined for official
}

export interface CourseFilter {
  departmentId?: string;
  semester?: Semester;
  category?: RequirementCategory;
  search?: string;
  recommendedYear?: number;
  recommendedSemester?: Semester;
  userId?: string; // Include custom courses for this user
  curriculumYear?: number;
  limit?: number;
}

// ============================================
// Plan Types
// ============================================

/** 수강계획 학기 (1학기=spring, 2학기=fall). 정규 학기만 지원. */
export type Term = 'spring' | 'fall';

export interface PlannedCourse {
  course: Types.ObjectId;
  status: 'planned' | 'enrolled' | 'completed' | 'failed';
  grade?: string;
  category?: RequirementCategory; // Stored from DepartmentCurriculum
  departmentId?: string; // Selected curriculum department; absent on legacy plans
}

export interface SemesterPlan {
  year: number;
  term: Term;
  courses: PlannedCourse[];
}

export interface IPlan {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name?: string;
  semesters: SemesterPlan[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AddCourseToSemesterInput {
  planId: string;
  year: number;
  term: Term;
  courseId: string;
  departmentId?: string;
}

// ============================================
// Department Types
// ============================================

export interface IDepartment {
  _id: Types.ObjectId;
  code: string;
  name: string;
  college?: string; // 소속 단과대학
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDepartmentInput {
  code: string;
  name: string;
  college?: string;
}

// ============================================
// DepartmentCurriculum Types (학과별 커리큘럼 중간 테이블)
// ============================================

export interface IDepartmentCurriculum {
  _id: Types.ObjectId;
  department: Types.ObjectId;
  course: Types.ObjectId;
  category: RequirementCategory;
  recommendedYear: number;
  recommendedSemester: 'spring' | 'fall';
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Requirement Types
// ============================================

export type RequirementCategory =
  | 'major_required'    // 전공핵심
  | 'major_compulsory'  // 전공필수
  | 'major_elective'    // 전공선택
  | 'general_required'  // 교양필수
  | 'general_elective'  // 교양선택
  | 'free_elective'     // 자유선택
  | 'teaching';         // 교직

// ============================================
// Major Track Types (전공 유형)
// ============================================

/** 전공 유형 */
export type MajorType = 'single' | 'double' | 'minor';

// ============================================
// DepartmentRequirement Types (학과 졸업요건 기준표)
// ============================================

/** 전공유형별 설정 (단일/복수/부전공 각각) */
export interface DepartmentMajorTypeConfig {
  majorRequiredMin: number | null;  // 전공핵심 최소학점 (null = 요건 없음, 전공계만)
  majorCredits: number | null;      // 전공계 학점 (null = 해당 전공유형 미지원)
}

/** 부전공 전용 추가 필드 */
export interface DepartmentMinorConfig extends DepartmentMajorTypeConfig {
  primaryMajorMin: number | null;   // 부전공시 주전공 최소학점
}

export interface IRequirement {
  _id: Types.ObjectId;
  department: Types.ObjectId;
  name: string;
  category: RequirementCategory;
  requiredCredits: number;
  description?: string;
  allowedCourses: Types.ObjectId[]; // 이 요건을 충족시킬 수 있는 과목들
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRequirementInput {
  department: string;
  name: string;
  category: RequirementCategory;
  requiredCredits: number;
  description?: string;
  allowedCourses?: string[];
}

// ============================================
// Graduation Requirement Types
// ============================================

export interface GraduationRequirementInput {
  majorType: MajorType;

  totalCredits: number;
  generalCredits: number;

  primaryMajorCredits: number;
  primaryMajorRequiredMin: number;

  secondaryMajorCredits?: number;
  secondaryMajorRequiredMin?: number;

  minorCredits?: number;
  minorRequiredMin?: number;
  minorPrimaryMajorMin?: number;

  earnedTotalCredits: number;
  earnedGeneralCredits: number;
  earnedPrimaryMajorCredits: number;
  earnedPrimaryMajorRequiredCredits: number;
  earnedSecondaryMajorCredits?: number;
  earnedSecondaryMajorRequiredCredits?: number;
  earnedMinorCredits?: number;
  earnedMinorRequiredCredits?: number;

  // 기이수(성적표)에 이미 반영된 마지막 학기.
  // 이 학기까지의 계획 내 '이수' 과목은 기이수와 중복이므로 합산에서 제외한다.
  priorCutoffYear?: number | null;
  priorCutoffTerm?: Term | null;

  requirementYear?: number;
}

export interface CourseInfo {
  id: string;
  code: string;
  name: string;
  credits: number;
}

export interface GroupProgress {
  required: number;
  earned: number;
  enrolled: number;
  planned: number;
  percentage: number;
}

export interface SubRequirement {
  required: number;
  earned: number;
  enrolled?: number;
  planned?: number;
  percentage: number;
}

export interface TrackProgress extends GroupProgress {
  requiredMin: SubRequirement;  // 전공핵심 서브 요건
}

export interface MajorAttributionContext {
  majorType?: MajorType;
  secondaryDepartmentId?: string;
  primaryCourseIds?: string[];
  secondaryCourseIds?: string[];
}

export interface GraduationProgress {
  attribution?: MajorAttributionContext;
  total: GroupProgress;
  primaryMajor: TrackProgress;           // renamed from 'major'
  secondaryMajor?: TrackProgress;        // NEW: 복수전공 진행률
  minor?: TrackProgress;                 // NEW: 부전공 진행률
  minorPrimaryMajorMin?: SubRequirement; // NEW: 부전공시 주전공 최소 체크
  general: GroupProgress;
  courses: {
    completed: CourseInfo[];
    enrolled: CourseInfo[];
    planned: CourseInfo[];
  };
}

// ============================================
// Academic Event Types (학사 일정)
// ============================================

export type AcademicEventCategory =
  | 'academic'       // 학사일정
  | 'registration'   // 수강신청
  | 'exam'           // 시험
  | 'holiday'        // 공휴일
  | 'other';         // 기타

export interface IAcademicEvent {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;           // 없으면 단일 일정
  category: AcademicEventCategory;
  color?: string;           // 커스텀 색상 (hex)
  isHoliday: boolean;       // 공휴일 여부
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAcademicEventInput {
  title: string;
  description?: string;
  startDate: string;        // ISO date string
  endDate?: string;
  category: AcademicEventCategory;
  color?: string;
  isHoliday?: boolean;
}

export interface AcademicEventFilter {
  year?: number;
  month?: number;           // 1-12
  category?: AcademicEventCategory;
}

// ============================================
// Feedback Types
// ============================================

export type FeedbackCategory = 'bug' | 'feature' | 'data-error' | 'other' | 'contact';
export type FeedbackStatus = 'pending' | 'resolved';

// ============================================
// PatchNote Types (업데이트 소식)
// ============================================

export type PatchNoteStatus = 'draft' | 'published';

export interface IPatchNoteResponse {
  _id: string;
  title: string;
  content: string;
  version?: string;
  status: PatchNoteStatus;
  publishedAt?: string;
  createdBy?: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// Statistics Types (학과별 익명 수강 통계)
// ============================================

export interface CourseStat {
  courseId: string;
  code: string;
  name: string;
  credits: number;
  category: string;
  studentCount: number;    // 고유 학생 수
  percentage: number;      // studentCount / totalStudents * 100 (계획 작성 학생 대비)
  /** 이 과목이 계획에 포함된 학기 목록 (학기 필터용) */
  semesters: Array<{ year: number; term: string }>;
}

export interface SemesterDistribution {
  year: number;
  term: string;
  avgCourses: number;
  avgCredits: number;
}

export interface DepartmentCourseStats {
  departmentId: string;
  departmentName: string;
  totalStudents: number;
  updatedAt: string;
  courseStats: CourseStat[];
  semesterDistribution: SemesterDistribution[];
}

export interface AnonymousPlanSummary {
  anonymousId: string;
  totalCredits: number;
  totalCourses: number;
  semesterCount: number;
}

export interface AnonymousPlanDetail {
  anonymousId: string;
  semesters: Array<{
    year: number;
    term: string;
    courses: Array<{
      code: string;
      name: string;
      credits: number;
      category: string;
    }>;
  }>;
  totalCredits: number;
}
