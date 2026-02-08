'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';

interface RequirementFormData {
  majorType: 'single' | 'double' | 'minor';
  totalCredits: number;
  primaryMajorCredits: number;
  primaryMajorRequiredMin: number;
  generalCredits: number;
  // Double major (optional)
  secondaryMajorCredits?: number;
  secondaryMajorRequiredMin?: number;
  // Minor (optional)
  minorCredits?: number;
  minorRequiredMin?: number;
  minorPrimaryMajorMin?: number;
  // Earned credits
  earnedTotalCredits: number;
  earnedPrimaryMajorCredits: number;
  earnedGeneralCredits: number;
  earnedPrimaryMajorRequiredCredits: number;
  earnedSecondaryMajorCredits?: number;
  earnedSecondaryMajorRequiredCredits?: number;
  earnedMinorCredits?: number;
  earnedMinorRequiredCredits?: number;
}

interface RequirementFormProps {
  initialData?: RequirementFormData;
  onSubmit: (data: RequirementFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  onLoadFromDeptReq?: () => Promise<Partial<RequirementFormData> | null>;
}

export function RequirementForm({ initialData, onSubmit, onCancel, isLoading, onLoadFromDeptReq }: RequirementFormProps) {
  const [majorType, setMajorType] = useState<'single' | 'double' | 'minor'>(initialData?.majorType || 'single');
  const [totalCredits, setTotalCredits] = useState(initialData?.totalCredits?.toString() || '');
  const [primaryMajorCredits, setPrimaryMajorCredits] = useState(initialData?.primaryMajorCredits?.toString() || '');
  const [primaryMajorRequiredMin, setPrimaryMajorRequiredMin] = useState(initialData?.primaryMajorRequiredMin?.toString() || '');
  const [generalCredits, setGeneralCredits] = useState(initialData?.generalCredits?.toString() || '');

  // Double major fields
  const [secondaryMajorCredits, setSecondaryMajorCredits] = useState(initialData?.secondaryMajorCredits?.toString() || '');
  const [secondaryMajorRequiredMin, setSecondaryMajorRequiredMin] = useState(initialData?.secondaryMajorRequiredMin?.toString() || '');

  // Minor fields
  const [minorCredits, setMinorCredits] = useState(initialData?.minorCredits?.toString() || '');
  const [minorRequiredMin, setMinorRequiredMin] = useState(initialData?.minorRequiredMin?.toString() || '');
  const [minorPrimaryMajorMin, setMinorPrimaryMajorMin] = useState(initialData?.minorPrimaryMajorMin?.toString() || '');

  // Earned credits
  const [earnedTotalCredits, setEarnedTotalCredits] = useState(initialData?.earnedTotalCredits?.toString() || '0');
  const [earnedPrimaryMajorCredits, setEarnedPrimaryMajorCredits] = useState(initialData?.earnedPrimaryMajorCredits?.toString() || '0');
  const [earnedGeneralCredits, setEarnedGeneralCredits] = useState(initialData?.earnedGeneralCredits?.toString() || '0');
  const [earnedPrimaryMajorRequiredCredits, setEarnedPrimaryMajorRequiredCredits] = useState(initialData?.earnedPrimaryMajorRequiredCredits?.toString() || '0');
  const [earnedSecondaryMajorCredits, setEarnedSecondaryMajorCredits] = useState(initialData?.earnedSecondaryMajorCredits?.toString() || '0');
  const [earnedSecondaryMajorRequiredCredits, setEarnedSecondaryMajorRequiredCredits] = useState(initialData?.earnedSecondaryMajorRequiredCredits?.toString() || '0');
  const [earnedMinorCredits, setEarnedMinorCredits] = useState(initialData?.earnedMinorCredits?.toString() || '0');
  const [earnedMinorRequiredCredits, setEarnedMinorRequiredCredits] = useState(initialData?.earnedMinorRequiredCredits?.toString() || '0');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadMessage, setLoadMessage] = useState<string>('');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const total = parseInt(totalCredits, 10);
    const major = parseInt(primaryMajorCredits, 10);
    const majorReq = parseInt(primaryMajorRequiredMin, 10);
    const general = parseInt(generalCredits, 10);
    const eTotal = parseInt(earnedTotalCredits, 10);
    const eMajor = parseInt(earnedPrimaryMajorCredits, 10);
    const eGeneral = parseInt(earnedGeneralCredits, 10);
    const eMajorReq = parseInt(earnedPrimaryMajorRequiredCredits, 10);

