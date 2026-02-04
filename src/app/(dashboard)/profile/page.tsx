'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    enrollmentYear: '',
    department: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API 호출
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">프로필</h1>
        <p className="text-gray-600 mt-1">개인 정보를 관리하세요.</p>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>기본 정보</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? '취소' : '수정'}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="이름"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입학년도</label>
                <Input
                  name="enrollmentYear"
                  type="number"
                  value={formData.enrollmentYear}
                  onChange={handleChange}
                  placeholder="2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학과</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">학과 선택</option>
                  <option value="cs">컴퓨터공학과</option>
                  <option value="ee">전자공학과</option>
                  <option value="me">기계공학과</option>
                </select>
              </div>
              <Button type="submit">저장</Button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">이메일</span>
                <span className="font-medium">{session?.user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">이름</span>
                <span className="font-medium">{session?.user?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">입학년도</span>
                <span className="text-gray-400">미설정</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">학과</span>
                <span className="text-gray-400">미설정</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">계정 유형</span>
              <span className="font-medium">
                {session?.user?.image ? 'Google 계정' : '이메일 계정'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">권한</span>
              <span className="font-medium capitalize">{session?.user?.role || 'student'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
