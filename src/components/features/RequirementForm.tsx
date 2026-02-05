'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';

interface RequirementFormData {
  totalCredits: number;
  majorCredits: number;
  majorRequiredMin: number;
  generalCredits: number;
  earnedMajorCredits: number;
  earnedGeneralCredits: number;
}

interface RequirementFormProps {
  initialData?: RequirementFormData;
  onSubmit: (data: RequirementFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RequirementForm({ initialData, onSubmit, onCancel, isLoading }: RequirementFormProps) {
  const [totalCredits, setTotalCredits] = useState(initialData?.totalCredits?.toString() || '');
  const [majorCredits, setMajorCredits] = useState(initialData?.majorCredits?.toString() || '');
  const [majorRequiredMin, setMajorRequiredMin] = useState(initialData?.majorRequiredMin?.toString() || '');
  const [generalCredits, setGeneralCredits] = useState(initialData?.generalCredits?.toString() || '');
  const [earnedMajorCredits, setEarnedMajorCredits] = useState(initialData?.earnedMajorCredits?.toString() || '0');
  const [earnedGeneralCredits, setEarnedGeneralCredits] = useState(initialData?.earnedGeneralCredits?.toString() || '0');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const total = parseInt(totalCredits, 10);
    const major = parseInt(majorCredits, 10);
    const majorReq = parseInt(majorRequiredMin, 10);
    const general = parseInt(generalCredits, 10);
    const eMajor = parseInt(earnedMajorCredits, 10);
    const eGeneral = parseInt(earnedGeneralCredits, 10);

    if (isNaN(total) || total < 1) newErrors.totalCredits = '1 이상의 학점을 입력하세요';
    if (isNaN(major) || major < 0) newErrors.majorCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(majorReq) || majorReq < 0) newErrors.majorRequiredMin = '0 이상의 학점을 입력하세요';
    if (isNaN(general) || general < 0) newErrors.generalCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(eMajor) || eMajor < 0) newErrors.earnedMajorCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(eGeneral) || eGeneral < 0) newErrors.earnedGeneralCredits = '0 이상의 학점을 입력하세요';

    // Cross-field validation
    if (!newErrors.totalCredits && !newErrors.majorCredits && !newErrors.generalCredits) {
      if (major + general > total) {
        newErrors.totalCredits = '전공 + 교양 학점이 졸업학점을 초과합니다';
      }
    }
    if (!newErrors.majorRequiredMin && !newErrors.majorCredits) {
      if (majorReq > major) {
        newErrors.majorRequiredMin = '전공핵심은 전공학점 이하여야 합니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      totalCredits: parseInt(totalCredits, 10),
      majorCredits: parseInt(majorCredits, 10),
      majorRequiredMin: parseInt(majorRequiredMin, 10),
      generalCredits: parseInt(generalCredits, 10),
      earnedMajorCredits: parseInt(earnedMajorCredits, 10),
      earnedGeneralCredits: parseInt(earnedGeneralCredits, 10),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      {/* 졸업학점 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">졸업학점</label>
        <Input
          type="number"
          value={totalCredits}
          onChange={(e) => setTotalCredits(e.target.value)}
          placeholder="예: 130"
          min="1"
          className={errors.totalCredits ? 'border-red-500' : ''}
        />
        {errors.totalCredits && <p className="text-xs text-red-500 mt-1">{errors.totalCredits}</p>}
      </div>

      {/* 전공 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">전공학점 합계</label>
          <Input
            type="number"
            value={majorCredits}
            onChange={(e) => setMajorCredits(e.target.value)}
            placeholder="예: 60"
            min="0"
            className={errors.majorCredits ? 'border-red-500' : ''}
          />
          {errors.majorCredits && <p className="text-xs text-red-500 mt-1">{errors.majorCredits}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">전공핵심 최소</label>
          <Input
            type="number"
            value={majorRequiredMin}
            onChange={(e) => setMajorRequiredMin(e.target.value)}
            placeholder="예: 24"
            min="0"
            className={errors.majorRequiredMin ? 'border-red-500' : ''}
          />
          {errors.majorRequiredMin && <p className="text-xs text-red-500 mt-1">{errors.majorRequiredMin}</p>}
        </div>
      </div>

      {/* 교양 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">교양학점 합계</label>
        <Input
          type="number"
          value={generalCredits}
          onChange={(e) => setGeneralCredits(e.target.value)}
          placeholder="예: 30"
          min="0"
          className={errors.generalCredits ? 'border-red-500' : ''}
        />
        {errors.generalCredits && <p className="text-xs text-red-500 mt-1">{errors.generalCredits}</p>}
      </div>

      {/* 기이수 학점 */}
      <div className="border-t pt-4 mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">기이수 학점</p>
        <p className="text-xs text-gray-400 mb-3">계획에 포함되지 않은 이미 이수한 학점을 입력하세요.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">전공</label>
            <Input
              type="number"
              value={earnedMajorCredits}
              onChange={(e) => setEarnedMajorCredits(e.target.value)}
              placeholder="0"
              min="0"
              className={errors.earnedMajorCredits ? 'border-red-500' : ''}
            />
            {errors.earnedMajorCredits && <p className="text-xs text-red-500 mt-1">{errors.earnedMajorCredits}</p>}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">교양</label>
            <Input
              type="number"
              value={earnedGeneralCredits}
              onChange={(e) => setEarnedGeneralCredits(e.target.value)}
              placeholder="0"
              min="0"
              className={errors.earnedGeneralCredits ? 'border-red-500' : ''}
            />
            {errors.earnedGeneralCredits && <p className="text-xs text-red-500 mt-1">{errors.earnedGeneralCredits}</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {initialData ? '수정' : '저장'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}
