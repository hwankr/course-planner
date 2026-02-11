'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToastStore } from '@/stores/toastStore';
import { Card, CardContent } from '@/components/ui';
import { ArrowLeft, Search, Shield, User } from 'lucide-react';
import Link from 'next/link';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  department?: { _id: string; code: string; name: string };
  role: 'student' | 'admin';
  provider: 'credentials' | 'google';
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (roleFilter) params.set('role', roleFilter);
    return params.toString();
  };

  const { data, isLoading, error } = useQuery<{ success: boolean; data: UserItem[] }>({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: async () => {
      const qs = buildQueryString();
      const res = await fetch(`/api/admin/users${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('사용자 목록을 불러오는데 실패했습니다.');
      return res.json();
    },
    enabled: isAdmin && !authLoading,
  });

  const { mutate: updateRole } = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'student' | 'admin' }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('역할 변경에 실패했습니다.');
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          {users.map((user) => (
            <Card key={user._id} className="overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900 truncate">
                        {user.name}
                      </span>
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
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </div>

                  {/* Role toggle */}
                  <button
                    type="button"
                    onClick={() => handleRoleChange(user)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      user.role === 'admin'
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {user.role === 'admin' ? '학생으로 변경' : '관리자로 변경'}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
