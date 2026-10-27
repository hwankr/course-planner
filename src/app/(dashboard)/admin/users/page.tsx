'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminMutation, useAdminFormSession } from '../_components/useAdminMutation';
import { AdminPagination } from '../_components/AdminPagination';
import type { Pagination } from '@/types/admin';
import { invalidateAdminData } from '../_components/adminCache';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Button, Input, Select, StatusText, CategoryLabel } from '@/components/ui';
import { AdminHeader, AdminRow, AdminLoading } from '../_components/AdminParts';
import { AdminConfirmDialog } from '../_components/AdminDialog';
import {
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
  const formSession = useAdminFormSession();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sortOption, setSortOption] = useState('recent');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [roleConfirmUser, setRoleConfirmUser] = useState<UserItem | null>(null);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (roleFilter) params.set('role', roleFilter);
    if (departmentFilter) params.set('department', departmentFilter);
    if (sortOption) params.set('sort', sortOption);
    params.set('page', String(page));
    params.set('limit', '50');
    return params.toString();
  };

  const { data, isLoading, error } = useQuery<{ success: boolean; data: UserItem[]; pagination: Pagination }>({
    queryKey: ['admin-users', search, roleFilter, departmentFilter, sortOption, page],
    queryFn: async () => {
      const qs = buildQueryString();
      const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('사용자 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  const { data: departmentsData, isError: departmentsError, refetch: retryDepartments } = useQuery<{ success: boolean; data: DepartmentItem[] }>({
    queryKey: ['admin-departments'],
    queryFn: async () => {
      const res = await fetch('/api/departments');
      if (!res.ok) throw new Error('학과 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  // 사용자 계획표 조회 (확장 시 lazy-load)
  const { data: planData, isLoading: planLoading, isError: planError, refetch: retryPlan } = useQuery<{ success: boolean; data: UserPlan | null }>({
    queryKey: ['admin-user-plan', expandedUserId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${expandedUserId}/plan`);
      if (!res.ok) throw new Error('수강계획을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: !!expandedUserId,
  });

  const { mutate: updateRole, isPending: isUpdatingRole } = useAdminMutation({
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
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'users');
      addToast({ type: 'success', message: '사용자 역할이 변경되었습니다.' });
      if (formSession.isCurrent(sessionId)) setRoleConfirmUser(null);
    },
    onError: (err: Error) => {
      addToast({ type: 'warning', message: err.message });
    },
  }, formSession);

  const { mutate: deleteUser, isPending: isDeleting } = useAdminMutation({
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
    onSuccess: (_result, _variables, sessionId) => {
      void invalidateAdminData(queryClient, 'users');
      if (formSession.isCurrent(sessionId)) setDeleteConfirmId(null);
      if (formSession.isCurrent(sessionId)) setExpandedUserId(null);
      addToast({ type: 'success', message: '사용자가 삭제되었습니다.' });
    },
    onError: (err: Error, _variables, sessionId) => {
      if (formSession.isCurrent(sessionId)) setDeleteConfirmId(null);
      addToast({ type: 'warning', message: err.message });
    },
  }, formSession);

  if (authLoading) {
    return <AdminLoading />;
  }

  if (!isAdmin) {
    router.push('/planner');
    return null;
  }

  const users = data?.data ?? [];

  const handleRoleChange = (user: UserItem) => { formSession.begin(); setRoleConfirmUser(user); };

  const handleDeleteClick = (userId: string) => {
    formSession.begin();
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
      <AdminHeader
        title="사용자 관리"
        description={<>사용자 목록과 권한을 관리합니다. (총 {data?.pagination.total ?? 0}명)</>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Input variant="search" aria-label="이름 또는 이메일 검색..." className="pr-10"
            type="text"
            placeholder="이름 또는 이메일 검색..."
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
        </div>
        <Select aria-label="역할"
          value={roleFilter}
          onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }}
        >
          <option value="">전체 역할</option>
          <option value="student">학생</option>
          <option value="admin">관리자</option>
        </Select>
        <Select aria-label="학과"
          value={departmentFilter}
          onChange={(e) => { setPage(1); setDepartmentFilter(e.target.value); }}
        >
          <option value="">전체 학과</option>
          {(departmentsData?.data ?? []).map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </Select>
        <Select aria-label="정렬"
          value={sortOption}
          onChange={(e) => { setPage(1); setSortOption(e.target.value); }}
        >
          <option value="recent">최근 가입순</option>
          <option value="lastLogin">최근 접속순</option>
          <option value="name">이름순</option>
        </Select>
      </div>

      {departmentsError && <div role="alert" className="text-[13px] text-ink-2">학과 목록을 불러오는데 실패했습니다. <Button variant="outline" onClick={() => retryDepartments()}>학과 다시 시도</Button></div>}
      <AdminPagination pagination={data?.pagination} pending={isLoading} onPage={setPage} />
      {/* Loading */}
      {isLoading && <AdminLoading />}

      {/* Error */}
      {error && (
        <div role="alert" className="border-t border-line-2 py-8 text-[13px] text-ink-2">
          사용자 목록을 불러오는데 실패했습니다.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && users.length === 0 && (
        <div className="border-t border-line-2 py-12 text-center">
          <User className="mx-auto h-12 w-12 text-placeholder" />
          <p className="mt-4 text-sm text-ink-2">사용자가 없습니다.</p>
        </div>
      )}

      {/* User List */}
      {!isLoading && users.length > 0 && (
        <div className="border-t border-line-2">
          {users.map((user) => {
            const isExpanded = expandedUserId === user._id;

            return (
              <AdminRow key={user._id}>
                <div>
                  {/* Main row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* User info */}
                    <div
                      className="w-full min-w-0 cursor-pointer sm:w-auto sm:flex-1"
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-controls={`user-details-${user._id}`}
                      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleExpand(user._id); } }}
                      onClick={() => toggleExpand(user._id)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-ink truncate">
                          {user.name}
                        </span>
                        {user.studentId && (
                          <span className="inline-flex text-xs font-medium text-ink-2">
                            {user.studentId}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            user.role === 'admin'
                              ? 'text-negative'
                              : 'text-ink-2'
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
                          className={`inline-flex text-xs font-medium ${
                            user.provider === 'google'
                              ? 'text-ink-2'
                              : 'text-ink'
                          }`}
                        >
                          {user.provider === 'google' ? 'Google' : '이메일'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 break-all text-xs text-ink-2">
                        <span>{user.email}</span>
                        {user.department?.name && <span>{user.department.name}</span>}
                        {user.enrollmentYear && <span>{user.enrollmentYear}학번</span>}
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="text"
                        type="button"
                        onClick={() => handleRoleChange(user)}
                      >
                        {user.role === 'admin' ? '학생으로 변경' : '관리자로 변경'}
                      </Button>
                      <Button aria-label="상세 정보" variant="text"
                        type="button"
                        onClick={() => toggleExpand(user._id)}
                        size="icon"
                        title="상세 정보"
                        aria-expanded={isExpanded}
                        aria-controls={`user-details-${user._id}`}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div id={`user-details-${user._id}`} className="mt-4 border-t border-line pt-4">
                      {/* User detail info */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="h-4 w-4 text-ink-2" />
                          <span className="text-ink-2">학번:</span>
                          <span className="font-medium text-ink">
                            {user.studentId || (user.enrollmentYear ? `${user.enrollmentYear}학번` : '미입력')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-4 w-4 text-ink-2" />
                          <span className="text-ink-2">학과:</span>
                          <span className="font-medium text-ink">
                            {user.department?.name || '미설정'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-ink-2" />
                          <span className="text-ink-2">마지막 접속:</span>
                          <span className="font-medium text-ink">
                            {formatDateTime(user.lastLoginAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-ink-2" />
                          <span className="text-ink-2">가입일:</span>
                          <span className="font-medium text-ink">
                            {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Plan section */}
                      <div className="mt-4">
                        <h3 className="mb-3 text-sm font-semibold text-ink">
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
                              <AdminLoading />
                            );
                          }
                          if (planError) {
                            return <div role="alert" className="py-4 text-sm text-ink-2">수강계획을 불러오는데 실패했습니다. <Button variant="outline" onClick={() => retryPlan()}>계획 다시 시도</Button></div>;
                          }
                          if (!plan) {
                            return (
                              <div className="rounded-none border-t border-line py-4 text-center text-sm text-ink-2">
                                계획표를 생성하지 않았습니다.
                              </div>
                            );
                          }
                          if (plan.semesters.length === 0) {
                            return (
                              <div className="rounded-none border-t border-line py-4 text-center text-sm text-ink-2">
                                계획표에 등록된 학기가 없습니다.
                              </div>
                            );
                          }
                          return (
                            <div>
                              {/* Plan summary */}
                              <div className="mb-3 flex flex-wrap gap-4 text-xs text-ink-2">
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
                                      className="border-t border-line py-3"
                                    >
                                      <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-ink-2">
                                          {semester.year}년 {semester.term === 'spring' ? '1' : '2'}학기
                                        </span>
                                        <span className="text-xs text-ink-2">
                                          {semester.courses.length}과목 / {semCredits}학점
                                        </span>
                                      </div>
                                      {semester.courses.length === 0 ? (
                                        <p className="text-xs text-ink-2">등록된 과목 없음</p>
                                      ) : (
                                        <div className="space-y-1">
                                          {semester.courses.map((c) => (
                                            <div
                                              key={c.course?._id || Math.random()}
                                              className="flex items-center justify-between min-h-[52px] flex-wrap gap-2 border-b border-line py-2 text-xs"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <span className="font-mono text-ink-2 shrink-0">
                                                  {c.course?.code}
                                                </span>
                                                <span className="text-ink truncate">
                                                  {c.course?.name}
                                                </span>
                                                {getCategoryLabel(c.category || c.course?.category) && (
                                                  <CategoryLabel category={c.category || c.course?.category} />
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                                <span className="text-ink-2">
                                                  {c.course?.credits}학점
                                                </span>
                                                <StatusText status={c.status} label={getStatusLabel(c.status)} />
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
                      <div className="mt-4 flex justify-end border-t border-line pt-4">
                        {(
                          <Button variant="textDanger"
                            type="button"
                            onClick={() => handleDeleteClick(user._id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            사용자 삭제
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </AdminRow>
            );
          })}
        </div>
      )}
      {deleteConfirmId && <AdminConfirmDialog isPending={formSession.isPending} title="사용자 삭제" description={<>{users.find((user) => user._id === deleteConfirmId)?.name}님의 모든 데이터가 삭제됩니다. 정말 삭제하시겠습니까?</>} onClose={() => setDeleteConfirmId(null)} onConfirm={() => handleDeleteConfirm(deleteConfirmId)} pending={isDeleting} confirmLabel="삭제 확인" />}
      {roleConfirmUser && <AdminConfirmDialog isPending={formSession.isPending} title="사용자 역할 변경" description={<>{roleConfirmUser.name}님의 역할을 {roleConfirmUser.role === 'admin' ? '학생' : '관리자'}(으)로 변경하시겠습니까?</>} onClose={() => setRoleConfirmUser(null)} onConfirm={() => updateRole({ id: roleConfirmUser._id, role: roleConfirmUser.role === 'admin' ? 'student' : 'admin' })} pending={isUpdatingRole} confirmLabel="변경" danger={false} />}
    </div>
  );
}
