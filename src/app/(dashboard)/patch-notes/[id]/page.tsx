'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Megaphone } from 'lucide-react';
import Link from 'next/link';
import type { IPatchNoteResponse } from '@/types';

export default function PatchNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isGuest, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery<{ success: boolean; data: IPatchNoteResponse }>({
    queryKey: ['patch-note', id],
    queryFn: async () => {
      const res = await fetch(`/api/patch-notes/${id}`);
      if (!res.ok) throw new Error('업데이트 소식을 불러올 수 없습니다.');
      return res.json();
    },
    enabled: !!id && !authLoading,
  });

  // 읽음 처리 + 알림 카운트 갱신
  useEffect(() => {
    if (data?.success && isAuthenticated && !isGuest) {
      fetch(`/api/patch-notes/${id}/read`, { method: 'POST' }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      });
    }
  }, [data?.success, id, isAuthenticated, isGuest, queryClient]);

  const patchNote = data?.data;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="h-6 w-32 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (error || !patchNote) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href="/patch-notes"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#00AACA] transition-colors hover:text-[#153974]"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-600">업데이트 소식을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link
        href="/patch-notes"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#00AACA] transition-colors hover:text-[#153974]"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
              <Megaphone className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{patchNote.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {patchNote.version && (
                  <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {patchNote.version}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {patchNote.publishedAt ? formatDate(patchNote.publishedAt) : formatDate(patchNote.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {patchNote.content}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
