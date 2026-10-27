'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, PageHeader, SearchableSelect } from '@/components/ui';
import type { ApiResponse, MajorType } from '@/types';
import { DEFAULT_CURRICULUM_YEAR } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
import { useGuestPlanStore } from '@/stores/guestPlanStore';
import { useGuestCourseStore } from '@/stores/guestCourseStore';
import { useGuestGraduationStore } from '@/stores/guestGraduationStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import {
  DangerRow,
  Field,
  InfoRow,
  ProfileSection,
  SectionBand,
  UnderlineSelect,
} from './_components/ProfileParts';

interface Department {
  _id: string;
  code: string;
  name: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  department: Department | null;
  enrollmentYear: number | null;
  role: string;
  image?: string;
  majorType?: MajorType;
  secondaryDepartment?: Department | null;
  curriculumYear?: number;
}

interface ProfileForm {
  name: string;
  enrollmentYear: string;
  department: string;
  majorType: MajorType;
  secondaryDepartment: string;
  curriculumYear: string;
}

const CURRICULUM_YEARS = ['2025', '2026'];

// 기존 입력(min 2000, max 2030) 및 PATCH /api/users/me 검증 범위와 동일
const ENROLLMENT_YEARS = Array.from({ length: 2030 - 2000 + 1 }, (_, i) => String(2030 - i));

const MAJOR_TYPE_OPTIONS: { value: MajorType; label: string; description: string }[] = [
  { value: 'single', label: '단일전공', description: '주전공 하나만 이수' },
  { value: 'double', label: '복수전공', description: '두 번째 전공의 요건을 함께 추적' },
  { value: 'minor', label: '부전공', description: '부전공 요건을 함께 추적' },
];

function isSameBasic(a: ProfileForm, b: ProfileForm) {
  return (
    a.name === b.name &&
    a.enrollmentYear === b.enrollmentYear &&
    a.department === b.department &&
    a.curriculumYear === b.curriculumYear
  );
}

/** 단일전공이면 두 번째 학과는 저장되지 않으므로 비교에서 제외한다. */
function isSameMajor(a: ProfileForm, b: ProfileForm) {
  return (
    a.majorType === b.majorType &&
    (a.majorType === 'single' || a.secondaryDepartment === b.secondaryDepartment)
  );
}