    if (isNaN(total) || total < 1) newErrors.totalCredits = '1 이상의 학점을 입력하세요';
    if (isNaN(major) || major < 0) newErrors.primaryMajorCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(majorReq) || majorReq < 0) newErrors.primaryMajorRequiredMin = '0 이상의 학점을 입력하세요';
    if (isNaN(general) || general < 0) newErrors.generalCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(eTotal) || eTotal < 0) newErrors.earnedTotalCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(eMajor) || eMajor < 0) newErrors.earnedPrimaryMajorCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(eGeneral) || eGeneral < 0) newErrors.earnedGeneralCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(eMajorReq) || eMajorReq < 0) newErrors.earnedPrimaryMajorRequiredCredits = '0 이상의 학점을 입력하세요';

    // Double major validation
    if (majorType === 'double') {
      const secMajor = parseInt(secondaryMajorCredits, 10);
      const secMajorReq = parseInt(secondaryMajorRequiredMin, 10);
      const eSecMajor = parseInt(earnedSecondaryMajorCredits, 10);
      const eSecMajorReq = parseInt(earnedSecondaryMajorRequiredCredits, 10);

      if (isNaN(secMajor) || secMajor < 0) newErrors.secondaryMajorCredits = '0 이상의 학점을 입력하세요';
      if (isNaN(secMajorReq) || secMajorReq < 0) newErrors.secondaryMajorRequiredMin = '0 이상의 학점을 입력하세요';
      if (isNaN(eSecMajor) || eSecMajor < 0) newErrors.earnedSecondaryMajorCredits = '0 이상의 학점을 입력하세요';
      if (isNaN(eSecMajorReq) || eSecMajorReq < 0) newErrors.earnedSecondaryMajorRequiredCredits = '0 이상의 학점을 입력하세요';

      if (!newErrors.secondaryMajorRequiredMin && !newErrors.secondaryMajorCredits) {
        if (secMajorReq > secMajor) {
          newErrors.secondaryMajorRequiredMin = '복수전공핵심은 복수전공학점 이하여야 합니다';
        }
      }
    }

    // Minor validation
    if (majorType === 'minor') {
      const minor = parseInt(minorCredits, 10);
      const minorReq = parseInt(minorRequiredMin, 10);
      const minorPrimaryReq = parseInt(minorPrimaryMajorMin, 10);
      const eMinor = parseInt(earnedMinorCredits, 10);
      const eMinorReq = parseInt(earnedMinorRequiredCredits, 10);

      if (isNaN(minor) || minor < 0) newErrors.minorCredits = '0 이상의 학점을 입력하세요';
      if (isNaN(minorReq) || minorReq < 0) newErrors.minorRequiredMin = '0 이상의 학점을 입력하세요';
      if (isNaN(minorPrimaryReq) || minorPrimaryReq < 0) newErrors.minorPrimaryMajorMin = '0 이상의 학점을 입력하세요';
      if (isNaN(eMinor) || eMinor < 0) newErrors.earnedMinorCredits = '0 이상의 학점을 입력하세요';
      if (isNaN(eMinorReq) || eMinorReq < 0) newErrors.earnedMinorRequiredCredits = '0 이상의 학점을 입력하세요';

      if (!newErrors.minorRequiredMin && !newErrors.minorCredits) {
        if (minorReq > minor) {
          newErrors.minorRequiredMin = '부전공핵심은 부전공학점 이하여야 합니다';
        }
      }
    }

    // Cross-field validation
    if (!newErrors.primaryMajorRequiredMin && !newErrors.primaryMajorCredits) {
      if (majorReq > major) {
        newErrors.primaryMajorRequiredMin = '전공핵심은 전공학점 이하여야 합니다';
      }
    }

    if (!newErrors.totalCredits && !newErrors.primaryMajorCredits && !newErrors.generalCredits) {
      const secMajor = majorType === 'double' ? parseInt(secondaryMajorCredits, 10) || 0 : 0;
      const minor = majorType === 'minor' ? parseInt(minorCredits, 10) || 0 : 0;

      if (major + secMajor + minor + general > total) {
        newErrors.totalCredits = '전공 + 복수전공/부전공 + 교양 학점이 졸업학점을 초과합니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoadFromDeptReq = async () => {
    if (!onLoadFromDeptReq) return;
    try {
      const data = await onLoadFromDeptReq();
      if (data) {
        if (data.majorType) setMajorType(data.majorType);
        if (data.totalCredits !== undefined) setTotalCredits(data.totalCredits.toString());
        if (data.primaryMajorCredits !== undefined) setPrimaryMajorCredits(data.primaryMajorCredits.toString());
        if (data.primaryMajorRequiredMin !== undefined) setPrimaryMajorRequiredMin(data.primaryMajorRequiredMin.toString());
        if (data.generalCredits !== undefined) setGeneralCredits(data.generalCredits.toString());
        if (data.secondaryMajorCredits !== undefined) setSecondaryMajorCredits(data.secondaryMajorCredits.toString());
        if (data.secondaryMajorRequiredMin !== undefined) setSecondaryMajorRequiredMin(data.secondaryMajorRequiredMin.toString());
        if (data.minorCredits !== undefined) setMinorCredits(data.minorCredits.toString());
        if (data.minorRequiredMin !== undefined) setMinorRequiredMin(data.minorRequiredMin.toString());
        if (data.minorPrimaryMajorMin !== undefined) setMinorPrimaryMajorMin(data.minorPrimaryMajorMin.toString());
        setLoadMessage('학과 기준표에서 불러왔습니다. 수정할 수 있습니다.');
      }
    } catch (error) {
      console.error('Failed to load from department requirements:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      majorType,
      totalCredits: parseInt(totalCredits, 10),
      primaryMajorCredits: parseInt(primaryMajorCredits, 10),
      primaryMajorRequiredMin: parseInt(primaryMajorRequiredMin, 10),
      generalCredits: parseInt(generalCredits, 10),
      ...(majorType === 'double' ? {
        secondaryMajorCredits: parseInt(secondaryMajorCredits, 10),
        secondaryMajorRequiredMin: parseInt(secondaryMajorRequiredMin, 10),
      } : {}),
      ...(majorType === 'minor' ? {
        minorCredits: parseInt(minorCredits, 10),
        minorRequiredMin: parseInt(minorRequiredMin, 10),
        minorPrimaryMajorMin: parseInt(minorPrimaryMajorMin, 10),
      } : {}),
      earnedTotalCredits: parseInt(earnedTotalCredits, 10),
      earnedPrimaryMajorCredits: parseInt(earnedPrimaryMajorCredits, 10),
      earnedGeneralCredits: parseInt(earnedGeneralCredits, 10),
      earnedPrimaryMajorRequiredCredits: parseInt(earnedPrimaryMajorRequiredCredits, 10),
      ...(majorType === 'double' ? {
        earnedSecondaryMajorCredits: parseInt(earnedSecondaryMajorCredits, 10),
        earnedSecondaryMajorRequiredCredits: parseInt(earnedSecondaryMajorRequiredCredits, 10),
      } : {}),
      ...(majorType === 'minor' ? {
        earnedMinorCredits: parseInt(earnedMinorCredits, 10),
        earnedMinorRequiredCredits: parseInt(earnedMinorRequiredCredits, 10),
      } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-4 bg-gray-50 rounded-lg border">
      {/* 전공 유형 */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-800 border-b pb-2">전공 유형</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="majorType"
              value="single"
              checked={majorType === 'single'}
              onChange={(e) => setMajorType(e.target.value as 'single' | 'double' | 'minor')}
              className="w-4 h-4"
            />
            <span className="text-sm">단일전공</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="majorType"
              value="double"
              checked={majorType === 'double'}
              onChange={(e) => setMajorType(e.target.value as 'single' | 'double' | 'minor')}
              className="w-4 h-4"
            />
            <span className="text-sm">복수전공</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="majorType"
              value="minor"
              checked={majorType === 'minor'}
              onChange={(e) => setMajorType(e.target.value as 'single' | 'double' | 'minor')}
              className="w-4 h-4"
            />
            <span className="text-sm">부전공</span>
          </label>
        </div>
        {onLoadFromDeptReq && (
          <div className="space-y-1">
            <Button type="button" variant="outline" size="sm" onClick={handleLoadFromDeptReq}>
              학과 기준표에서 불러오기
            </Button>
            {loadMessage && <p className="text-xs text-blue-600">{loadMessage}</p>}
          </div>
        )}
      </div>

      {/* 졸업 기준 */}
      <div className="border-t pt-4">
        <p className="text-sm font-semibold text-gray-800 border-b pb-2 mb-3">졸업 기준</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">졸업학점</label>
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
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">교양학점</label>
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
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">전공학점</label>
            <Input
              type="number"
              value={primaryMajorCredits}
              onChange={(e) => setPrimaryMajorCredits(e.target.value)}
              placeholder="예: 60"
              min="0"
              className={errors.primaryMajorCredits ? 'border-red-500' : ''}
            />
            {errors.primaryMajorCredits && <p className="text-xs text-red-500 mt-1">{errors.primaryMajorCredits}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">전공핵심 (최소)</label>
            <Input
              type="number"
              value={primaryMajorRequiredMin}
              onChange={(e) => setPrimaryMajorRequiredMin(e.target.value)}
              placeholder="예: 24"
              min="0"
              className={errors.primaryMajorRequiredMin ? 'border-red-500' : ''}
            />
            {errors.primaryMajorRequiredMin && <p className="text-xs text-red-500 mt-1">{errors.primaryMajorRequiredMin}</p>}
          </div>
        </div>
      </div>

      {/* 복수전공 */}
      {majorType === 'double' && (
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-800 border-b pb-2 mb-3">복수전공</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">복수전공 학점</label>
              <Input
                type="number"
                value={secondaryMajorCredits}
                onChange={(e) => setSecondaryMajorCredits(e.target.value)}
                placeholder="예: 60"
                min="0"
                className={errors.secondaryMajorCredits ? 'border-red-500' : ''}
              />
              {errors.secondaryMajorCredits && <p className="text-xs text-red-500 mt-1">{errors.secondaryMajorCredits}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">복수전공핵심 (최소)</label>
              <Input
                type="number"
                value={secondaryMajorRequiredMin}
                onChange={(e) => setSecondaryMajorRequiredMin(e.target.value)}
                placeholder="예: 24"
                min="0"
                className={errors.secondaryMajorRequiredMin ? 'border-red-500' : ''}
              />
              {errors.secondaryMajorRequiredMin && <p className="text-xs text-red-500 mt-1">{errors.secondaryMajorRequiredMin}</p>}
            </div>
          </div>
        </div>
      )}

      {/* 부전공 */}
      {majorType === 'minor' && (
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-800 border-b pb-2 mb-3">부전공</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">부전공 학점</label>
              <Input
                type="number"
                value={minorCredits}
                onChange={(e) => setMinorCredits(e.target.value)}
                placeholder="예: 21"
                min="0"
                className={errors.minorCredits ? 'border-red-500' : ''}
              />
              {errors.minorCredits && <p className="text-xs text-red-500 mt-1">{errors.minorCredits}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">부전공핵심 (최소)</label>
              <Input
                type="number"
                value={minorRequiredMin}
                onChange={(e) => setMinorRequiredMin(e.target.value)}
                placeholder="예: 9"
                min="0"
                className={errors.minorRequiredMin ? 'border-red-500' : ''}
              />
              {errors.minorRequiredMin && <p className="text-xs text-red-500 mt-1">{errors.minorRequiredMin}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">주전공 최소 학점</label>
              <Input
                type="number"
                value={minorPrimaryMajorMin}
                onChange={(e) => setMinorPrimaryMajorMin(e.target.value)}
                placeholder="예: 63"
                min="0"
                className={errors.minorPrimaryMajorMin ? 'border-red-500' : ''}
              />
              {errors.minorPrimaryMajorMin && <p className="text-xs text-red-500 mt-1">{errors.minorPrimaryMajorMin}</p>}
            </div>
          </div>
        </div>
      )}

      {/* 기이수 학점 */}
      <div className="border-t pt-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">기이수 학점</p>
          <p className="text-xs text-gray-400 mt-0.5 mb-3">계획에 포함되지 않은 이미 이수한 학점</p>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">졸업학점</label>
            <Input
              type="number"
              value={earnedTotalCredits}
              onChange={(e) => setEarnedTotalCredits(e.target.value)}
              placeholder="0"
              min="0"
              className={errors.earnedTotalCredits ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-400 mt-0.5">이미 이수한 총 학점 (전공+교양+기타 포함)</p>
            {errors.earnedTotalCredits && <p className="text-xs text-red-500 mt-1">{errors.earnedTotalCredits}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">교양</label>
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
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">전공</label>
            <Input
              type="number"
              value={earnedPrimaryMajorCredits}
              onChange={(e) => setEarnedPrimaryMajorCredits(e.target.value)}
              placeholder="0"
              min="0"
              className={errors.earnedPrimaryMajorCredits ? 'border-red-500' : ''}
            />
            {errors.earnedPrimaryMajorCredits && <p className="text-xs text-red-500 mt-1">{errors.earnedPrimaryMajorCredits}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">전공핵심</label>
            <Input
              type="number"
              value={earnedPrimaryMajorRequiredCredits}
              onChange={(e) => setEarnedPrimaryMajorRequiredCredits(e.target.value)}
              placeholder="0"
              min="0"
              className={errors.earnedPrimaryMajorRequiredCredits ? 'border-red-500' : ''}
            />
            {errors.earnedPrimaryMajorRequiredCredits && <p className="text-xs text-red-500 mt-1">{errors.earnedPrimaryMajorRequiredCredits}</p>}
          </div>
          {majorType === 'double' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">복수전공</label>
                <Input
                  type="number"
                  value={earnedSecondaryMajorCredits}
                  onChange={(e) => setEarnedSecondaryMajorCredits(e.target.value)}
                  placeholder="0"
                  min="0"
                  className={errors.earnedSecondaryMajorCredits ? 'border-red-500' : ''}
                />
                {errors.earnedSecondaryMajorCredits && <p className="text-xs text-red-500 mt-1">{errors.earnedSecondaryMajorCredits}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">복수전공핵심</label>
                <Input
                  type="number"
                  value={earnedSecondaryMajorRequiredCredits}
                  onChange={(e) => setEarnedSecondaryMajorRequiredCredits(e.target.value)}
                  placeholder="0"
                  min="0"
                  className={errors.earnedSecondaryMajorRequiredCredits ? 'border-red-500' : ''}
                />
                {errors.earnedSecondaryMajorRequiredCredits && <p className="text-xs text-red-500 mt-1">{errors.earnedSecondaryMajorRequiredCredits}</p>}
              </div>
            </>
          )}
          {majorType === 'minor' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">부전공</label>
                <Input
                  type="number"
                  value={earnedMinorCredits}
                  onChange={(e) => setEarnedMinorCredits(e.target.value)}
                  placeholder="0"
                  min="0"
                  className={errors.earnedMinorCredits ? 'border-red-500' : ''}
                />
                {errors.earnedMinorCredits && <p className="text-xs text-red-500 mt-1">{errors.earnedMinorCredits}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">부전공핵심</label>
                <Input
                  type="number"
                  value={earnedMinorRequiredCredits}
                  onChange={(e) => setEarnedMinorRequiredCredits(e.target.value)}
                  placeholder="0"
                  min="0"
                  className={errors.earnedMinorRequiredCredits ? 'border-red-500' : ''}
                />
                {errors.earnedMinorRequiredCredits && <p className="text-xs text-red-500 mt-1">{errors.earnedMinorRequiredCredits}</p>}
              </div>
            </>
          )}
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
