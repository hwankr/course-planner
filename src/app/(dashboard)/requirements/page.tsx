'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

// 임시 더미 데이터
const dummyRequirements = [
  { name: '전공필수', required: 30, earned: 12, percentage: 40 },
  { name: '전공선택', required: 45, earned: 18, percentage: 40 },
  { name: '교양필수', required: 15, earned: 15, percentage: 100 },
  { name: '교양선택', required: 12, earned: 6, percentage: 50 },
  { name: '자유선택', required: 28, earned: 10, percentage: 36 },
];

export default function RequirementsPage() {
  const totalRequired = dummyRequirements.reduce((sum, r) => sum + r.required, 0);
  const totalEarned = dummyRequirements.reduce((sum, r) => sum + r.earned, 0);
  const overallPercentage = Math.round((totalEarned / totalRequired) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">졸업 요건</h1>
        <p className="text-gray-600 mt-1">졸업까지 남은 학점을 확인하세요.</p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>전체 진행률</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
            </div>
            <span className="text-lg font-semibold">{overallPercentage}%</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            총 {totalRequired}학점 중 {totalEarned}학점 이수 ({totalRequired - totalEarned}학점 남음)
          </p>
        </CardContent>
      </Card>

      {/* Requirements by Category */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dummyRequirements.map((req) => (
          <Card key={req.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex justify-between items-center">
                <span>{req.name}</span>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    req.percentage === 100
                      ? 'bg-green-100 text-green-700'
                      : req.percentage >= 50
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {req.percentage}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all ${
                    req.percentage === 100
                      ? 'bg-green-500'
                      : req.percentage >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${req.percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {req.earned} / {req.required} 학점
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Note */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-gray-500 text-center">
            * 실제 데이터는 프로필에서 학과를 설정한 후 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
