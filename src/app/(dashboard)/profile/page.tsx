'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, SearchableSelect } from '@/components/ui';
import type { ApiResponse } from '@/types';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
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
  Trash2,
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
  const guestProfile = useGuestProfileStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    enrollmentYear: '',
    department: '',
  });

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '정말로 회원 탈퇴하시겠습니까?\n\n모든 수강 계획, 커스텀 과목 등 계정과 관련된 모든 데이터가 영구적으로 삭제됩니다.\n\n이 작업은 되돌릴 수 없습니다.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/users/me', { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || '계정 삭제에 실패했습니다.');
      }
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Account deletion failed:', error);
      alert('계정 삭제에 실패했습니다. 다시 시도해주세요.');
      setIsDeleting(false);
    }
  };

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

  const departmentOptions = useMemo(() =>
    departments.map((dept) => ({
      value: dept._id,
      label: dept.name,
    })),
    [departments]
  );

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

  // Pre-populate form for guest
  useEffect(() => {
    if (isGuest) {
      setFormData({
        name: guestProfile.name || '',
        enrollmentYear: guestProfile.enrollmentYear?.toString() || '',
        department: guestProfile.departmentId || '',
      });
    }
  }, [isGuest, guestProfile.name, guestProfile.enrollmentYear, guestProfile.departmentId]);

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
          <p className="text-gray-600 mt-1">프로필을 설정하면 과목 리스트가 학과별로 필터됩니다.</p>
        </div>

        {/* Guest Profile Form */}
        <Card className="animate-fade-in-up">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              <CardTitle>기본 정보</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                guestProfile.setProfile({
                  name: formData.name || undefined,
                  enrollmentYear: formData.enrollmentYear ? parseInt(formData.enrollmentYear, 10) : undefined,
                  departmentId: formData.department || undefined,
                  departmentName: departments.find((d) => d._id === formData.department)?.name || undefined,
                });
              }}
              className="space-y-4"
            >
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
              <Button type="submit">저장</Button>
            </form>
          </CardContent>
        </Card>

        {/* Guest Info */}
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
                <span className="font-medium text-amber-600">게스트 모드</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">데이터 저장</span>
                <span className="font-medium text-gray-500">이 브라우저에만 저장</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/register">
                <Button variant="outline" className="w-full">회원가입하여 데이터 영구 저장</Button>
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
        <div className="h-32 rounded-xl bg-gradient-to-r from-[#153974] via-[#3069B3] to-[#00AACA] relative mb-16">
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-[#153974] to-[#3069B3] flex items-center justify-center ring-4 ring-white shadow-lg">
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
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#153974]/10 text-[#153974] text-xs font-medium">
                <Building2 className="w-3 h-3" />
                {departmentName}
              </span>
            )}
            {enrollmentYear && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#00AACA]/10 text-[#00AACA] text-xs font-medium">
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
                <SearchableSelect
                  options={departmentOptions}
                  value={formData.department}
                  onChange={(val) => setFormData((prev) => ({ ...prev, department: val }))}
                  placeholder="학과를 검색하세요"
                />
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

      {/* Danger Zone */}
      <Card className="animate-fade-in-up anim-delay-200 border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <CardTitle className="text-red-600">위험 구역</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            회원 탈퇴 시 모든 수강 계획, 커스텀 과목 등 계정과 관련된 모든 데이터가 영구적으로 삭제됩니다.
          </p>
          <Button
            variant="outline"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
          >
            {isDeleting ? '삭제 중...' : '회원 탈퇴'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
