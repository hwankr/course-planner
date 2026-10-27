'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_CURRICULUM_YEAR } from '@/lib/constants';
import Link from 'next/link';
import { PageHeader, Select } from '@/components/ui';
import { AdminLoading } from './_components/AdminParts';
import { ChevronRight } from 'lucide-react';

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
  {
    title: '업데이트 소식 관리',
    description: '앱 변경사항과 업데이트 내역을 관리합니다.',
    href: '/admin/patch-notes',
  },
];

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [selectedYear, setSelectedYear] = useState(DEFAULT_CURRICULUM_YEAR);

  const { data, isLoading, error } = useQuery<{
    success: boolean;
    data: {
      courseCount: number;
      departmentCount: number;
      userCount: number;
      planCount: number;
    };
  }>({
    queryKey: ['admin-stats', selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/admin/stats?year=${selectedYear}`);
      if (!res.ok) throw new Error('통계를 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  if (authLoading) return <AdminLoading />;

  if (!isAdmin) {
    router.push('/planner');
    return null;
  }

  const stats = data?.data;

  const counters = [
    { label: `활성 교육과정 과목 (${selectedYear})`, value: stats?.courseCount },
    { label: '학과', value: stats?.departmentCount },
    { label: '사용자', value: stats?.userCount },
    { label: '수강 계획', value: stats?.planCount },
  ];

  return (
    <div>
      <PageHeader
        title="관리자 대시보드"
        description="시스템을 관리하세요."
        actions={
          <Select aria-label="기준 연도" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            <option value={2025}>2025년</option>
            <option value={2026}>2026년</option>
          </Select>
        }
      />
      {error ? (
        <p role="alert" className="border-t border-line-2 py-8 text-[13px] text-ink-2">통계를 불러오는데 실패했습니다.</p>
      ) : isLoading ? <AdminLoading /> : (
        <dl className="mb-8 grid grid-cols-2 gap-x-5 border-t border-line-2 md:grid-cols-4">
          {counters.map(({ label, value }) => (
            <div key={label} className="border-b border-line py-4">
              <dt className="text-[13px] text-ink-2">{label}</dt>
              <dd className="mt-1 text-[28px] leading-9 font-bold tabular-nums text-ink">{value ?? 0}</dd>
            </div>
          ))}
        </dl>
      )}
      <nav aria-label="관리자 메뉴" className="border-t border-line-2">
        {adminMenus.map((menu) => (
          <Link key={menu.href} href={menu.href} className="flex min-h-[56px] items-center justify-between gap-4 border-b border-line py-3 text-ink hover:text-primary md:min-h-[52px]">
            <div>
              <h2 className="text-[15px] leading-5 font-semibold">{menu.title}</h2>
              <p className="mt-1 text-[13px] leading-[18px] text-ink-2">{menu.description}</p>
            </div>
            <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-2" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
