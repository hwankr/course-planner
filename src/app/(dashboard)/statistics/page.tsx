'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { AnonymousPlanModal } from '@/components/features/AnonymousPlanModal';
import { useDepartmentStats, useAnonymousPlans } from '@/hooks/useStatistics';
import { useAuth } from '@/hooks/useAuth';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
import { BarChart3, Users, BookOpen, ChevronRight, AlertCircle, Loader2, Info, LogIn } from 'lucide-react';
import type { RequirementCategory } from '@/types';

const CATEGORY_LABELS: Record<RequirementCategory, string> = {
  major_required: '전공핵심',
  major_compulsory: '전공필수',
  major_elective: '전공선택',
  general_required: '교양필수',
  general_elective: '교양선택',
  teaching: '교직',
  free_elective: '자유선택',
};

const CATEGORY_COLORS: Record<RequirementCategory, string> = {
  major_required: 'bg-red-100 text-red-700',
  major_compulsory: 'bg-rose-100 text-rose-700',
  major_elective: 'bg-orange-100 text-orange-700',
  general_required: 'bg-blue-100 text-blue-700',
  general_elective: 'bg-green-100 text-green-700',
  teaching: 'bg-violet-100 text-violet-700',
  free_elective: 'bg-gray-100 text-gray-600',
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}일 전`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}개월 전`;
}

