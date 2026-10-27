import type { OfficialCourseInput } from '@/types/admin';
import type { RequirementCategory, Semester } from '@/types';

export interface CourseFormData {
  code: string; name: string; credits: number; department: string;
  category: RequirementCategory | ''; semesters: Semester[];
  recommendedYear: string; recommendedSemester: 'spring' | 'fall';
  curriculumYear: number; description: string;
}
/** Payload construction is shared with tests without making a catalog write. */
export function buildOfficialCoursePayload(data: CourseFormData): OfficialCourseInput & { official: true } {
  if (!data.department || !data.category || !data.recommendedYear || !data.code.trim() || !data.name.trim() || !data.semesters.length) {
    throw new Error('과목 코드, 과목명, 학과, 카테고리, 권장 학년, 개설 학기를 입력해주세요.');
  }
  return {
    official: true, code: data.code.trim().toUpperCase(), name: data.name.trim(),
    credits: data.credits, department: data.department, category: data.category,
    semesters: data.semesters, curriculumYear: data.curriculumYear,
    recommendedYear: Number(data.recommendedYear), recommendedSemester: data.recommendedSemester,
    description: data.description.trim(),
  };
}
