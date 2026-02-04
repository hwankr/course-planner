'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          안녕하세요, {session?.user?.name}님!
        </h1>
        <p className="text-gray-600 mt-1">오늘도 수강 계획을 확인해보세요.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">수강 계획</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">졸업 요건</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              졸업 요건 충족 현황을 확인하세요.
            </p>
            <Link href="/requirements">
              <Button variant="outline" className="w-full">
                요건 확인
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">프로필</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">
              학과, 입학년도 등 개인 정보를 관리하세요.
            </p>
            <Link href="/profile">
              <Button variant="outline" className="w-full">
                프로필 설정
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            아직 활동 내역이 없습니다. 수강 계획을 시작해보세요!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