export default function StatisticsPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | RequirementCategory>('all');
  const [plansPage, setPlansPage] = useState(1);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { isGuest, loginWithGoogle } = useAuth();
  const guestDepartmentId = useGuestProfileStore((s) => s.departmentId);
  const effectiveDepartmentId = isGuest ? (guestDepartmentId || undefined) : undefined;

  const { data: statsData, isLoading: statsLoading, isError: statsError, error: statsErrorObj } = useDepartmentStats(effectiveDepartmentId);
  const { data: plansData, isLoading: plansLoading } = useAnonymousPlans(effectiveDepartmentId, plansPage, 9, !isGuest);

  // Error handling - MUST be checked FIRST
  if (statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#3069B3]" />
            <p className="text-gray-600">통계를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check for specific error codes
  const errorCode = (statsErrorObj as Error & { code?: string })?.code;

  if (errorCode === 'DEPARTMENT_NOT_SET') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Info className="w-8 h-8 text-[#3069B3]" />
          </div>
          <h2 className="text-2xl font-bold mb-2">학과를 설정해주세요</h2>
          <p className="text-gray-600 mb-6">
            학과별 수강 통계를 확인하려면 프로필에서 학과를 설정해야 합니다.
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#153974] to-[#3069B3] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            프로필 설정하기
            <ChevronRight className="w-5 h-5" />
          </Link>
        </Card>
      </div>
    );
  }

  if (statsError || !statsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">통계를 불러오는데 실패했습니다</h2>
          <p className="text-gray-600">
            잠시 후 다시 시도해주세요.
          </p>
        </Card>
      </div>
    );
  }

  if (!statsData.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">통계 데이터를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">
            설정된 학과 정보를 확인할 수 없습니다. 프로필에서 학과를 다시 설정해주세요.
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#153974] to-[#3069B3] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            프로필 설정하기
            <ChevronRight className="w-5 h-5" />
          </Link>
        </Card>
      </div>
    );
  }

  const stats = statsData.data;

  // Filter courses by category (plain derivation, not useMemo — avoids Rules of Hooks violation after early returns)
  const filteredCourses = selectedCategory === 'all'
    ? stats.courseStats
    : stats.courseStats.filter(c => c.category === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-gradient">학과 수강 통계</span>
        </h1>
        <p className="text-xl text-gray-700 mb-2">
          {stats.departmentName} 학생들이 많이 듣는 과목
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{stats.totalStudents}명의 학생 데이터 기반</span>
          <span>·</span>
          <span>{formatRelativeTime(new Date(stats.updatedAt))} 갱신</span>
        </div>
      </div>

      {/* Guest Login Recommendation Banner */}
      {isGuest && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <LogIn className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 mb-1">
                회원가입하고 다른 학생들도 통계를 볼 수 있도록 도와주세요!
              </p>
              <p className="text-sm text-amber-800 mb-3">
                로그인하면 나의 수강 계획이 통계에 반영되어, 같은 학과 학생들이 더 정확한 데이터를 참고할 수 있습니다.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={loginWithGoogle}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                >
                  구글로 로그인
                </button>
                <Link
                  href="/register"
                  className="text-sm font-medium text-amber-900 hover:text-amber-700 underline"
                >
                  회원가입하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Scope Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#3069B3] mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-medium text-gray-900">이 페이지는 어떤 데이터를 보여주나요?</p>
            <p>
              <strong>{stats.departmentName}</strong> 소속 학생들이 작성한 수강 계획을 분석한 결과입니다.
              직접 추가한 과목(커스텀 과목)은 통계에서 제외되며, 공식 교과목만 집계됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <Card className="mb-6 p-4">
        <p className="text-sm text-gray-500 mb-3">이수구분별로 인기 과목을 필터링할 수 있습니다</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-[#153974] to-[#3069B3] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {(Object.keys(CATEGORY_LABELS) as RequirementCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#153974] to-[#3069B3] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </Card>

      {/* Popular Courses List */}
      <Card className="mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#3069B3]" />
            인기 과목 순위
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {stats.totalStudents}명 중 해당 과목을 계획에 포함한 학생 비율 순으로 정렬됩니다
          </p>
        </div>
        <div className="divide-y">
          {filteredCourses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {stats.courseStats.length === 0 ? (
                <>
                  <p className="font-medium mb-1">아직 수강 계획 데이터가 없습니다</p>
                  <p className="text-sm">학과 학생들이 수강 계획을 작성하면 이곳에 인기 과목이 표시됩니다</p>
                </>
              ) : (
                '해당 카테고리에 과목이 없습니다.'
              )}
            </div>
          ) : (
            filteredCourses.map((course, index) => (
              <div key={course.courseId} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#153974] to-[#3069B3] text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Course Info */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {course.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {course.code} · {course.credits}학점
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${CATEGORY_COLORS[course.category as RequirementCategory]}`}>
                        {CATEGORY_LABELS[course.category as RequirementCategory]}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-1">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#153974] via-[#3069B3] to-[#00AACA] transition-all duration-300"
                          style={{ width: `${course.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-[#3069B3]">
                        {course.percentage.toFixed(1)}%
                      </span>
                      <span className="text-gray-500">
                        ({course.studentCount}명)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {filteredCourses.length > 0 && (
          <div className="p-4 bg-gray-50 border-t">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Info className="w-4 h-4" />
              계획을 작성한 학생 중 비율입니다
            </p>
          </div>
        )}
      </Card>

      {/* Semester Distribution */}
      <Card className="mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#3069B3]" />
            학기별 평균 수강 현황
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            같은 학과 학생들의 학기별 평균 수강 과목 수와 학점입니다
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.semesterDistribution.map((sem) => (
              <div key={`${sem.year}-${sem.term}`} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {sem.year}학년 {sem.term === 'spring' ? '1' : '2'}학기
                </h3>
                <p className="text-sm text-gray-600">
                  {sem.avgCourses.toFixed(1)}과목 · {sem.avgCredits.toFixed(1)}학점
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Anonymous Plans Section */}
      {isGuest ? (
        <Card>
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold mb-1">익명 수강계획 열람</h2>
            <p className="text-sm text-gray-600">같은 학과 학생들의 수강 계획을 참고하세요</p>
          </div>
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-medium text-gray-900 mb-2">로그인하면 다른 학생들의 수강 계획을 열람할 수 있습니다</p>
            <p className="text-sm text-gray-500 mb-6">
              회원가입 후 나의 계획을 등록하면, 같은 학과 학생들의 익명 수강 계획도 참고할 수 있어요.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={loginWithGoogle}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#153974] to-[#3069B3] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              >
                구글로 로그인
              </button>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#3069B3] text-[#3069B3] rounded-lg hover:bg-[#3069B3] hover:text-white transition-colors text-sm font-medium"
              >
                회원가입하기
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold mb-1">익명 수강계획 열람</h2>
              <p className="text-sm text-gray-600">같은 학과 학생들의 수강 계획을 참고하세요</p>
            </div>
            <div className="p-6">
              {plansLoading && plansPage === 1 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#3069B3]" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {plansData?.plans.map((plan, index) => {
                      const label = String.fromCharCode(65 + ((plansPage - 1) * 9 + index));
                      return (
                        <button
                          key={plan.anonymousId}
                          onClick={() => setSelectedPlanId(plan.anonymousId)}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#3069B3] hover:shadow-md transition-all text-left"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#153974] to-[#3069B3] text-white flex items-center justify-center font-bold text-sm">
                              {label}
                            </div>
                            <span className="font-semibold text-gray-900">계획 {label}</span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>{plan.semesterCount}개 학기</p>
                            <p>{plan.totalCourses}개 과목 · {plan.totalCredits}학점</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {plansData && plansData.plans.length > 0 && (
                    <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      모든 계획은 익명으로 표시됩니다
                    </p>
                  )}

                  {plansData && plansData.total > plansPage * plansData.limit && (
                    <div className="text-center">
                      <button
                        onClick={() => setPlansPage((p) => p + 1)}
                        disabled={plansLoading}
                        className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#3069B3] text-[#3069B3] rounded-lg hover:bg-[#3069B3] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {plansLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            로딩 중...
                          </>
                        ) : (
                          <>
                            더 보기
                            <ChevronRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {plansData?.plans.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="font-medium mb-1">아직 공개된 수강 계획이 없습니다</p>
                      <p className="text-sm">학과 학생들이 수강 계획을 작성하면 이곳에 익명으로 표시됩니다</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Anonymous Plan Modal */}
          {selectedPlanId && (
            <AnonymousPlanModal
              isOpen={true}
              anonymousId={selectedPlanId}
              departmentId={effectiveDepartmentId}
              onClose={() => setSelectedPlanId(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
