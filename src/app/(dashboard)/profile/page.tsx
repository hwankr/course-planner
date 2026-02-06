'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import type { ApiResponse } from '@/types';
import { useGuestStore } from '@/stores/guestStore';
import Link from 'next/link';
import {
  User,
  Mail,
  Building2,
  CalendarDays,
  Shield,
  Star,
  Pencil,
  X,
  UserX,
  Chrome,
} from 'lucide-react';

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
  const isGuest = useGuestStore((s) => s.isGuest);
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

  if (isGuest) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로필</h1>
          <p className="text-gray-600 mt-1">개인 정보를 관리하세요.</p>
        </div>
        <Card className="border-2 border-dashed border-gray-200 animate-fade-in">
          <CardContent className="py-12">
            <UserX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-center mb-6">
              비회원은 프로필을 설정할 수 없습니다.
            </p>
            <div className="text-center">
              <Link href="/register">
                <Button>회원가입하기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">프로필</h1>
        <p className="text-gray-600 mt-1">개인 정보를 관리하세요.</p>
      </div>

      {/* Profile Header Banner */}
      <div className="animate-fade-in">
        <div className="h-32 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative mb-16">
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-4 ring-white shadow-lg">
            <span className="text-2xl font-bold text-white">
              {userProfile?.name?.charAt(0).toUpperCase() || session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
        <div className="text-center mt-2">
          <h2 className="text-xl font-bold text-gray-900">
            {userProfile?.name || session?.user?.name || '사용자'}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            {departmentName && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                <Building2 className="w-3 h-3" />
                {departmentName}
              </span>
            )}
            {enrollmentYear && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-medium">
                <CalendarDays className="w-3 h-3" />
                {enrollmentYear}년 입학
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="animate-fade-in-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            <CardTitle>기본 정보</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isLoadingProfile}
          >
            {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 text-gray-400" />
                  이름
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="이름"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  입학년도
                </label>
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
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  학과
                </label>
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
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">이메일</span>
                </div>
                <span className="font-medium">{session?.user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">이름</span>
                </div>
                <span className="font-medium">{userProfile?.name || session?.user?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">입학년도</span>
                </div>
                <span className={enrollmentYear ? 'font-medium' : 'text-gray-400'}>
                  {enrollmentYear ? `${enrollmentYear}년` : '미설정'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">학과</span>
                </div>
                <span className={departmentName ? 'font-medium' : 'text-gray-400'}>
                  {departmentName || '미설정'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="animate-fade-in-up anim-delay-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-600" />
            <CardTitle>계정 정보</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">계정 유형</span>
              <div className="flex items-center gap-2 font-medium">
                {session?.user?.image ? (
                  <>
                    <Chrome className="w-4 h-4 text-gray-400" />
                    Google 계정
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-gray-400" />
                    이메일 계정
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">권한</span>
              <div className="flex items-center gap-2 font-medium">
                <Star className="w-4 h-4 text-gray-400" />
                <span className="capitalize">{session?.user?.role || 'student'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
