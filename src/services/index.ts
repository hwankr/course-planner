/**
 * Services Index
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동, import 경로만 수정
 */

export { userService } from './user.service';
export { courseService } from './course.service';
export { planService } from './plan.service';
export { departmentService } from './department.service';
export { requirementService } from './requirement.service';
export { graduationRequirementService } from './graduationRequirement.service';
export { onboardingService } from './onboarding.service';
export { departmentRequirementService } from './departmentRequirement.service';
export { statisticsService } from './statistics.service';
export { feedbackService } from './feedback.service';
export { academicEventService } from './academicEvent.service';
