'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Megaphone, ArrowRight } from 'lucide-react';
import type { IPatchNoteResponse } from '@/types';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const truncate = (text: string, max = 100) =>
  text.length <= max ? text : text.slice(0, max) + '...';

export default function PatchNotesPage() {
  const { isLoading: authLoading } = useAuth();

  const { data, isLoading, error } = useQuery<{ success: boolean; data: IPatchNoteResponse[] }>({
    queryKey: ['patch-notes'],
    queryFn: async () => {
      const res = await fetch('/api/patch-notes');
      if (!res.ok) throw new Error('업데이트 소식을 불러올 수 없습니다.');
      return res.json();
    },
    enabled: !authLoading,
  });

  if (authLoading || isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-600">업데이트 소식을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  const patchNotes = data?.data ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
          <Megaphone className="w-5 h-5 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">업데이트 소식</h1>
      </div>

      {/* Empty state */}
      {patchNotes.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">등록된 업데이트 소식이 없습니다.</p>
        </div>
      )}

      {/* Patch note cards */}
      <div className="flex flex-col gap-3">
        {patchNotes.map((note) => (
          <Link key={note._id} href={`/patch-notes/${note._id}`}>
            <Card className="transition-shadow hover:shadow-md cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-100">
                      <Megaphone className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold text-gray-900 truncate">{note.title}</span>
                        {note.version && (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 flex-shrink-0">
                            {note.version}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-2">
                        {note.publishedAt ? formatDate(note.publishedAt) : formatDate(note.createdAt)}
                      </p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {truncate(note.content)}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="flex-shrink-0 mt-1 h-4 w-4 text-slate-300" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
