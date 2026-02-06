'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Calendar, Target, UserCircle, Clock, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useGraduationProgress } from '@/hooks/useGraduationRequirements';
import { useGuestStore } from '@/stores/guestStore';

export default function DashboardPage() {
  const { data: session } = useSession();
  const isGuest = useGuestStore((s) => s.isGuest);
  const { data: progress } = useGraduationProgress({ enabled: !isGuest });

  const totalRequired = progress?.total.required || 0;
  const totalEarned = progress?.total.earned || 0;
  const overallPercentage = progress?.total.percentage || 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후예요';
    return '좋은 저녁이에요';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {getGreeting()}, {isGuest ? '비회원' : session?.user?.name}님!
        </h1>
        <p className="text-gray-500 mt-2">오늘도 수강 계획을 확인해보세요.</p>
        <div className="mt-3 w-20 h-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 수강 계획 */}
        <Card className="card-hover border-t-4 border-blue-500 animate-fade-in-up anim-delay-100">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold">수강 계획</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              학기별 수강 계획을 관리하고 과목을 배치하세요.
            </p>
            <Link href="/planner">
              <Button className="w-full">계획 관리</Button>
            </Link>
          </CardContent>
        </Card>

        {/* 졸업 요건 */}
        <Card className="card-hover border-t-4 border-emerald-500 animate-fade-in-up anim-delay-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <CardTitle className="text-lg font-semibold">졸업 요건</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              {isGuest ? (
                <p className="text-gray-600 text-sm">회원가입 후 졸업 요건을 추적할 수 있습니다.</p>
              ) : progress ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all relative overflow-hidden ${
                          overallPercentage >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}
                        style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                      >
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                          style={{ backgroundSize: '200% 100%' }}
                        />
                      </div>
                    </div>
                    <span className="text-base font-bold text-gray-700">{overallPercentage}%</span>
                  </div>
                  <p className="text-xs text-gray-500">{totalEarned}/{totalRequired}학점 이수</p>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">졸업 요건을 설정하고 진행률을 확인하세요.</p>
              )}
            </div>
            <Link href="/planner">
              <Button variant="outline" className="w-full">
                요건 확인
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 프로필/회원가입 */}
        <Card className="card-hover border-t-4 border-violet-500 animate-fade-in-up anim-delay-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-violet-600" />
              </div>
              <CardTitle className="text-lg font-semibold">{isGuest ? '회원가입' : '프로필'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              {isGuest
                ? '회원가입하면 수강 계획과 졸업 요건을 저장할 수 있습니다.'
                : '학과, 입학년도 등 개인 정보를 관리하세요.'}
            </p>
            <Link href={isGuest ? '/register' : '/profile'}>
              <Button variant="outline" className="w-full">
                {isGuest ? '회원가입하기' : '프로필 설정'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="animate-fade-in-up anim-delay-400">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>최근 활동</CardTitle>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center justify-center">
            <Activity className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium mb-1">아직 활동 내역이 없습니다</p>
            <Link href="/planner" className="text-blue-600 hover:underline text-sm">
              수강 계획을 시작해보세요
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
