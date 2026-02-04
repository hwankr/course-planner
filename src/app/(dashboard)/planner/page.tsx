'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { usePlans, usePlan, useCreatePlan, useAddCourse, useRemoveCourse } from '@/hooks/usePlans';
import { usePlanStore } from '@/stores/planStore';
import { SemesterColumn } from '@/components/features/SemesterColumn';
import { CourseCatalog } from '@/components/features/CourseCatalog';
import { Button, Card, CardContent } from '@/components/ui';
import type { Term } from '@/types';

// Helper to parse droppableId
function parseSemesterId(droppableId: string): { year: number; term: Term } | null {
  if (droppableId === 'catalog') return null;
  const match = droppableId.match(/^semester-(\d+)-(spring|fall)$/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), term: match[2] as Term };
}

export default function PlannerPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');

  // Fetch all plans
  const { data: plans, isLoading: plansLoading, error: plansError } = usePlans();

  // Fetch selected plan detail
  const { data: planDetail, isLoading: planDetailLoading } = usePlan(selectedPlanId || '');

  // Mutations
  const createPlanMutation = useCreatePlan();
  const addCourseMutation = useAddCourse();
  const removeCourseMutation = useRemoveCourse();

  // Zustand store
  const { activePlan, setActivePlan, addCourseToSemester, removeCourseFromSemester, moveCourse } = usePlanStore();

  // Auto-select first plan when plans are loaded
  useEffect(() => {
    if (plans && plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0]._id.toString());
    }
  }, [plans, selectedPlanId]);

  // Sync fetched plan detail to Zustand store
  useEffect(() => {
    if (planDetail) {
      // Transform API plan to store format
      const storePlan = {
        id: planDetail._id.toString(),
        name: planDetail.name,
        status: planDetail.status,
        semesters: planDetail.semesters.map((sem) => ({
          year: sem.year,
          term: sem.term,
          courses: sem.courses.map((pc) => {
            // Handle both populated and non-populated course data
            const course = pc.course as unknown as {
              _id: { toString: () => string };
              code: string;
              name: string;
              credits: number;
            };
            return {
              id: course._id?.toString() || (pc.course as unknown as string),
              code: course.code || 'N/A',
              name: course.name || 'Unknown Course',
              credits: course.credits || 0,
              status: pc.status,
            };
          }),
        })),
      };
      setActivePlan(storePlan);
    }
  }, [planDetail, setActivePlan]);

  // Compute all course IDs currently in the plan
  const planCourseIds = useMemo(() => {
    if (!activePlan) return [];
    return activePlan.semesters.flatMap((sem) => sem.courses.map((c) => c.id));
  }, [activePlan]);

  // Handle creating a new plan
  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) return;
    try {
      const newPlan = await createPlanMutation.mutateAsync({
        name: newPlanName.trim(),
      });
      setSelectedPlanId(newPlan._id.toString());
      setNewPlanName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create plan:', error);
    }
  };

  // Handle adding a new semester
  const handleAddSemester = () => {
    if (!activePlan) return;

    // Find the latest semester and add next one
    const semesters = activePlan.semesters;
    let nextYear: number;
    let nextTerm: Term;

    if (semesters.length === 0) {
      // Default to current year spring
      nextYear = new Date().getFullYear();
      nextTerm = 'spring';
    } else {
      const lastSemester = semesters[semesters.length - 1];
      if (lastSemester.term === 'spring') {
        nextYear = lastSemester.year;
        nextTerm = 'fall';
      } else {
        nextYear = lastSemester.year + 1;
        nextTerm = 'spring';
      }
    }

    // Add empty semester to store (optimistic)
    addCourseToSemester(nextYear, nextTerm, {
      id: '__placeholder__',
      code: '',
      name: '',
      credits: 0,
      status: 'planned',
    });
    // Immediately remove the placeholder
    removeCourseFromSemester(nextYear, nextTerm, '__placeholder__');
  };

  // Handle drag end
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;

      // Dropped outside a droppable
      if (!destination) return;

      // Dropped in same position
      if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
      }

      const sourceInfo = parseSemesterId(source.droppableId);
      const destInfo = parseSemesterId(destination.droppableId);

      // From catalog to semester (add course)
      if (source.droppableId === 'catalog' && destInfo && activePlan) {
        // Find the course info from the catalog (we need to fetch it)
        // For optimistic update, we'll use placeholder data
        const optimisticCourse = {
          id: draggableId,
          code: 'Loading...',
          name: 'Loading...',
          credits: 0,
          status: 'planned' as const,
        };

        // Optimistic update
        addCourseToSemester(destInfo.year, destInfo.term, optimisticCourse);

        // API call
        try {
          await addCourseMutation.mutateAsync({
            planId: activePlan.id,
            year: destInfo.year,
            term: destInfo.term,
            courseId: draggableId,
          });
        } catch (error) {
          // Rollback on error
          removeCourseFromSemester(destInfo.year, destInfo.term, draggableId);
          console.error('Failed to add course:', error);
        }
        return;
      }

      // From semester to catalog (remove course)
      if (sourceInfo && destination.droppableId === 'catalog' && activePlan) {
        // Find course data before removing
        const semester = activePlan.semesters.find(
          (s) => s.year === sourceInfo.year && s.term === sourceInfo.term
        );
        const courseToRemove = semester?.courses.find((c) => c.id === draggableId);

        // Optimistic update
        removeCourseFromSemester(sourceInfo.year, sourceInfo.term, draggableId);

        // API call
        try {
          await removeCourseMutation.mutateAsync({
            planId: activePlan.id,
            year: sourceInfo.year,
            term: sourceInfo.term,
            courseId: draggableId,
          });
        } catch (error) {
          // Rollback on error
          if (courseToRemove) {
            addCourseToSemester(sourceInfo.year, sourceInfo.term, courseToRemove);
          }
          console.error('Failed to remove course:', error);
        }
        return;
      }

      // Between semesters (move course)
      if (sourceInfo && destInfo && activePlan) {
        // Find course data before moving
        const semester = activePlan.semesters.find(
          (s) => s.year === sourceInfo.year && s.term === sourceInfo.term
        );
        const courseToMove = semester?.courses.find((c) => c.id === draggableId);

        // Optimistic update
        moveCourse(sourceInfo.year, sourceInfo.term, destInfo.year, destInfo.term, draggableId);

        // API call: remove from source, add to destination
        try {
          await removeCourseMutation.mutateAsync({
            planId: activePlan.id,
            year: sourceInfo.year,
            term: sourceInfo.term,
            courseId: draggableId,
          });
          await addCourseMutation.mutateAsync({
            planId: activePlan.id,
            year: destInfo.year,
            term: destInfo.term,
            courseId: draggableId,
          });
        } catch (error) {
          // Rollback on error
          if (courseToMove) {
            moveCourse(destInfo.year, destInfo.term, sourceInfo.year, sourceInfo.term, draggableId);
          }
          console.error('Failed to move course:', error);
        }
        return;
      }
    },
    [activePlan, addCourseToSemester, removeCourseFromSemester, moveCourse, addCourseMutation, removeCourseMutation]
  );

  // Handle remove course from semester column
  const handleRemoveCourse = useCallback(
    async (year: number, term: Term, courseId: string) => {
      if (!activePlan) return;

      // Find course data before removing
      const semester = activePlan.semesters.find((s) => s.year === year && s.term === term);
      const courseToRemove = semester?.courses.find((c) => c.id === courseId);

      // Optimistic update
      removeCourseFromSemester(year, term, courseId);

      // API call
      try {
        await removeCourseMutation.mutateAsync({
          planId: activePlan.id,
          year,
          term,
          courseId,
        });
      } catch (error) {
        // Rollback on error
        if (courseToRemove) {
          addCourseToSemester(year, term, courseToRemove);
        }
        console.error('Failed to remove course:', error);
      }
    },
    [activePlan, removeCourseFromSemester, addCourseToSemester, removeCourseMutation]
  );

  // Loading state
  if (plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (plansError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-red-500 mb-4">계획을 불러오는데 실패했습니다.</p>
        <Button onClick={() => window.location.reload()}>다시 시도</Button>
      </div>
    );
  }

  // No plans - show create prompt
  if (!plans || plans.length === 0 || isCreating) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">수강 계획</h1>
          <p className="text-gray-600 mt-1">새 수강 계획을 만들어 시작하세요.</p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="planName" className="block text-sm font-medium text-gray-700 mb-1">
                  계획 이름
                </label>
                <input
                  id="planName"
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="예: 2024년 졸업 계획"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreatePlan();
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePlan}
                  isLoading={createPlanMutation.isPending}
                  className="flex-1"
                >
                  계획 만들기
                </Button>
                {plans && plans.length > 0 && (
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    취소
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">수강 계획</h1>
          <p className="text-gray-600 mt-1">드래그앤드롭으로 과목을 배치하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Plan Selector */}
          {plans.length > 1 && (
            <select
              value={selectedPlanId || ''}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {plans.map((plan) => (
                <option key={plan._id.toString()} value={plan._id.toString()}>
                  {plan.name}
                </option>
              ))}
            </select>
          )}
          <Button onClick={() => setIsCreating(true)}>새 계획 만들기</Button>
        </div>
      </div>

      {/* Loading plan detail */}
      {planDetailLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Drag and Drop Context */}
      {activePlan && !planDetailLoading && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6">
            {/* Course Catalog Sidebar */}
            <div className="w-80 flex-shrink-0">
              <CourseCatalog planCourseIds={planCourseIds} />
            </div>

            {/* Semester Grid */}
            <div className="flex-1 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activePlan.semesters.map((semester) => (
                <SemesterColumn
                  key={`${semester.year}-${semester.term}`}
                  semester={semester}
                  onRemoveCourse={(courseId) => handleRemoveCourse(semester.year, semester.term, courseId)}
                />
              ))}

              {/* Add Semester Card */}
              <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
                <CardContent className="flex items-center justify-center min-h-[400px]">
                  <Button variant="ghost" onClick={handleAddSemester} className="text-gray-500 hover:text-gray-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    학기 추가
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
