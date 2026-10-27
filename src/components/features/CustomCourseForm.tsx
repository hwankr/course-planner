'use client';

import { useRef, useState } from 'react';
import { useCreateCourse } from '@/hooks/useCourses';
import { ChevronDown } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { RequirementCategory, Semester } from '@/types';
import { useDialogFocus } from './useDialogFocus';

interface CustomCourseFormProps {
  onClose: () => void;
  departmentId?: string;
  availableCategories?: RequirementCategory[];
  focusedSemester?: { year: number; term: string } | null;
  onClickAdd?: (courseId: string, courseData: { code: string; name: string; credits: number; category?: RequirementCategory; departmentId?: string }) => void;
}

const categoryLabels: Record<RequirementCategory, string> = {
  major_required: '전공핵심',
  major_compulsory: '전공필수',
  major_elective: '전공선택',
  general_required: '교양필수',
  general_elective: '교양선택',
  teaching: '교직',
  free_elective: '자유선택',
};

export function CustomCourseForm({ onClose, departmentId, availableCategories, focusedSemester, onClickAdd }: CustomCourseFormProps) {
  const createCourse = useCreateCourse();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, true, { onEscape: onClose });

  const [formData, setFormData] = useState({
    name: '',
    credits: 3,
    category: '' as RequirementCategory | '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['credits'];
    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name)
        ? (value ? parseInt(value, 10) : '')
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!departmentId || !formData.category || !focusedSemester) return;

    // Auto-generate code from name + timestamp
    const autoCode = `CUS-${Date.now().toString(36).toUpperCase()}`;
    const credits = formData.credits as number;
    const category = formData.category as RequirementCategory;

    try {
      const course = await createCourse.mutateAsync({
        name: formData.name,
        code: autoCode,
        credits,
        department: departmentId,
        semesters: ['spring', 'fall'] as Semester[],
        category,
      });

      // Auto-add to focused semester if available
      if (focusedSemester && onClickAdd) {
        onClickAdd(String(course._id), {
          code: autoCode,
          name: formData.name,
          credits,
          category,
          departmentId,
        });
      }

      onClose();
    } catch {
      // Error is handled by mutation state (createCourse.isError)
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-course-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-none border border-line-2 bg-white px-6 pt-6 pb-5 shadow-float"
      >
        <div className="flex flex-col gap-1">
          <h3 id="custom-course-title" className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">
            커스텀 과목 추가
          </h3>
          <p className="m-0 text-[13px] leading-[18px] text-ink-2">나만의 과목을 추가하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
          <Input
            label="과목명"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="예: 데이터베이스"
            required
          />

          <Input
            label="학점"
            name="credits"
            type="number"
            value={formData.credits}
            onChange={handleChange}
            min={1}
            max={12}
            required
          />

          <div className="group w-full">
            <label
              htmlFor="custom-course-category"
              className="mb-1.5 block text-[13px] leading-[18px] font-semibold text-ink-2 transition-colors duration-150 group-focus-within:text-primary"
            >
              이수구분
            </label>
            <div className="relative">
              <select
                id="custom-course-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={cn(
                  'h-10 w-full cursor-pointer appearance-none rounded-none border-0 border-b border-line-3 bg-transparent px-0 pr-6 text-[17px] font-medium outline-none transition-colors duration-150 ease-out focus:border-primary focus:shadow-[inset_0_-1px_0_var(--color-primary)]',
                  formData.category ? 'text-ink' : 'text-placeholder'
                )}
              >
                <option value="">선택하세요</option>
                {(availableCategories
                  ? availableCategories.map(cat => [cat, categoryLabels[cat]] as [RequirementCategory, string])
                  : (Object.entries(categoryLabels) as [RequirementCategory, string][])
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-0 h-4 w-4 -translate-y-1/2 text-ink-2" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {focusedSemester ? (
              <p className="m-0 text-[13px] leading-[18px] text-ink-2">
                <span className="font-semibold text-primary">{focusedSemester.year}학년 {focusedSemester.term === 'spring' ? '1학기' : '2학기'}</span>에 바로 추가됩니다.
              </p>
            ) : (
              <p className="m-0 text-[13px] leading-[18px] font-medium text-negative">
                학기를 먼저 클릭하여 포커스하면 해당 학기에 바로 추가됩니다.
              </p>
            )}

            {!departmentId && (
              <p className="m-0 text-[13px] leading-[18px] font-medium text-negative">
                학과를 먼저 설정해주세요.{' '}
                <a href="/profile" className="font-semibold text-primary hover:text-primary-hover">
                  프로필 설정
                </a>
              </p>
            )}

            {createCourse.isError && (
              <p role="alert" className="m-0 text-[13px] leading-[18px] font-medium text-negative">
                {createCourse.error?.message || '과목 생성에 실패했습니다.'}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="text"
              onClick={onClose}
              className="h-12"
            >
              취소
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={createCourse.isPending || !departmentId || !formData.category || !focusedSemester}
              className="min-w-[120px]"
            >
              {createCourse.isPending ? '추가 중...' : '추가'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
