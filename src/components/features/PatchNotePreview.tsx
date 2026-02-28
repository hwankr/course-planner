'use client';

import { Megaphone, Eye, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatchNotePreviewProps {
  title: string;
  content: string;
  version?: string;
}

/**
 * 업데이트 소식 미리보기 컴포넌트
 * 관리자가 발행 전 유저에게 어떻게 보이는지 확인할 수 있음
 *
 * // SYNC: 알림 드롭다운 아이템 마크업은 layout.tsx의 notification item rendering과 동기화 필요
 */
export function PatchNotePreview({ title, content, version }: PatchNotePreviewProps) {
  const displayTitle = title.trim() || '제목을 입력하세요';
  const displayContent = content.trim() || '내용을 입력하세요';
  const truncatedTitle = displayTitle.length > 50
    ? displayTitle.slice(0, 50) + '...'
    : displayTitle;

  return (
    <div className="rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-purple-600">
        <Eye className="w-4 h-4" />
        <span className="text-sm font-semibold">미리보기</span>
      </div>

      {/* Section 1: Notification Dropdown Preview */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-slate-500">알림 드롭다운</p>
        <div className="rounded-lg border border-slate-200 bg-white p-0 overflow-hidden">
          {/* SYNC: layout.tsx notification item rendering (lines 278-303) */}
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100">
                <Megaphone className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700">
                새로운 업데이트: {truncatedTitle}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">방금 전</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Content Detail Preview */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-slate-500">업데이트 소식 상세</p>
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn(
              'text-base font-bold',
              title.trim() ? 'text-gray-900' : 'text-gray-400 italic'
            )}>
              {displayTitle}
            </h3>
            {version?.trim() && (
              <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {version.trim()}
              </span>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            <p className={cn(
              'text-sm whitespace-pre-wrap leading-relaxed',
              content.trim() ? 'text-slate-700' : 'text-gray-400 italic'
            )}>
              {displayContent}
            </p>
          </div>
          <p className="text-xs text-slate-400">방금 전</p>
        </div>
      </div>
    </div>
  );
}
