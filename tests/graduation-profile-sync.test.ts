import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/course-planner-test';
process.env.NEXTAUTH_SECRET ||= 'test-nextauth-secret';
process.env.GOOGLE_CLIENT_ID ||= 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET ||= 'test-google-client-secret';
(globalThis as typeof globalThis & { mongooseCache?: unknown }).mongooseCache = { conn: mongoose, promise: null };

const id = '64c000000000000000000001';
const scm = '64c000000000000000000002';
const bus = '64c000000000000000000003';
const tables = {
  SCM: { college: '공과대학', departmentName: 'SCM', totalCredits: 120, generalCredits: 30,
    single: { majorCredits: 63, majorRequiredMin: 24 }, double: { majorCredits: 39, majorRequiredMin: 24 },
    minor: { majorCredits: 21, majorRequiredMin: 12, primaryMajorMin: 39 } },
  BUS: { college: '경영대학', departmentName: 'BUS', totalCredits: 120, generalCredits: 30,
    single: { majorCredits: 63, majorRequiredMin: 24 }, double: { majorCredits: 42, majorRequiredMin: 24 },
    minor: { majorCredits: 21, majorRequiredMin: 12, primaryMajorMin: 39 } },
};
const query = <T>(value: T) => ({ select: () => ({ lean: async () => value }), lean: async () => value });

test('track defaults use SCM 39 and BUS 42 and preserve the legacy response keys', async (t) => {
  const { default: DepartmentRequirement } = await import('../src/models/DepartmentRequirement');
  const { departmentRequirementService: service } = await import('../src/services/departmentRequirement.service');
  t.mock.method(DepartmentRequirement, 'findOne', (filter: { departmentName: 'SCM' | 'BUS' }) => query(tables[filter.departmentName]));
  const primary = await service.getPrimaryRequirements('공과대학', 'SCM', 2025, 'double');
  const secondary = await service.getSecondaryRequirements('경영대학', 'BUS', 'double', 2025);
  assert.deepEqual(primary, { totalCredits: 120, generalCredits: 30, primaryMajorCredits: 39, primaryMajorRequiredMin: 24 });
  assert.deepEqual(secondary, { secondaryMajorCredits: 42, secondaryMajorRequiredMin: 24 });
  assert.ok(primary!.primaryMajorCredits! + secondary!.secondaryMajorCredits! + primary!.generalCredits! <= primary!.totalCredits);
  assert.equal((await service.getPrimaryRequirements('공과대학', 'SCM', 2025))!.primaryMajorCredits, 63);
  // 부전공을 둔 학생의 주전공 기준은 minor.primaryMajorMin("부전공 시 주전공 최소")이며 핵심은 single 기준을 따른다.
  assert.deepEqual(await service.getPrimaryRequirements('공과대학', 'SCM', 2025, 'minor'), { totalCredits: 120, generalCredits: 30, primaryMajorCredits: 39, primaryMajorRequiredMin: 24 });
  assert.equal((await service.getSecondaryRequirements('경영대학', 'BUS', 'minor', 2025))!.minorCredits, 21);
});

test('profile sync changes default tracks, preserves manual thresholds and earned credits', async (t) => {
  const [{ default: GraduationRequirement }, { departmentRequirementService: departments }, { graduationRequirementService: service }] = await Promise.all([
    import('../src/models/GraduationRequirement'), import('../src/services/departmentRequirement.service'), import('../src/services/graduationRequirement.service'),
  ]);
  const stored = { majorType: 'single', primaryMajorCredits: 63, primaryMajorRequiredMin: 24, earnedPrimaryMajorCredits: 5, totalCredits: 123 };
  let patch: Record<string, unknown> = {};
  t.mock.method(GraduationRequirement, 'findOne', () => query(stored));
  t.mock.method(GraduationRequirement, 'updateOne', async (_filter: unknown, update: { $set: Record<string, unknown> }) => { patch = update.$set; });
  t.mock.method(departments, 'getAutoFill', async (input: { track?: string; majorType: string }) => input.track === 'secondary'
    ? { secondaryMajorCredits: 42, secondaryMajorRequiredMin: 24 }
    : { primaryMajorCredits: input.majorType === 'double' ? 39 : 63, primaryMajorRequiredMin: 24 });
  await service.syncProfile(id, { majorType: 'single' }, { majorType: 'double', department: scm, secondaryDepartment: bus });
  assert.deepEqual(patch, { majorType: 'double', primaryMajorCredits: 39, primaryMajorRequiredMin: 24, secondaryMajorCredits: 42, secondaryMajorRequiredMin: 24 });
  stored.primaryMajorCredits = 40;
  await service.syncProfile(id, { majorType: 'single' }, { majorType: 'double', department: scm, secondaryDepartment: bus });
  assert.equal(patch.primaryMajorCredits, undefined);
  assert.equal(Object.hasOwn(patch, 'totalCredits'), false);
  assert.equal(Object.hasOwn(patch, 'earnedPrimaryMajorCredits'), false);
});

test('planned course schema retains selected department and accepts legacy documents', async () => {
  const { default: Plan } = await import('../src/models/Plan');
  for (const departmentId of [scm, undefined]) {
    const plan = new Plan({ user: id, semesters: [{ year: 1, term: 'spring', courses: [{ course: bus, category: 'major_required', departmentId }] }] });
    assert.equal(plan.validateSync(), undefined);
    assert.equal(plan.toObject().semesters[0].courses[0].departmentId?.toString(), departmentId);
  }
});

test('course limit is an identifiable input error and does not save a plan', async (t) => {
  const [{ default: Course }, { default: Plan }, { planService, PlanInputError }] = await Promise.all([
    import('../src/models/Course'), import('../src/models/Plan'), import('../src/services/plan.service'),
  ]);
  let saved = false;
  t.mock.method(Course, 'findOne', async () => ({ _id: bus }));
  t.mock.method(Plan, 'findById', async () => ({ semesters: [{ year: 1, term: 'spring', courses: Array.from({ length: 10 }, (_, i) => ({ course: `course-${i}` })) }], save: async () => { saved = true; } }));
  await assert.rejects(planService.addCourseToSemester({ planId: id, actorId: id, courseId: bus, year: 1, term: 'spring', departmentId: scm }), (error: unknown) => error instanceof PlanInputError && error.message.includes('10개'));
  assert.equal(saved, false);
});

test('single-major profile update unsets the secondary department before syncing requirements', async (t) => {
  const [{ default: User }, { userService }, { graduationRequirementService }] = await Promise.all([
    import('../src/models/User'), import('../src/services/user.service'), import('../src/services/graduationRequirement.service'),
  ]);
  let update: { $set?: Record<string, unknown>; $unset?: Record<string, number> } = {};
  let synced = false;
  t.mock.method(User, 'findById', () => query({ majorType: 'double', secondaryDepartment: bus }));
  t.mock.method(User, 'findByIdAndUpdate', async (_id: string, patch: typeof update) => {
    update = patch;
    return { majorType: 'single', department: scm, populate: async () => ({ majorType: 'single' }) };
  });
  t.mock.method(graduationRequirementService, 'syncProfile', async () => { synced = true; });
  await userService.update(id, { majorType: 'single', secondaryDepartment: bus });
  assert.deepEqual(update.$unset, { secondaryDepartment: 1 });
  assert.equal(update.$set?.secondaryDepartment, undefined);
  assert.equal(synced, true);
});
