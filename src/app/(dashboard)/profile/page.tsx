'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import type { ApiResponse } from '@/types';

interface Department {
  _id: string;
  code: string;
  name: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  department: Department | null;
  enrollmentYear: number | null;
  role: string;
  image?: string;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    enrollmentYear: '',
    department: '',
  });

  // Fetch current user profile
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<UserProfile>({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/users/me');
      const result: ApiResponse<UserProfile> = await res.json();
      if (!result.success || !result.data) throw new Error(result.error || '사용자 정보를 불러올 수 없습니다.');
      return result.data;
    },
    enabled: !!session,
  });

  // Fetch departments for dropdown
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch('/api/departments');
      const result: ApiResponse<Department[]> = await res.json();
      if (!result.success || !result.data) throw new Error(result.error || '학과 정보를 불러올 수 없습니다.');
      return result.data;
    },
  });

  // Pre-populate form when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        enrollmentYear: userProfile.enrollmentYear?.toString() || '',
        department: userProfile.department?._id || '',
      });
    }
  }, [userProfile]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; department?: string; enrollmentYear?: number }) => {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<UserProfile> = await res.json();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      // Refresh NextAuth session to update JWT with new department
      await updateSession();
      setIsEditing(false);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updateData: { name?: string; department?: string; enrollmentYear?: number } = {};

    if (formData.name) updateData.name = formData.name;
    if (formData.department) updateData.department = formData.department;
    if (formData.enrollmentYear) updateData.enrollmentYear = parseInt(formData.enrollmentYear, 10);

    updateMutation.mutate(updateData);
  };

  const departmentName = userProfile?.department?.name;
  const enrollmentYear = userProfile?.enrollmentYear;

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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isLoadingProfile}
          >
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
                  min={2000}
                  max={2030}
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
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? '저장 중...' : '저장'}
              </Button>
              {updateMutation.isError && (
                <p className="text-sm text-red-500 mt-2">
                  {updateMutation.error?.message || '저장에 실패했습니다.'}
                </p>
              )}
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">이메일</span>
                <span className="font-medium">{session?.user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">이름</span>
                <span className="font-medium">{userProfile?.name || session?.user?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">입학년도</span>
                <span className={enrollmentYear ? 'font-medium' : 'text-gray-400'}>
                  {enrollmentYear ? `${enrollmentYear}년` : '미설정'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">학과</span>
                <span className={departmentName ? 'font-medium' : 'text-gray-400'}>
                  {departmentName || '미설정'}
                </span>
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
