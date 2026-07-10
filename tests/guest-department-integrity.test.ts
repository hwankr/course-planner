import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import mongoose from 'mongoose';

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/course-planner-test';
process.env.NEXTAUTH_SECRET ||= 'test-nextauth-secret';
process.env.GOOGLE_CLIENT_ID ||= 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET ||= 'test-google-client-secret';

(globalThis as typeof globalThis & {
  mongooseCache?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}).mongooseCache = { conn: mongoose, promise: null };

const primaryDepartmentId = '64d000000000000000000001';
const secondaryDepartmentId = '64d000000000000000000002';

function requirement(majorType: 'double' | 'minor') {
  return {
    majorType,
    totalCredits: 120,
    primaryMajorCredits: 45,
    primaryMajorRequiredMin: 18,
    generalCredits: 30,
    secondaryMajorCredits: majorType === 'double' ? 36 : undefined,
    secondaryMajorRequiredMin: majorType === 'double' ? 12 : undefined,
    minorCredits: majorType === 'minor' ? 21 : undefined,
    minorRequiredMin: majorType === 'minor' ? 9 : undefined,
    earnedTotalCredits: 0,
    earnedPrimaryMajorCredits: 0,
    earnedGeneralCredits: 0,
    earnedPrimaryMajorRequiredCredits: 0,
    earnedSecondaryMajorCredits: 0,
    earnedSecondaryMajorRequiredCredits: 0,
    earnedMinorCredits: 0,
    earnedMinorRequiredCredits: 0,
  };
}

function secondaryPlan() {
  return [{
    year: 1,
    term: 'spring',
    courses: [{
      id: 'secondary-course',
      code: 'SEC101',
      name: '보조전공 과목',
      credits: 3,
      category: 'major_required',
      departmentId: secondaryDepartmentId,
      status: 'planned' as const,
    }],
  }];
}

test('guest double-major courses count only toward the secondary-major track', async () => {
  const { calculateGuestProgress } = await import('../src/stores/guestGraduationStore');

  const progress = calculateGuestProgress(
    requirement('double'),
    secondaryPlan(),
    primaryDepartmentId,
    secondaryDepartmentId
  );

  assert.equal(progress.primaryMajor.planned, 0);
  assert.equal(progress.secondaryMajor?.planned, 3);
  assert.equal(progress.secondaryMajor?.requiredMin.planned, 3);
});

test('guest minor courses count only toward the minor track', async () => {
  const { calculateGuestProgress } = await import('../src/stores/guestGraduationStore');

  const progress = calculateGuestProgress(
    requirement('minor'),
    secondaryPlan(),
    primaryDepartmentId,
    secondaryDepartmentId
  );

  assert.equal(progress.primaryMajor.planned, 0);
  assert.equal(progress.minor?.planned, 3);
  assert.equal(progress.minor?.requiredMin.planned, 3);
});

test('guest plan and planner mappings preserve departmentId for click, drag, sync, and preview', async () => {
  const [guestPlanSource, plannerSource, previewSource] = await Promise.all([
    readFile(resolve(process.cwd(), 'src/stores/guestPlanStore.ts'), 'utf8'),
    readFile(resolve(process.cwd(), 'src/app/(dashboard)/planner/page.tsx'), 'utf8'),
    readFile(resolve(process.cwd(), 'src/hooks/useGraduationPreview.ts'), 'utf8'),
  ]);

  assert.match(guestPlanSource, /export interface GuestPlannedCourse[\s\S]*departmentId\?: string;/);
  assert.match(plannerSource, /departmentId:\s*courseData\.departmentId/);
  assert.match(plannerSource, /departmentId:\s*dragData\?\.departmentId/);
  assert.match(plannerSource, /departmentId:\s*c\.departmentId/);
  assert.match(plannerSource, /departmentId:\s*courseData\.departmentId,[\s\S]*addCourseMutation\.mutateAsync/);
  assert.match(previewSource, /departmentId:\s*c\.departmentId/);
  assert.match(previewSource, /departmentId:\s*previewCourse\.departmentId/);
});

test('catalog passes the active department through add and custom-course flows', async () => {
  const [catalogSource, formSource] = await Promise.all([
    readFile(resolve(process.cwd(), 'src/components/features/CourseCatalog.tsx'), 'utf8'),
    readFile(resolve(process.cwd(), 'src/components/features/CustomCourseForm.tsx'), 'utf8'),
  ]);

  assert.match(catalogSource, /onClickAdd\?: \(courseId: string, courseData: \{[\s\S]*departmentId\?: string/);
  assert.match(catalogSource, /data:\s*\{\s*containerId:\s*'catalog',\s*course,\s*departmentId,/);
  assert.match(catalogSource, /departmentId=\{activeDepartment\}/);
  assert.match(catalogSource, /<CustomCourseForm[\s\S]*departmentId=\{customCourseDepartment\}/);

  assert.match(formSource, /interface CustomCourseFormProps[\s\S]*departmentId\?: string;/);
  assert.doesNotMatch(formSource, /useSession|useGuestProfileStore/);
  assert.match(formSource, /department:\s*departmentId/);
  assert.match(formSource, /departmentId,/);
});

type QueryChain<T> = PromiseLike<T> & {
  select(): QueryChain<T>;
  populate(): QueryChain<T>;
  sort(): QueryChain<T>;
  limit(): QueryChain<T>;
  lean(): Promise<T>;
};

function queryChain<T>(value: T): QueryChain<T> {
  const chain = {
    select() {
      return chain;
    },
    populate() {
      return chain;
    },
    sort() {
      return chain;
    },
    limit() {
      return chain;
    },
    async lean() {
      return value;
    },
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      return Promise.resolve(value).then(onfulfilled, onrejected);
    },
  };
  return chain;
}

test('member custom-course lookup is scoped to the selected department', async (t) => {
  const [{ default: Course }, { default: DepartmentCurriculum }, { courseService }] =
    await Promise.all([
      import('../src/models/Course'),
      import('../src/models/DepartmentCurriculum'),
      import('../src/services/course.service'),
    ]);
  const courseModel = Course as unknown as {
    find(filter: unknown): QueryChain<unknown[]>;
  };
  const curriculumModel = DepartmentCurriculum as unknown as {
    find(filter: unknown): QueryChain<unknown[]>;
  };
  const courseFilters: unknown[] = [];

  t.mock.method(curriculumModel, 'find', () => queryChain([]));
  t.mock.method(courseModel, 'find', (filter: unknown) => {
    courseFilters.push(filter);
    return queryChain([]);
  });

  await courseService.findAll({
    departmentId: secondaryDepartmentId,
    curriculumYear: 2026,
    userId: '64d000000000000000000003',
  });

  const customFilter = courseFilters[1] as { $and: Array<Record<string, unknown>> };
  assert.ok(customFilter.$and.some((condition) =>
    condition.department === secondaryDepartmentId
  ));
});

test('guest custom-course merge is scoped to the effective department', async () => {
  const source = await readFile(
    resolve(process.cwd(), 'src/hooks/useCourses.ts'),
    'utf8'
  );

  assert.match(source, /course\.department === effectiveFilter\.departmentId/);
  assert.match(source, /effectiveFilter\?\.common[\s\S]*!course\.department/);
});
