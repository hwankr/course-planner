'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui';

const adminMenus = [
  {
    title: '과목 관리',
    description: '과목을 추가, 수정, 삭제합니다.',
    href: '/admin/courses',
  },
  {
    title: '학과 관리',
    description: '학과 정보를 관리합니다.',
    href: '/admin/departments',
  },
  {
    title: '졸업 요건 관리',
    description: '학과별 졸업 요건을 설정합니다.',
    href: '/admin/requirements',
  },
  {
    title: '사용자 관리',
    description: '사용자 목록과 권한을 관리합니다.',
    href: '/admin/users',
  },
  {
    title: '피드백 관리',
    description: '사용자 피드백과 문의를 관리합니다.',
    href: '/admin/feedback',
  },
];

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();

  const { data, isLoading } = useQuery<{
    success: boolean;
    data: {
      courseCount: number;
      departmentCount: number;
      userCount: number;
      planCount: number;
    };
  }>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('통계를 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  if (authLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    router.push('/planner');
    return null;
  }

  const stats = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-600 mt-1">시스템을 관리하세요.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-[#153974]">
              {isLoading ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-200" />
              ) : (
                (stats?.courseCount ?? 0)
              )}
            </div>
            <p className="text-sm text-gray-600">등록된 과목</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">
              {isLoading ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-200" />
              ) : (
                (stats?.departmentCount ?? 0)
              )}
            </div>
            <p className="text-sm text-gray-600">학과</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-600">
              {isLoading ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-200" />
              ) : (
                (stats?.userCount ?? 0)
              )}
            </div>
            <p className="text-sm text-gray-600">사용자</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-600">
              {isLoading ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-200" />
              ) : (
                (stats?.planCount ?? 0)
              )}
            </div>
            <p className="text-sm text-gray-600">수강 계획</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Menus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminMenus.map((menu) => (
          <Link key={menu.href} href={menu.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg">{menu.title}</CardTitle>
                <CardDescription>{menu.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
