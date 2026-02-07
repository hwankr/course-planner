'use client';

import { useMemo } from 'react';
import { useGraduationRequirement, useGraduationProgress } from '@/hooks/useGraduationRequirements';
import { useGraduationPreviewStore } from '@/stores/graduationPreviewStore';
import { usePlanStore } from '@/stores/planStore';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestGraduationStore, calculateGuestProgress } from '@/stores/guestGraduationStore';
import { useGuestPlanStore } from '@/stores/guestPlanStore';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
import type { GraduationProgress, GraduationRequirementInput } from '@/types';
import type { GuestSemesterForProgress } from '@/stores/guestGraduationStore';

export interface GraduationPreviewDelta {
  total: { planned: number; projectedPercentage: number } | null;
  primaryMajor: { planned: number; projectedPercentage: number } | null;
  secondaryMajor: { planned: number; projectedPercentage: number } | null;
  minor: { planned: number; projectedPercentage: number } | null;
  general: { planned: number; projectedPercentage: number } | null;
}

export interface GraduationPreviewResult {
  current: GraduationProgress | null;
  preview: GraduationProgress | null;
  delta: GraduationPreviewDelta | null;
  highlightTrigger: number;
  isLoading: boolean;
}

export function useGraduationPreview(): GraduationPreviewResult {
  const isGuest = useGuestStore((s) => s.isGuest);

  // Preview store
  const previewCourse = useGraduationPreviewStore((s) => s.previewCourse);
  const previewAction = useGraduationPreviewStore((s) => s.previewAction);
  const previewSemesterTarget = useGraduationPreviewStore((s) => s.previewSemesterTarget);
  const highlightTrigger = useGraduationPreviewStore((s) => s.highlightTrigger);

  // Existing progress (for display - API-based for members, local for guests)
  const { data: apiProgress, isLoading: loadingProgress } = useGraduationProgress();

  // Requirement data
  const { data: memberRequirement, isLoading: loadingReq } = useGraduationRequirement();
  const guestRequirement = useGuestGraduationStore((s) => s.requirement);

  // Semesters data
  const memberSemesters = usePlanStore((s) => s.activePlan?.semesters);
  const guestPlan = useGuestPlanStore((s) => s.plan);

  // Guest profile for department-based track resolution
  const guestDepartmentId = useGuestProfileStore((s) => s.departmentId);
  const guestSecondaryDepartmentId = useGuestProfileStore((s) => s.secondaryDepartmentId);

  const rawRequirement = isGuest ? guestRequirement : memberRequirement;

  // Adapt requirement to GraduationRequirementInput (strips _id, user, timestamps for member mode)
  const requirement: GraduationRequirementInput | null = rawRequirement ? {
    majorType: rawRequirement.majorType ?? 'single',
    totalCredits: rawRequirement.totalCredits,
    primaryMajorCredits: rawRequirement.primaryMajorCredits,
    primaryMajorRequiredMin: rawRequirement.primaryMajorRequiredMin,
    generalCredits: rawRequirement.generalCredits,
    secondaryMajorCredits: rawRequirement.secondaryMajorCredits,
    secondaryMajorRequiredMin: rawRequirement.secondaryMajorRequiredMin,
    minorCredits: rawRequirement.minorCredits,
    minorRequiredMin: rawRequirement.minorRequiredMin,
    minorPrimaryMajorMin: rawRequirement.minorPrimaryMajorMin,
    earnedTotalCredits: rawRequirement.earnedTotalCredits ?? 0,
    earnedPrimaryMajorCredits: rawRequirement.earnedPrimaryMajorCredits ?? 0,
    earnedGeneralCredits: rawRequirement.earnedGeneralCredits ?? 0,
    earnedPrimaryMajorRequiredCredits: rawRequirement.earnedPrimaryMajorRequiredCredits ?? 0,
    earnedSecondaryMajorCredits: rawRequirement.earnedSecondaryMajorCredits,
    earnedSecondaryMajorRequiredCredits: rawRequirement.earnedSecondaryMajorRequiredCredits,
    earnedMinorCredits: rawRequirement.earnedMinorCredits,
    earnedMinorRequiredCredits: rawRequirement.earnedMinorRequiredCredits,
  } : null;

  // Get semesters (member or guest)
  const semesters = isGuest ? (guestPlan?.semesters ?? null) : (memberSemesters ?? null);

  // Compute current and preview using the same calculateGuestProgress function
  const { currentCalc, previewCalc } = useMemo(() => {
    if (!requirement || !semesters) return { currentCalc: null, previewCalc: null };

    // Convert semesters to GuestSemesterForProgress[]
    const semestersForCalc: GuestSemesterForProgress[] = semesters.map(s => ({
      year: s.year,
      term: s.term,
      courses: s.courses.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        credits: c.credits,
        category: c.category,
        status: c.status,
      })),
    }));

    // Current: calculate with current semesters as-is
    const currentCalc = calculateGuestProgress(requirement, semestersForCalc, guestDepartmentId, guestSecondaryDepartmentId);

    if (!previewCourse) return { currentCalc, previewCalc: null };

    // Preview: create modified semesters with virtual course added/removed
    const modifiedSemesters: GuestSemesterForProgress[] = JSON.parse(JSON.stringify(semestersForCalc));

    if (previewAction === 'add') {
      const targetSemester = previewSemesterTarget
        ? modifiedSemesters.find(s => s.year === previewSemesterTarget.year && s.term === previewSemesterTarget.term)
        : modifiedSemesters[0];

      if (targetSemester) {
        targetSemester.courses.push({
          id: previewCourse.id,
          code: previewCourse.code,
          name: previewCourse.name,
          credits: previewCourse.credits,
          category: previewCourse.category,
          status: 'planned',
        });
      } else {
        // No semesters exist - cannot preview
        return { currentCalc, previewCalc: null };
      }
    } else if (previewAction === 'remove') {
      for (const sem of modifiedSemesters) {
        sem.courses = sem.courses.filter(c => c.id !== previewCourse.id);
      }
    }

    const previewCalc = calculateGuestProgress(requirement, modifiedSemesters, guestDepartmentId, guestSecondaryDepartmentId);
    return { currentCalc, previewCalc };
  }, [requirement, semesters, previewCourse, previewAction, previewSemesterTarget, guestDepartmentId, guestSecondaryDepartmentId]);

  // Calculate delta (planned field changes)
  const delta = useMemo((): GraduationPreviewDelta | null => {
    if (!currentCalc || !previewCalc) return null;

    const calcDelta = (
      currentGroup: { earned: number; planned: number; required: number },
      previewGroup: { earned: number; planned: number; required: number }
    ) => {
      const plannedDiff = previewGroup.planned - currentGroup.planned;
      if (plannedDiff === 0) return null;

      const currentProjected = currentGroup.earned + currentGroup.planned;
      const previewProjected = previewGroup.earned + previewGroup.planned;

      return {
        planned: plannedDiff,
        projectedPercentage: previewGroup.required > 0
          ? Math.round((previewProjected / previewGroup.required) * 100)
            - Math.round((currentProjected / currentGroup.required) * 100)
          : 0,
      };
    };

    return {
      total: calcDelta(currentCalc.total, previewCalc.total),
      primaryMajor: calcDelta(currentCalc.primaryMajor, previewCalc.primaryMajor),
      secondaryMajor: (currentCalc.secondaryMajor && previewCalc.secondaryMajor)
        ? calcDelta(currentCalc.secondaryMajor, previewCalc.secondaryMajor) : null,
      minor: (currentCalc.minor && previewCalc.minor)
        ? calcDelta(currentCalc.minor, previewCalc.minor) : null,
      general: calcDelta(currentCalc.general, previewCalc.general),
    };
  }, [currentCalc, previewCalc]);

  return {
    current: apiProgress ?? null,
    preview: previewCalc,
    delta,
    highlightTrigger,
    isLoading: isGuest ? false : (loadingProgress || loadingReq),
  };
}
