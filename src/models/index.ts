/**
 * Models Index
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동, import 경로만 수정
 */

export { default as User } from './User';
export { default as Course } from './Course';
export { default as Department } from './Department';
export { default as Plan } from './Plan';
export { default as Requirement } from './Requirement';
export { default as GraduationRequirement } from './GraduationRequirement';
export { default as DepartmentRequirement } from './DepartmentRequirement';
export { default as DepartmentCurriculum } from './DepartmentCurriculum';
export { default as AcademicEvent } from './AcademicEvent';

// Document 타입 export
export type { IUserDocument } from './User';
export type { ICourseDocument } from './Course';
export type { IDepartmentDocument } from './Department';
export type { IPlanDocument } from './Plan';
export type { IRequirementDocument } from './Requirement';
export type { IGraduationRequirementDocument } from './GraduationRequirement';
export type { IDepartmentRequirementDocument } from './DepartmentRequirement';
export type { IDepartmentCurriculumDocument } from './DepartmentCurriculum';
export type { IAcademicEventDocument } from './AcademicEvent';
