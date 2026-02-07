/**
 * Onboarding Service
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import { connectDB } from '@/lib/db/mongoose';
import { userService, graduationRequirementService } from '@/services';
import type { GraduationRequirementInput, MajorType } from '@/types';

interface CompleteOnboardingInput {
  departmentId: string;
  majorType: MajorType;
  secondaryDepartmentId?: string;
  enrollmentYear: number;
  graduationRequirements: GraduationRequirementInput;
}

async function completeOnboarding(userId: string, input: CompleteOnboardingInput) {
  await connectDB();

  // Update user: department, enrollmentYear, onboardingCompleted
  const updatedUser = await userService.update(userId, {
    department: input.departmentId,
    majorType: input.majorType,
    secondaryDepartment: input.secondaryDepartmentId,
    enrollmentYear: input.enrollmentYear,
    onboardingCompleted: true,
  });

  if (!updatedUser) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  // Upsert graduation requirements
  const gradReq = await graduationRequirementService.upsert(userId, input.graduationRequirements);

  return { user: updatedUser, graduationRequirement: gradReq };
}

export const onboardingService = {
  completeOnboarding,
};
