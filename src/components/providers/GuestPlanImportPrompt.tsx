'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { useDialogFocus } from '@/components/features/useDialogFocus';
import { useGuestPlanStore } from '@/stores/guestPlanStore';
import { useGuestCourseStore } from '@/stores/guestCourseStore';
import { useGuestStore } from '@/stores/guestStore';
import { useToastStore } from '@/stores/toastStore';
import { planKeys } from '@/hooks/usePlans';
import type { IPlan } from '@/types';

async function request<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, { method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  const result = await res.json();
  if (!res.ok || !result.success) throw new Error(result.error || '가져오기에 실패했습니다.');
  return result.data;
}

export function GuestPlanImportPrompt() {
  const { data: session, status } = useSession();
  const guestPlan = useGuestPlanStore(s => s.plan);
  const hydrated = useGuestPlanStore(s => s._hasHydrated);
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [canResume, setCanResume] = useState(false);
  const busy = useRef(false);
  const dialog = useRef<HTMLDivElement>(null);
  const userId = session?.user?.id;
  const dismissKey = `guest-import-later:${userId}`;
  const progressKey = `guest-import-progress:${userId}:${guestPlan?.id}`;
  const hasCourses = !!guestPlan?.semesters.some(s => s.courses.length > 0);
  const eligible = status === 'authenticated' && session?.user?.onboardingCompleted === true && hydrated && hasCourses;
  useEffect(() => {
    setDismissed(sessionStorage.getItem(dismissKey) === 'true');
    setCanResume(!!sessionStorage.getItem(progressKey));
  }, [dismissKey, progressKey]);
  const { data: memberPlan } = useQuery({
    queryKey: planKeys.detail('my'),
    queryFn: () => request<IPlan>('/api/plans'),
    enabled: eligible && !dismissed,
  });
  const emptyPlan = memberPlan && !memberPlan.semesters.some(s => s.courses.length > 0);
  const open = eligible && !dismissed && !!memberPlan && (!!emptyPlan || canResume);
  const later = () => {
    if (busy.current) return;
    sessionStorage.setItem(dismissKey, 'true');
    setDismissed(true);
  };
  useDialogFocus(dialog, open, { onEscape: later });

  const clearGuest = () => {
    useGuestStore.getState().clearAllGuestData();
    sessionStorage.removeItem(progressKey);
    setDismissed(true);
  };
  const importPlan = async () => {
    if (busy.current || !guestPlan || !memberPlan) return;
    busy.current = true;
    setPending(true);
    setError('');
    let imported = 0;
    let skipped = 0;
    try {
      // Persist custom IDs before adding them, so retries reuse the same owned course.
      const progress: { planId: string; customIds: Record<string, string> } = JSON.parse(sessionStorage.getItem(progressKey) || 'null') || { planId: String(memberPlan._id), customIds: {} };
      sessionStorage.setItem(progressKey, JSON.stringify(progress));
      setCanResume(true);
      let current = await request<IPlan>('/api/plans');
      if (String(current._id) !== progress.planId) throw new Error('계획이 변경되었습니다. 페이지를 새로고침해주세요.');
      for (const semester of guestPlan.semesters) {
        if (!current.semesters.some(s => s.year === semester.year && s.term === semester.term)) {
          current = await request<IPlan>(`/api/plans/${current._id}/semesters`, 'POST', { year: semester.year, term: semester.term });
        }
        for (const course of semester.courses) {
          let courseId = course.id;
          if (courseId.startsWith('guest-course-')) {
            const custom = useGuestCourseStore.getState().customCourses.find(c => c._id === course.id);
            if (!custom) { skipped++; continue; }
            if (!progress.customIds[course.id]) {
              const created = await request<{ _id: string }>('/api/courses', 'POST', {
                code: custom.code, name: custom.name, credits: custom.credits,
                department: custom.department || undefined, semesters: custom.semesters,
                description: custom.description, category: custom.category,
                recommendedYear: custom.recommendedYear, recommendedSemester: custom.recommendedSemester,
              });
              progress.customIds[course.id] = created._id;
              sessionStorage.setItem(progressKey, JSON.stringify(progress));
            }
            courseId = progress.customIds[course.id];
          }
          const present = current.semesters.some(s => s.courses.some(c => String(typeof c.course === 'object' && c.course ? c.course._id : c.course) === courseId));
          if (!present) current = await request<IPlan>(`/api/plans/${current._id}/courses`, 'POST', {
            year: semester.year, term: semester.term, courseId, departmentId: course.departmentId,
          });
          imported++;
          if (course.status !== 'planned') current = await request<IPlan>(`/api/plans/${current._id}/courses/status`, 'PATCH', {
            year: semester.year, term: semester.term, courseId, status: course.status,
          });
        }
      }
      queryClient.setQueryData(planKeys.detail('my'), current);
      await queryClient.invalidateQueries({ queryKey: ['graduation-requirement'] });
      clearGuest();
      useToastStore.getState().addToast({ type: skipped ? 'warning' : 'success', message: `${imported}개 과목을 가져왔습니다.${skipped ? ` 원본 정보가 없는 직접 만든 과목 ${skipped}개는 건너뛰었습니다.` : ''}`, duration: 10000 });
    } catch (cause) {
      const message = `${imported}개 과목 처리 후 중단되었습니다. ${cause instanceof Error ? cause.message : '다시 시도해주세요.'} 비회원 원본은 보관되며 다시 가져올 수 있습니다.`;
      setError(message);
      useToastStore.getState().addToast({ type: 'warning', message, duration: 10000 });
      await queryClient.invalidateQueries({ queryKey: planKeys.all });
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-5">
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="guest-import-title" aria-describedby="guest-import-description" aria-busy={pending} className="w-full max-w-lg rounded-none border border-line-2 bg-white p-6 shadow-float">
        <h2 id="guest-import-title" className="break-keep text-[22px] leading-[30px] font-bold text-ink">비회원으로 만든 계획을 가져올까요?</h2>
        <p id="guest-import-description" className="mt-3 text-[14px] leading-5 text-ink-2">이 브라우저에 저장한 학기와 과목을 회원 계획으로 가져옵니다. 직접 만든 과목도 함께 가져오며, 원본 정보가 없는 과목은 건너뛴 개수를 알려드립니다.</p>
        {error && <p role="alert" className="mt-3 text-[13px] text-negative">{error}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" disabled={pending} onClick={later}>나중에</Button>
          <Button variant="outline" disabled={pending} onClick={clearGuest}>삭제</Button>
          <Button isLoading={pending} disabled={pending} onClick={importPlan}>가져오기</Button>
        </div>
      </div>
    </div>
  );
}
