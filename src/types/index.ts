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
  department?: Types.ObjectId;
  enrollmentYear?: number;
  role: UserRole;
  provider?: 'credentials' | 'google';
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

export type Semester = 'spring' | 'summer' | 'fall' | 'winter';

export interface ICourse {
  _id: Types.ObjectId;
  code: string;
  name: string;
  credits: number;
  department: Types.ObjectId;
  prerequisites: Types.ObjectId[];
  description?: string;
  semesters: Semester[]; // 개설 학기
  category?: string; // 전공필수, 전공선택, 교양 등
  recommendedYear?: number;        // 권장 학년 (1-4)
  recommendedSemester?: Semester;   // 권장 학기 (semantic: "when to take", NOT "when offered")
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseInput {
  code: string;
  name: string;
  credits: number;
  department: string;
  prerequisites?: string[];
  description?: string;
  semesters: Semester[];
  category?: string;
  recommendedYear?: number;
  recommendedSemester?: Semester;
}

export interface CourseFilter {
  departmentId?: string;
  semester?: Semester;
  category?: string;
  search?: string;
  recommendedYear?: number;
  recommendedSemester?: Semester;
}

// ============================================
// Plan Types
// ============================================

export type Term = 'spring' | 'fall';

export interface PlannedCourse {
  course: Types.ObjectId;
  status: 'planned' | 'enrolled' | 'completed' | 'failed';
  grade?: string;
}

export interface SemesterPlan {
  year: number;
  term: Term;
  courses: PlannedCourse[];
}

export interface IPlan {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  semesters: SemesterPlan[];
  status: 'draft' | 'active';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlanInput {
  name: string;
  semesters?: SemesterPlan[];
}

export interface AddCourseToSemesterInput {
  planId: string;
  year: number;
  term: Term;
  courseId: string;
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
// Requirement Types
// ============================================

export type RequirementCategory =
  | 'major_required'    // 전공필수
  | 'major_elective'    // 전공선택
  | 'general_required'  // 교양필수
  | 'general_elective'  // 교양선택
  | 'free_elective';    // 자유선택

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
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
