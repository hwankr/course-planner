import type { CreateCourseInput, RequirementCategory } from './index';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OfficialCourseInput extends Omit<CreateCourseInput, 'createdBy'> {
  department: string;
  curriculumYear: number;
  category: RequirementCategory;
  recommendedYear: number;
  recommendedSemester: 'spring' | 'fall';
}