type SaveSection = 'basic' | 'major';

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestProfile = useGuestProfileStore();
  const router = useRouter();
  const clearAllGuestData = useGuestStore((s) => s.clearAllGuestData);
  const clearAllPlans = useGuestPlanStore((s) => s.clearAll);
  const clearAllCourses = useGuestCourseStore((s) => s.clearAll);
  const resetGraduation = useGuestGraduationStore((s) => s.reset);
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);
  // 마지막 저장을 요청한 영역 — 상태 문구를 해당 영역에만 표시
  const [saveSection, setSaveSection] = useState<SaveSection | null>(null);
  const [formData, setFormData] = useState<ProfileForm>({
    name: '',
    enrollmentYear: '',
    department: '',
    majorType: 'single',
    secondaryDepartment: '',
    curriculumYear: String(DEFAULT_CURRICULUM_YEAR),
  });

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '정말로 회원 탈퇴하시겠습니까?\n\n모든 수강 계획, 커스텀 과목 등 계정과 관련된 모든 데이터가 영구적으로 삭제됩니다.\n\n이 작업은 되돌릴 수 없습니다.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/users/me', { method: 'DELETE' });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || '계정 삭제에 실패했습니다.');
      }
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      Sentry.captureException(error);
      alert('계정 삭제에 실패했습니다. 다시 시도해주세요.');
      setIsDeleting(false);
    }
  };

  const handleResetGuestData = () => {
    const confirmed = window.confirm(
      '정말로 모든 데이터를 초기화하시겠습니까?\n\n프로필, 수강계획, 커스텀 과목, 졸업요건 등 모든 데이터가 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.'
    );
    if (!confirmed) return;

    // Reset in-memory Zustand state
    guestProfile.reset();
    clearAllPlans();
    clearAllCourses();
    resetGraduation();

    // Clear localStorage as safety net
    clearAllGuestData();

    // Navigate to home
    router.push('/');
  };

  // Fetch current user profile
  const { data: userProfile, isLoading: isLoadingProfile, isError: isProfileError, isFetching: isFetchingProfile, refetch: refetchProfile } = useQuery<UserProfile>({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/users/me');
      const result: ApiResponse<UserProfile> = await res.json();
      if (!result.success || !result.data) throw new Error(result.error || '사용자 정보를 불러올 수 없습니다.');
      return result.data;
    },
    enabled: !!session,
  });

  // Fetch departments for dropdown
  const { data: departments = [], isError: isDepartmentsError, isFetching: isFetchingDepartments, refetch: refetchDepartments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch('/api/departments');
      const result: ApiResponse<Department[]> = await res.json();
      if (!result.success || !result.data) throw new Error(result.error || '학과 정보를 불러올 수 없습니다.');
      return result.data;
    },
  });

  const departmentOptions = useMemo(() =>
    departments.map((dept) => ({
      value: dept._id,
      label: dept.name,
    })),
    [departments]
  );

  // 저장된 값 (회원: 서버 프로필, 비회원: guestProfileStore) — 폼 초기값이자 변경 여부 기준
  const savedForm = useMemo<ProfileForm | null>(() => {
    if (isGuest) {
      return {
        name: guestProfile.name || '',
        enrollmentYear: guestProfile.enrollmentYear?.toString() || '',
        department: guestProfile.departmentId || '',
        majorType: guestProfile.majorType || 'single',
        secondaryDepartment: guestProfile.secondaryDepartmentId || '',
        curriculumYear: guestProfile.curriculumYear?.toString() || String(DEFAULT_CURRICULUM_YEAR),
      };
    }
    if (userProfile) {
      return {
        name: userProfile.name || '',
        enrollmentYear: userProfile.enrollmentYear?.toString() || '',
        department: userProfile.department?._id || '',
        majorType: userProfile.majorType || 'single',
        secondaryDepartment: userProfile.secondaryDepartment?._id || '',
        curriculumYear: userProfile.curriculumYear?.toString() || String(DEFAULT_CURRICULUM_YEAR),
      };
    }
    return null;
  }, [isGuest, userProfile, guestProfile.name, guestProfile.enrollmentYear, guestProfile.departmentId, guestProfile.majorType, guestProfile.secondaryDepartmentId, guestProfile.curriculumYear]);

  // Pre-populate form when the saved profile loads or changes
  useEffect(() => {
    if (savedForm) {
      setFormData(savedForm);
    }
  }, [savedForm]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; department?: string; enrollmentYear?: number; curriculumYear?: number; majorType?: MajorType; secondaryDepartment?: string | null }) => {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<UserProfile> = await res.json();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      await queryClient.invalidateQueries({ queryKey: ['graduation-requirement'] });
      // Refresh NextAuth session to update JWT with new department/curriculumYear
      await updateSession();
      setJustSaved(true);
    },
  });

  const updateForm = (patch: Partial<ProfileForm>) => {
    setJustSaved(false);
    if (updateMutation.isError) updateMutation.reset();
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    updateForm({ [e.target.name]: e.target.value } as Partial<ProfileForm>);
  };

  const handleMajorTypeChange = (majorType: MajorType) => {
    if (majorType === formData.majorType) return;
    updateForm({ majorType, secondaryDepartment: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormDisabled || isSaving) return;
    setValidationAttempted(true);
    if (!formData.name.trim() || !formData.enrollmentYear) return;
    setSaveSection('basic');
    if (isGuest) {
      // 비회원 기본 정보 저장은 전공 설정을 포함하지 않는다
      guestProfile.setProfile({
        name: formData.name.trim(),
        enrollmentYear: parseInt(formData.enrollmentYear, 10),
        curriculumYear: formData.curriculumYear ? parseInt(formData.curriculumYear, 10) : undefined,
        departmentId: formData.department || undefined,
        departmentName: departments.find((d) => d._id === formData.department)?.name || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setJustSaved(true);
      return;
    }

    const updateData: { name?: string; department?: string; enrollmentYear?: number; curriculumYear?: number; majorType?: MajorType; secondaryDepartment?: string | null } = {};

    updateData.name = formData.name.trim();
    if (formData.department) updateData.department = formData.department;
    updateData.enrollmentYear = parseInt(formData.enrollmentYear, 10);
    if (formData.curriculumYear) updateData.curriculumYear = parseInt(formData.curriculumYear, 10);
    updateData.majorType = formData.majorType;
    updateData.secondaryDepartment = formData.majorType !== 'single' && formData.secondaryDepartment ? formData.secondaryDepartment : null;

    updateMutation.mutate(updateData);
  };

  // 전공 설정 전용 저장 — majorType/두 번째 전공만 저장한다
  const handleSaveMajor = () => {
    if (isFormDisabled || isSaving) return;
    setValidationAttempted(true);
    if (!formData.name.trim() || !formData.enrollmentYear) return;
    if (updateMutation.isError) updateMutation.reset();
    setSaveSection('major');
    if (isGuest) {
      guestProfile.setProfile({
        majorType: formData.majorType,
        secondaryDepartmentId: formData.majorType !== 'single' && formData.secondaryDepartment ? formData.secondaryDepartment : undefined,
        secondaryDepartmentName: formData.majorType !== 'single' && formData.secondaryDepartment
          ? departments.find((d) => d._id === formData.secondaryDepartment)?.name || undefined
          : undefined,
      });
      setJustSaved(true);
      return;
    }

    const updateData: { majorType?: MajorType; secondaryDepartment?: string | null } = {
      majorType: formData.majorType,
      secondaryDepartment: formData.majorType !== 'single' && formData.secondaryDepartment ? formData.secondaryDepartment : null,
    };
    updateMutation.mutate(updateData);
  };

  const isBasicDirty = savedForm != null && !isSameBasic(formData, savedForm);
  const isMajorDirty = savedForm != null && !isSameMajor(formData, savedForm);
  // 회원 기본 정보 저장은 전공 설정까지 함께 보낸다
  const isDirty = isGuest ? isBasicDirty : isBasicDirty || isMajorDirty;
  const isSaving = !isGuest && updateMutation.isPending;
  const isFormDisabled = !isGuest && (isLoadingProfile || isProfileError || !userProfile || !savedForm);
  const nameError = validationAttempted && !formData.name.trim() ? '이름을 입력해주세요.' : undefined;
  const yearError = validationAttempted && !formData.enrollmentYear ? '입학년도를 선택해주세요.' : undefined;
  const saveError = !isGuest && updateMutation.isError
    ? updateMutation.error?.message || '저장에 실패했습니다.'
    : null;
  const isGoogleAccount = !!session?.user?.image;
  const secondaryLabel = formData.majorType === 'double' ? '복수전공 학과' : '부전공 학과';
  const primaryDepartmentName = departments.find((d) => d._id === formData.department)?.name;

  let statusText = '';
  let statusClass = 'text-ink-2';
  if (saveError && saveSection === 'basic') {
    statusText = saveError;
    statusClass = 'text-negative';
  } else if (justSaved && saveSection === 'basic' && !isDirty) {
    statusText = '저장되었습니다';
    statusClass = 'text-positive';
  } else if (isDirty) {
    statusText = '저장되지 않은 변경이 있어요';
  }

  let majorStatusText = '';
  let majorStatusClass = 'text-ink-2';
  if (saveError && saveSection === 'major') {
    majorStatusText = saveError;
    majorStatusClass = 'text-negative';
  } else if (isMajorDirty) {
    majorStatusText = '전공 설정이 아직 저장되지 않았어요';
  } else if (justSaved && saveSection === 'major') {
    majorStatusText = '저장되었습니다';
    majorStatusClass = 'text-positive';
  }

  return (
    <div className="flex max-w-[720px] flex-col">
      <PageHeader
        title="프로필"
        description="프로필을 설정하면 과목 리스트가 학과별로 필터됩니다."
      />

      {isFormDisabled ? (
        <section className="flex flex-col items-start gap-3 border-t border-line-2 py-7">
          {isProfileError ? (
            <div role="alert" className="flex flex-wrap items-center gap-3">
              <p className="m-0 text-[15px] text-negative">프로필을 불러오지 못했습니다.</p>
              <Button variant="textPrimary" onClick={() => refetchProfile()} disabled={isFetchingProfile}>
                {isFetchingProfile ? '다시 불러오는 중...' : '다시 시도'}
              </Button>
            </div>
          ) : <p role="status" className="m-0 text-[15px] text-ink-2">프로필을 불러오는 중...</p>}
          <Button disabled>저장</Button>
        </section>
      ) : (
      <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
        {isDepartmentsError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 border-t border-line-2 py-4">
            <p className="m-0 text-[14px] text-negative">학과 목록을 불러오지 못했습니다. 다시 불러온 뒤 학과를 선택해주세요.</p>
            <Button type="button" variant="textPrimary" onClick={() => refetchDepartments()} disabled={isFetchingDepartments}>
              {isFetchingDepartments ? '다시 불러오는 중...' : '다시 시도'}
            </Button>
          </div>
        )}
        <ProfileSection id="basic-title" title="기본 정보">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-x-10 gap-y-2">
            {!isGuest && (
              <Field
                label="이메일"
                htmlFor="p-email"
                helper={isGoogleAccount ? 'Google 계정으로 로그인됨 · 변경 불가' : '이메일 계정 · 변경 불가'}
              >
                <input
                  id="p-email"
                  type="email"
                  value={userProfile?.email || session?.user?.email || ''}
                  readOnly
                  className="h-10 w-full rounded-none border-0 border-b border-line-3 bg-transparent px-0 text-[17px] font-medium text-ink-2 focus:outline-none focus-visible:outline-none"
                />
              </Field>
            )}
            <Field label="이름" htmlFor="p-name">
              <Input
                id="p-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="이름"
                autoComplete="name"
                required
                error={nameError}
                disabled={isFormDisabled}
              />
            </Field>
            <Field label="입학년도" htmlFor="p-year">
              <UnderlineSelect
                id="p-year"
                name="enrollmentYear"
                required
                aria-invalid={!!yearError}
                aria-describedby={yearError ? 'p-year-error' : undefined}
                value={formData.enrollmentYear}
                onChange={handleChange}
                disabled={isFormDisabled}
              >
                <option value="">입학년도 선택</option>
                {ENROLLMENT_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </UnderlineSelect>
              {yearError && <p id="p-year-error" className="m-0 text-[12px] leading-4 text-negative">{yearError}</p>}
            </Field>
            <Field
              label="커리큘럼 연도"
              htmlFor="p-curriculum"
              helper="과목 리스트에 표시될 커리큘럼 연도를 선택합니다"
            >
              <UnderlineSelect
                id="p-curriculum"
                name="curriculumYear"
                value={formData.curriculumYear}
                onChange={handleChange}
                disabled={isFormDisabled}
              >
                {CURRICULUM_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </UnderlineSelect>
            </Field>
            <Field label="학과" htmlFor="p-dept">
              <SearchableSelect
                id="p-dept"
                options={departmentOptions}
                value={formData.department}
                onChange={(val) => updateForm({ department: val })}
                placeholder="학과를 검색하세요"
                disabled={isFormDisabled || isDepartmentsError}
              />
            </Field>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" disabled={isSaving || isFormDisabled}>
              {isSaving && saveSection === 'basic' ? '저장 중...' : '저장'}
            </Button>
            <span role="status" aria-live="polite" className={cn('text-[13px] leading-[18px]', statusClass)}>
              {statusText}
            </span>
          </div>
        </ProfileSection>

        <SectionBand />

        <ProfileSection
          id="major-title"
          title="전공 설정"
          description="복수전공 / 부전공을 설정하면 졸업 요건에 두 번째 전공 트랙이 추가됩니다."
        >
          <div role="radiogroup" aria-labelledby="major-title" className="flex flex-col">
            {MAJOR_TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex min-h-[52px] cursor-pointer items-center gap-3.5 border-b border-line py-2"
              >
                <input
                  type="radio"
                  name="majorType"
                  value={option.value}
                  checked={formData.majorType === option.value}
                  onChange={() => handleMajorTypeChange(option.value)}
                  disabled={isFormDisabled}
                  className="m-0 h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                />
                <span className="flex-1 text-[15px] font-medium text-ink">{option.label}</span>
                <span className="text-right text-[13px] text-ink-2">
                  {option.value === 'single' && primaryDepartmentName ? primaryDepartmentName : option.description}
                </span>
              </label>
            ))}
          </div>

          {formData.majorType !== 'single' && (
            <Field label={secondaryLabel} htmlFor="p-secondary-dept" accent className="max-w-[340px] pt-5">
              <div className="[&_input]:border-primary [&_input]:shadow-[inset_0_-1px_0_var(--color-primary)]">
                <SearchableSelect
                  id="p-secondary-dept"
                  options={departmentOptions.filter((d) => d.value !== formData.department)}
                  value={formData.secondaryDepartment}
                  onChange={(val) => updateForm({ secondaryDepartment: val })}
                  placeholder="학과를 검색하세요"
                  disabled={isFormDisabled || isDepartmentsError}
                />
              </div>
            </Field>
          )}

          {/* 채운 저장 버튼은 기본 정보에 하나 — 전공 설정은 글자 버튼으로 따로 저장 */}
          <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', majorStatusText && 'mt-4')}>
            <span role="status" aria-live="polite" className={cn('text-[13px] leading-[18px]', majorStatusClass)}>
              {majorStatusText}
            </span>
            {(isMajorDirty || (saveError && saveSection === 'major')) && (
              <Button
                type="button"
                variant="textPrimary"
                size="sm"
                onClick={handleSaveMajor}
                disabled={isSaving || isFormDisabled}
              >
                {isSaving && saveSection === 'major' ? '저장 중...' : '변경 저장'}
              </Button>
            )}
          </div>
        </ProfileSection>
      </form>
      )}

      <SectionBand />

      <ProfileSection id="account-title" title="계정 정보">
        {isGuest ? (
          <>
            <InfoRow label="계정 유형">비회원</InfoRow>
            <InfoRow label="데이터 저장">이 브라우저에만 저장</InfoRow>
            <Link
              href="/register"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 self-start text-[15px] font-semibold text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
            >
              회원가입하여 데이터 영구 저장
              <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </>
        ) : (
          <>
            <InfoRow label="계정 유형">{isGoogleAccount ? 'Google 계정' : '이메일 계정'}</InfoRow>
            <InfoRow label="데이터 저장">서버에 저장 · 모든 기기에서 동기화</InfoRow>
            <InfoRow label="권한">{session?.user?.role === 'admin' ? '관리자' : '학생'}</InfoRow>
          </>
        )}
      </ProfileSection>

      <SectionBand />

      <ProfileSection id="danger-title" title="계정 관리" className="pb-0">
        {isGuest ? (
          <DangerRow
            title="계정 초기화"
            description="프로필, 수강계획, 커스텀 과목, 졸업요건 등 모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
            actionLabel="초기화"
            onAction={handleResetGuestData}
          />
        ) : (
          <DangerRow
            title="회원 탈퇴"
            description="모든 수강 계획, 커스텀 과목 등 계정과 관련된 모든 데이터가 영구적으로 삭제됩니다."
            actionLabel={isDeleting ? '삭제 중...' : '탈퇴'}
            onAction={handleDeleteAccount}
            disabled={isDeleting}
          />
        )}
      </ProfileSection>
    </div>
  );
}
