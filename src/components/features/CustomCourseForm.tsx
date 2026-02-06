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
}

const categoryLabels: Record<RequirementCategory, string> = {
  major_required: '전공필수',
  major_elective: '전공선택',
  general_required: '교양필수',
  general_elective: '교양선택',
  free_elective: '자유선택',
};

export function CustomCourseForm({ onClose }: CustomCourseFormProps) {
  const { data: session } = useSession();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestDepartmentId = useGuestProfileStore((s) => s.departmentId);
  const userDepartment = isGuest ? guestDepartmentId : session?.user?.department;
  const createCourse = useCreateCourse();

  const [formData, setFormData] = useState({
    name: '',
    credits: 3,
    category: '' as RequirementCategory | '',
    recommendedYear: '' as number | '',
    recommendedSemester: '' as Semester | '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value, 10) : '') : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userDepartment) return;

    // Auto-generate code from name + timestamp
    const autoCode = `CUS-${Date.now().toString(36).toUpperCase()}`;

    createCourse.mutate(
      {
        name: formData.name,
        code: autoCode,
        credits: formData.credits as number,
        department: userDepartment!,
        semesters: formData.recommendedSemester
          ? [formData.recommendedSemester as Semester]
          : ['spring', 'fall'],
        category: formData.category || undefined,
        recommendedYear: formData.recommendedYear || undefined,
        recommendedSemester: formData.recommendedSemester || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
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
              max={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이수구분</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">선택 안함</option>
              {(Object.entries(categoryLabels) as [RequirementCategory, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">권장 학년</label>
              <select
                name="recommendedYear"
                value={formData.recommendedYear}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">선택 안함</option>
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>
                    {y}학년
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">권장 학기</label>
              <select
                name="recommendedSemester"
                value={formData.recommendedSemester}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">선택 안함</option>
                <option value="spring">1학기</option>
                <option value="fall">2학기</option>
              </select>
            </div>
          </div>

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
              disabled={createCourse.isPending || !userDepartment}
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
