'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Card, CardContent } from '@/components/ui';
import {
  ArrowLeft,
  Search,
  Shield,
  User,
  ChevronDown,
  ChevronUp,
  Trash2,
  BookOpen,
  Clock,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

interface DepartmentItem {
  _id: string;
  code: string;
  name: string;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  department?: { _id: string; code: string; name: string };
  enrollmentYear?: number;
  studentId?: string;
  role: 'student' | 'admin';
  provider: 'credentials' | 'google';
  lastLoginAt?: string;
  createdAt: string;
}

interface PlanCourse {
  course: {
    _id: string;
    code: string;
    name: string;
    credits: number;
    category?: string;
  };
  status: 'planned' | 'enrolled' | 'completed' | 'failed';
  grade?: string;
  category?: string;
}

interface PlanSemester {
  year: number;
  term: 'spring' | 'fall';
  courses: PlanCourse[];
}

interface UserPlan {
  _id: string;
  name?: string;
  semesters: PlanSemester[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sortOption, setSortOption] = useState('recent');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (roleFilter) params.set('role', roleFilter);
    if (departmentFilter) params.set('department', departmentFilter);
    if (sortOption) params.set('sort', sortOption);
    return params.toString();
  };

  const { data, isLoading, error } = useQuery<{ success: boolean; data: UserItem[] }>({
    queryKey: ['admin-users', search, roleFilter, departmentFilter, sortOption],
    queryFn: async () => {
      const qs = buildQueryString();
      const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('사용자 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  const { data: departmentsData } = useQuery<{ success: boolean; data: DepartmentItem[] }>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch('/api/departments');
      if (!res.ok) throw new Error('학과 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  // 사용자 계획표 조회 (확장 시 lazy-load)
  const { data: planData, isLoading: planLoading } = useQuery<{ success: boolean; data: UserPlan | null }>({
    queryKey: ['admin-user-plan', expandedUserId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${expandedUserId}/plan`);
      if (!res.ok) throw new Error('수강계획을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: !!expandedUserId,
  });

  const { mutate: updateRole } = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'student' | 'admin' }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '역할 변경에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      addToast({ type: 'success', message: '사용자 역할이 변경되었습니다.' });
    },
    onError: (err: Error) => {
      addToast({ type: 'warning', message: err.message });
    },
  });

  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '사용자 삭제에 실패했습니다.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteConfirmId(null);
      setExpandedUserId(null);
      addToast({ type: 'success', message: '사용자가 삭제되었습니다.' });
    },
    onError: (err: Error) => {
      setDeleteConfirmId(null);
      addToast({ type: 'warning', message: err.message });
    },
  });

  if (authLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!isAdmin) {
    router.push('/planner');
    return null;
  }

  const users = data?.data ?? [];

  const handleRoleChange = (user: UserItem) => {
    const newRole = user.role === 'admin' ? 'student' : 'admin';
    if (!confirm(`${user.name}님의 역할을 ${newRole === 'admin' ? '관리자' : '학생'}(으)로 변경하시겠습니까?`)) return;
    updateRole({ id: user._id, role: newRole });
  };

  const handleDeleteClick = (userId: string) => {
    setDeleteConfirmId(userId);
  };

  const handleDeleteConfirm = (userId: string) => {
    deleteUser(userId);
  };

  const toggleExpand = (userId: string) => {
    setExpandedUserId((prev) => (prev === userId ? null : userId));
    setDeleteConfirmId(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '기록 없음';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '이수';
      case 'enrolled': return '수강중';
      case 'failed': return '미이수';
      default: return '계획';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'enrolled': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'major_required': return '전공핵심';
      case 'major_compulsory': return '전공필수';
      case 'major_elective': return '전공선택';
      case 'general_required': return '교양필수';
      case 'general_elective': return '교양선택';
      case 'free_elective': return '자유선택';
      case 'teaching': return '교직';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#00AACA] transition-colors hover:text-[#153974]"
        >
          <ArrowLeft className="h-4 w-4" />
          관리자 대시보드로 돌아가기
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p className="mt-1 text-gray-600">
          사용자 목록과 권한을 관리합니다. ({users.length}명)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
        >
          <option value="">전체 역할</option>
          <option value="student">학생</option>
          <option value="admin">관리자</option>
        </select>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
        >
          <option value="">전체 학과</option>
          {(departmentsData?.data ?? []).map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#00AACA] focus:outline-none focus:ring-2 focus:ring-[#00AACA]/20"
        >
          <option value="recent">최근 가입순</option>
          <option value="lastLogin">최근 접속순</option>
          <option value="name">이름순</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          사용자 목록을 불러오는데 실패했습니다.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && users.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <User className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">사용자가 없습니다.</p>
        </div>
      )}

      {/* User List */}
      {!isLoading && users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => {
            const isExpanded = expandedUserId === user._id;
            const isDeleteTarget = deleteConfirmId === user._id;

            return (
              <Card key={user._id} className="overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  {/* Main row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* User info */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleExpand(user._id)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900 truncate">
                          {user.name}
                        </span>
                        {user.studentId && (
                          <span className="inline-flex rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                            {user.studentId}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            user.role === 'admin'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          {user.role === 'admin' ? '관리자' : '학생'}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.provider === 'google'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.provider === 'google' ? 'Google' : '이메일'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>{user.email}</span>
                        {user.department?.name && <span>{user.department.name}</span>}
                        {user.enrollmentYear && <span>{user.enrollmentYear}학번</span>}
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRoleChange(user)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          user.role === 'admin'
                            ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {user.role === 'admin' ? '학생으로 변경' : '관리자로 변경'}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(user._id)}
                        className="rounded-lg bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-slate-200 cursor-pointer"
                        title="상세 정보"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      {/* User detail info */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-500">학번:</span>
                          <span className="font-medium text-slate-700">
                            {user.studentId || (user.enrollmentYear ? `${user.enrollmentYear}학번` : '미입력')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-500">학과:</span>
                          <span className="font-medium text-slate-700">
                            {user.department?.name || '미설정'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-500">마지막 접속:</span>
                          <span className="font-medium text-slate-700">
                            {formatDateTime(user.lastLoginAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-500">가입일:</span>
                          <span className="font-medium text-slate-700">
                            {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Plan section */}
                      <div className="mt-4">
                        <h3 className="mb-3 text-sm font-semibold text-slate-700">
                          수강 계획표
                        </h3>
                        {(() => {
                          const plan = expandedUserId === user._id ? planData?.data : null;
                          const totalCredits = plan?.semesters.reduce(
                            (sum, sem) => sum + sem.courses.reduce((s, c) => s + (c.course?.credits ?? 0), 0),
                            0
                          ) ?? 0;
                          const totalCourses = plan?.semesters.reduce((sum, sem) => sum + sem.courses.length, 0) ?? 0;

                          if (planLoading && expandedUserId === user._id) {
                            return (
                              <div className="space-y-2">
                                <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
                                <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
                              </div>
                            );
                          }
                          if (!plan) {
                            return (
                              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-center text-sm text-slate-400">
                                계획표를 생성하지 않았습니다.
                              </div>
                            );
                          }
                          if (plan.semesters.length === 0) {
                            return (
                              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-center text-sm text-slate-400">
                                계획표에 등록된 학기가 없습니다.
                              </div>
                            );
                          }
                          return (
                            <div>
                              {/* Plan summary */}
                              <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
                                <span>{plan.semesters.length}개 학기</span>
                                <span>{totalCourses}개 과목</span>
                                <span>{totalCredits}학점</span>
                              </div>

                              {/* Semesters */}
                              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                {plan.semesters.map((semester) => {
                                  const semCredits = semester.courses.reduce(
                                    (sum, c) => sum + (c.course?.credits ?? 0),
                                    0
                                  );
                                  return (
                                    <div
                                      key={`${semester.year}-${semester.term}`}
                                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                                    >
                                      <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-600">
                                          {semester.year}년 {semester.term === 'spring' ? '1' : '2'}학기
                                        </span>
                                        <span className="text-xs text-slate-400">
                                          {semester.courses.length}과목 / {semCredits}학점
                                        </span>
                                      </div>
                                      {semester.courses.length === 0 ? (
                                        <p className="text-xs text-slate-400">등록된 과목 없음</p>
                                      ) : (
                                        <div className="space-y-1">
                                          {semester.courses.map((c) => (
                                            <div
                                              key={c.course?._id || Math.random()}
                                              className="flex items-center justify-between rounded bg-white px-2.5 py-1.5 text-xs"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <span className="font-mono text-slate-400 shrink-0">
                                                  {c.course?.code}
                                                </span>
                                                <span className="text-slate-700 truncate">
                                                  {c.course?.name}
                                                </span>
                                                {getCategoryLabel(c.category || c.course?.category) && (
                                                  <span className="shrink-0 text-slate-400">
                                                    {getCategoryLabel(c.category || c.course?.category)}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                                <span className="text-slate-400">
                                                  {c.course?.credits}학점
                                                </span>
                                                <span
                                                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getStatusColor(c.status)}`}
                                                >
                                                  {getStatusLabel(c.status)}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Delete section */}
                      <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                        {!isDeleteTarget ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(user._id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            사용자 삭제
                          </button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-red-600">
                              {user.name}님의 모든 데이터가 삭제됩니다. 정말 삭제하시겠습니까?
                            </span>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 cursor-pointer"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteConfirm(user._id)}
                              disabled={isDeleting}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                            >
                              {isDeleting ? '삭제 중...' : '삭제 확인'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
