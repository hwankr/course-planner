'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCreateCourse } from '@/hooks/useCourses';
import { Button, Input } from '@/components/ui';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
import type { RequirementCategory, Semester } from '@/types';

interface CustomCourseFormProps {
  onClose: () => void;
  availableCategories?: RequirementCategory[];
  focusedSemester?: { year: number; term: string } | null;
  onClickAdd?: (courseId: string, courseData: { code: string; name: string; credits: number; category?: RequirementCategory }) => void;
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

export function CustomCourseForm({ onClose, availableCategories, focusedSemester, onClickAdd }: CustomCourseFormProps) {
  const { data: session } = useSession();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestDepartmentId = useGuestProfileStore((s) => s.departmentId);
  const userDepartment = isGuest ? guestDepartmentId : session?.user?.department;
  const createCourse = useCreateCourse();

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

    if (!userDepartment || !formData.category || !focusedSemester) return;

    // Auto-generate code from name + timestamp
    const autoCode = `CUS-${Date.now().toString(36).toUpperCase()}`;
    const credits = formData.credits as number;
    const category = formData.category as RequirementCategory;

    try {
      const course = await createCourse.mutateAsync({
        name: formData.name,
        code: autoCode,
        credits,
        department: userDepartment!,
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
        });
      }

      onClose();
    } catch {
      // Error is handled by mutation state (createCourse.isError)
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">커스텀 과목 추가</h3>
          <p className="text-sm text-gray-500 mt-1">나만의 과목을 추가하세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              과목명 <span className="text-red-500">*</span>
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="예: 데이터베이스"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학점 <span className="text-red-500">*</span>
            </label>
            <Input
              name="credits"
              type="number"
              value={formData.credits}
              onChange={handleChange}
              min={1}
              max={12}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이수구분 <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
          </div>

          {focusedSemester ? (
            <p className="text-sm text-blue-600 bg-blue-50 rounded-md px-3 py-2">
              <span className="font-medium">{focusedSemester.year}학년 {focusedSemester.term === 'spring' ? '1학기' : '2학기'}</span>에 바로 추가됩니다.
            </p>
          ) : (
            <p className="text-sm text-amber-600 bg-amber-50 rounded-md px-3 py-2">
              학기를 먼저 클릭하여 포커스하면 해당 학기에 바로 추가됩니다.
            </p>
          )}

          {!userDepartment && (
            <p className="text-sm text-amber-600">
              학과를 먼저 설정해주세요.{' '}
              <a href="/profile" className="underline font-medium">
                프로필 설정
              </a>
            </p>
          )}

          {createCourse.isError && (
            <p className="text-sm text-red-500">
              {createCourse.error?.message || '과목 생성에 실패했습니다.'}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={createCourse.isPending || !userDepartment || !formData.category || !focusedSemester}
              className="flex-1"
            >
              {createCourse.isPending ? '추가 중...' : '추가'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
