import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import mongoose from 'mongoose';

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/course-planner-test';
process.env.NEXTAUTH_SECRET ||= 'test-nextauth-secret';
process.env.GOOGLE_CLIENT_ID ||= 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET ||= 'test-google-client-secret';

type FakeCourse = {
  _id: mongoose.Types.ObjectId;
  category: 'major_elective';
  createdBy: mongoose.Types.ObjectId | null;
};

type CourseAccessFilter = {
  _id?: string;
  createdBy?: string;
  $or?: Array<{ createdBy: string | null }>;
};

type CourseCleanupFilter = {
  _id: { $in: string[] };
  createdBy: string | { $ne: null };
};

type FakeQuery<T> = PromiseLike<T> & {
  lean(): Promise<T>;
  populate(): FakeQuery<T>;
  select(): FakeQuery<T>;
};

type FakePlan = {
  semesters: Array<{
    year: number;
    term: 'spring' | 'fall';
    courses: Array<{
      course: mongoose.Types.ObjectId;
      status: 'planned';
      category?: 'major_elective';
    }>;
  }>;
  save(): Promise<FakePlan>;
  populate(): Promise<FakePlan>;
};

const actorId = '64b000000000000000000001';
const otherUserId = '64b000000000000000000002';
const courseId = '64b000000000000000000003';
const planId = '64b000000000000000000004';
const ownCourseId = '64b000000000000000000005';
const officialCourseId = '64b000000000000000000006';

(globalThis as typeof globalThis & {
  mongooseCache?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}).mongooseCache = { conn: mongoose, promise: null };

function createPlan(courseIds: string[] = []): FakePlan {
  return {
    semesters: [{
      year: 1,
      term: 'spring',
      courses: courseIds.map((id) => ({
        course: new mongoose.Types.ObjectId(id),
        status: 'planned',
        category: 'major_elective',
      })),
    }],
    async save() {
      return this;
    },
    async populate() {
      return this;
    },
  };
}

function createQuery<T>(value: T): FakeQuery<T> {
  const query = {
    async lean() {
      return value;
    },
    populate() {
      return query;
    },
    select() {
      return query;
    },
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) {
      return Promise.resolve(value).then(onfulfilled, onrejected);
    },
  };

  return query;
}

function matchesCourseAccessFilter(
  course: FakeCourse,
  filter: CourseAccessFilter
): boolean {
  if (filter._id && course._id.toString() !== filter._id) return false;
  if (!filter.$or) return true;

  return filter.$or.some(({ createdBy }) =>
    createdBy === null
      ? course.createdBy === null
      : course.createdBy?.toString() === createdBy
  );
}

test('rejects adding another user\'s custom course', async (t) => {
  const [{ default: Course }, { default: Plan }, { planService }] =
    await Promise.all([
      import('../src/models/Course'),
      import('../src/models/Plan'),
      import('../src/services/plan.service'),
    ]);
  const courseModel = Course as unknown as {
    findById(id: string): Promise<FakeCourse | null>;
    findOne(filter: CourseAccessFilter): Promise<FakeCourse | null>;
  };
  const planModel = Plan as unknown as {
    findById(id: string): Promise<FakePlan | null>;
  };
  const plan = createPlan();
  const otherUsersCourse: FakeCourse = {
    _id: new mongoose.Types.ObjectId(courseId),
    category: 'major_elective',
    createdBy: new mongoose.Types.ObjectId(otherUserId),
  };

  t.mock.method(courseModel, 'findById', async () => otherUsersCourse);
  t.mock.method(courseModel, 'findOne', async (filter: CourseAccessFilter) =>
    matchesCourseAccessFilter(otherUsersCourse, filter)
      ? otherUsersCourse
      : null
  );
  t.mock.method(planModel, 'findById', async () => plan);

  await assert.rejects(
    planService.addCourseToSemester({
      planId,
      year: 1,
      term: 'spring',
      courseId,
      actorId,
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message.includes(otherUserId), false);
      return true;
    }
  );

  assert.equal(plan.semesters[0].courses.length, 0);
});

test('allows adding an official course', async (t) => {
  const [{ default: Course }, { default: Plan }, { default: DepartmentCurriculum }, { planService }] =
    await Promise.all([
      import('../src/models/Course'),
      import('../src/models/Plan'),
      import('../src/models/DepartmentCurriculum'),
      import('../src/services/plan.service'),
    ]);
  const courseModel = Course as unknown as {
    findById(id: string): Promise<FakeCourse | null>;
    findOne(filter: CourseAccessFilter): Promise<FakeCourse | null>;
  };
  const planModel = Plan as unknown as {
    findById(id: string): Promise<FakePlan | null>;
  };
  const curriculumModel = DepartmentCurriculum as unknown as {
    findOne(filter: unknown): FakeQuery<null>;
  };
  const plan = createPlan();
  const officialCourse: FakeCourse = {
    _id: new mongoose.Types.ObjectId(officialCourseId),
    category: 'major_elective',
    createdBy: null,
  };

  t.mock.method(courseModel, 'findById', async () => officialCourse);
  t.mock.method(courseModel, 'findOne', async (filter: CourseAccessFilter) =>
    matchesCourseAccessFilter(officialCourse, filter) ? officialCourse : null
  );
  t.mock.method(planModel, 'findById', async () => plan);
  t.mock.method(curriculumModel, 'findOne', () => createQuery(null));

  await planService.addCourseToSemester({
    planId,
    year: 1,
    term: 'spring',
    courseId: officialCourseId,
    actorId,
  });

  assert.equal(
    plan.semesters[0].courses[0]?.course.toString(),
    officialCourseId
  );
});

test('allows adding a custom course created by the actor', async (t) => {
  const [{ default: Course }, { default: Plan }, { planService }] =
    await Promise.all([
      import('../src/models/Course'),
      import('../src/models/Plan'),
      import('../src/services/plan.service'),
    ]);
  const courseModel = Course as unknown as {
    findById(id: string): Promise<FakeCourse | null>;
    findOne(filter: CourseAccessFilter): Promise<FakeCourse | null>;
  };
  const planModel = Plan as unknown as {
    findById(id: string): Promise<FakePlan | null>;
  };
  const plan = createPlan();
  const actorsCourse: FakeCourse = {
    _id: new mongoose.Types.ObjectId(ownCourseId),
    category: 'major_elective',
    createdBy: new mongoose.Types.ObjectId(actorId),
  };

  t.mock.method(courseModel, 'findById', async () => actorsCourse);
  t.mock.method(courseModel, 'findOne', async (filter: CourseAccessFilter) =>
    matchesCourseAccessFilter(actorsCourse, filter) ? actorsCourse : null
  );
  t.mock.method(planModel, 'findById', async () => plan);

  await planService.addCourseToSemester({
    planId,
    year: 1,
    term: 'spring',
    courseId: ownCourseId,
    actorId,
  });

  assert.equal(
    plan.semesters[0].courses[0]?.course.toString(),
    ownCourseId
  );
});

test('does not delete another user\'s custom course when removing a stale plan reference', async (t) => {
  const [{ default: Course }, { default: Plan }, { planService }] =
    await Promise.all([
      import('../src/models/Course'),
      import('../src/models/Plan'),
      import('../src/services/plan.service'),
    ]);
  const courseModel = Course as unknown as {
    findById(id: string): FakeQuery<FakeCourse | null>;
    deleteOne(filter: CourseAccessFilter): Promise<{ deletedCount: number }>;
  };
  const planModel = Plan as unknown as {
    findById(id: string): FakeQuery<FakePlan | null>;
  };
  const plan = createPlan([courseId]);
  const otherUsersCourse: FakeCourse = {
    _id: new mongoose.Types.ObjectId(courseId),
    category: 'major_elective',
    createdBy: new mongoose.Types.ObjectId(otherUserId),
  };
  const courses = new Map([[courseId, otherUsersCourse]]);

  t.mock.method(planModel, 'findById', () => createQuery(plan));
  t.mock.method(courseModel, 'findById', (id: string) =>
    createQuery(courses.get(id) ?? null)
  );
  t.mock.method(courseModel, 'deleteOne', async (filter: CourseAccessFilter) => {
    const course = filter._id ? courses.get(filter._id) : undefined;
    const ownsCourse = !filter.createdBy ||
      course?.createdBy?.toString() === filter.createdBy;
    if (course && ownsCourse) {
      courses.delete(course._id.toString());
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  });

  await planService.removeCourseFromSemester(
    planId,
    1,
    'spring',
    courseId,
    actorId
  );

  assert.equal(plan.semesters[0].courses.length, 0);
  assert.equal(courses.has(courseId), true);
});

test('deletes the actor\'s custom course when removing it from a semester', async (t) => {
  const [{ default: Course }, { default: Plan }, { planService }] =
    await Promise.all([
      import('../src/models/Course'),
      import('../src/models/Plan'),
      import('../src/services/plan.service'),
    ]);
  const courseModel = Course as unknown as {
    findById(id: string): FakeQuery<FakeCourse | null>;
    deleteOne(filter: CourseAccessFilter): Promise<{ deletedCount: number }>;
  };
  const planModel = Plan as unknown as {
    findById(id: string): FakeQuery<FakePlan | null>;
  };
  const plan = createPlan([ownCourseId]);
  const actorsCourse: FakeCourse = {
    _id: new mongoose.Types.ObjectId(ownCourseId),
    category: 'major_elective',
    createdBy: new mongoose.Types.ObjectId(actorId),
  };
  const courses = new Map([[ownCourseId, actorsCourse]]);

  t.mock.method(planModel, 'findById', () => createQuery(plan));
  t.mock.method(courseModel, 'findById', (id: string) =>
    createQuery(courses.get(id) ?? null)
  );
  t.mock.method(courseModel, 'deleteOne', async (filter: CourseAccessFilter) => {
    const course = filter._id ? courses.get(filter._id) : undefined;
    const ownsCourse = !filter.createdBy ||
      course?.createdBy?.toString() === filter.createdBy;
    if (course && ownsCourse) {
      courses.delete(course._id.toString());
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  });

  await planService.removeCourseFromSemester(
    planId,
    1,
    'spring',
    ownCourseId,
    actorId
  );

  assert.equal(plan.semesters[0].courses.length, 0);
  assert.equal(courses.has(ownCourseId), false);
});

test('does not delete an official course when removing it from a semester', async (t) => {
  const [{ default: Course }, { default: Plan }, { planService }] =
    await Promise.all([
      import('../src/models/Course'),
      import('../src/models/Plan'),
      import('../src/services/plan.service'),
    ]);
  const courseModel = Course as unknown as {
    findById(id: string): FakeQuery<FakeCourse | null>;
    deleteOne(filter: CourseAccessFilter): Promise<{ deletedCount: number }>;
  };
  const planModel = Plan as unknown as {
    findById(id: string): FakeQuery<FakePlan | null>;
  };
  const plan = createPlan([officialCourseId]);
  const officialCourse: FakeCourse = {
    _id: new mongoose.Types.ObjectId(officialCourseId),
    category: 'major_elective',
    createdBy: null,
  };
  const courses = new Map([[officialCourseId, officialCourse]]);

  t.mock.method(planModel, 'findById', () => createQuery(plan));
  t.mock.method(courseModel, 'findById', (id: string) =>
    createQuery(courses.get(id) ?? null)
  );
  t.mock.method(courseModel, 'deleteOne', async (filter: CourseAccessFilter) => {
    const course = filter._id ? courses.get(filter._id) : undefined;
    const ownsCourse = !filter.createdBy ||
      course?.createdBy?.toString() === filter.createdBy;
    if (course && ownsCourse) {
      courses.delete(course._id.toString());
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  });

  await planService.removeCourseFromSemester(
    planId,
    1,
    'spring',
    officialCourseId,
    actorId
  );

  assert.equal(plan.semesters[0].courses.length, 0);
  assert.equal(courses.has(officialCourseId), true);
});

test('courses route passes the authenticated user id to course mutations', async () => {
  const source = await readFile(resolve(
    process.cwd(),
    'src/app/api/plans/[id]/courses/route.ts'
  ), 'utf8');

  assert.match(
    source,
    /addCourseToSemester\(\{\s*planId,\s*actorId:\s*session\.user\.id,/
  );
  assert.match(
    source,
    /removeCourseFromSemester\(\s*planId,\s*year,\s*term,\s*courseId,\s*session\.user\.id\s*\)/
  );
});

test('semesters route passes the authenticated user id to cleanup mutations', async () => {
  const source = await readFile(resolve(
    process.cwd(),
    'src/app/api/plans/[id]/semesters/route.ts'
  ), 'utf8');

  assert.match(
    source,
    /removeSemester\(\s*planId,\s*year,\s*term,\s*session\.user\.id\s*\)/
  );
  assert.match(
    source,
    /clearSemester\(\s*planId,\s*year,\s*term,\s*session\.user\.id\s*\)/
  );
});

test('plan route passes the authenticated user id to reset', async () => {
  const source = await readFile(resolve(
    process.cwd(),
    'src/app/api/plans/[id]/route.ts'
  ), 'utf8');

  assert.match(source, /resetPlan\(id,\s*session\.user\.id\)/);
});

test('semester deletion removes only custom courses created by the actor', async (t) => {
  const [{ default: Course }, { default: Plan }, { planService }] =
    await Promise.all([
      import('../src/models/Course'),
      import('../src/models/Plan'),
      import('../src/services/plan.service'),
    ]);
  const courseModel = Course as unknown as {
    deleteMany(filter: CourseCleanupFilter): Promise<{ deletedCount: number }>;
  };
  const planModel = Plan as unknown as {
    findById(id: string): FakeQuery<FakePlan | null>;
  };
  const plan = createPlan([ownCourseId, courseId, officialCourseId]);
  const courses = new Map<string, FakeCourse>([
    [ownCourseId, {
      _id: new mongoose.Types.ObjectId(ownCourseId),
      category: 'major_elective',
      createdBy: new mongoose.Types.ObjectId(actorId),
    }],
    [courseId, {
      _id: new mongoose.Types.ObjectId(courseId),
      category: 'major_elective',
      createdBy: new mongoose.Types.ObjectId(otherUserId),
    }],
    [officialCourseId, {
      _id: new mongoose.Types.ObjectId(officialCourseId),
      category: 'major_elective',
      createdBy: null,
    }],
  ]);

  t.mock.method(planModel, 'findById', () => createQuery(plan));
  t.mock.method(courseModel, 'deleteMany', async (filter: CourseCleanupFilter) => {
    let deletedCount = 0;
    for (const id of filter._id.$in) {
      const course = courses.get(id);
      const matchesOwner = typeof filter.createdBy === 'string'
        ? course?.createdBy?.toString() === filter.createdBy
        : course?.createdBy !== null;
      if (course && matchesOwner) {
        courses.delete(id);
        deletedCount += 1;
      }
    }
    return { deletedCount };
  });

  await planService.removeSemester(planId, 1, 'spring', actorId);

  assert.equal(plan.semesters.length, 0);
  assert.equal(courses.has(ownCourseId), false);
  assert.equal(courses.has(courseId), true);
  assert.equal(courses.has(officialCourseId), true);
});

test('semester clearing removes only custom courses created by the actor', async (t) => {
  const [{ default: Course }, { default: Plan }, { planService }] =
    await Promise.all([
      import('../src/models/Course'),
      import('../src/models/Plan'),
      import('../src/services/plan.service'),
    ]);
  const courseModel = Course as unknown as {
    deleteMany(filter: CourseCleanupFilter): Promise<{ deletedCount: number }>;
  };
  const planModel = Plan as unknown as {
    findById(id: string): FakeQuery<FakePlan | null>;
  };
  const plan = createPlan([ownCourseId, courseId, officialCourseId]);
  const courses = new Map<string, FakeCourse>([
    [ownCourseId, {
      _id: new mongoose.Types.ObjectId(ownCourseId),
      category: 'major_elective',
      createdBy: new mongoose.Types.ObjectId(actorId),
    }],
    [courseId, {
      _id: new mongoose.Types.ObjectId(courseId),
      category: 'major_elective',
      createdBy: new mongoose.Types.ObjectId(otherUserId),
    }],
    [officialCourseId, {
      _id: new mongoose.Types.ObjectId(officialCourseId),
      category: 'major_elective',
      createdBy: null,
    }],
  ]);

  t.mock.method(planModel, 'findById', () => createQuery(plan));
  t.mock.method(courseModel, 'deleteMany', async (filter: CourseCleanupFilter) => {
    let deletedCount = 0;
    for (const id of filter._id.$in) {
      const course = courses.get(id);
      const matchesOwner = typeof filter.createdBy === 'string'
        ? course?.createdBy?.toString() === filter.createdBy
        : course?.createdBy !== null;
      if (course && matchesOwner) {
        courses.delete(id);
        deletedCount += 1;
      }
    }
    return { deletedCount };
  });

  await planService.clearSemester(planId, 1, 'spring', actorId);

  assert.equal(plan.semesters.length, 1);
  assert.equal(plan.semesters[0].courses.length, 0);
  assert.equal(courses.has(ownCourseId), false);
  assert.equal(courses.has(courseId), true);
  assert.equal(courses.has(officialCourseId), true);
});

test('plan reset removes only custom courses created by the actor', async (t) => {
  const [{ default: Course }, { default: Plan }, { planService }] =
    await Promise.all([
      import('../src/models/Course'),
      import('../src/models/Plan'),
      import('../src/services/plan.service'),
    ]);
  const courseModel = Course as unknown as {
    deleteMany(filter: CourseCleanupFilter): Promise<{ deletedCount: number }>;
  };
  const planModel = Plan as unknown as {
    findById(id: string): FakeQuery<FakePlan | null>;
  };
  const plan = createPlan([ownCourseId, courseId, officialCourseId]);
  const courses = new Map<string, FakeCourse>([
    [ownCourseId, {
      _id: new mongoose.Types.ObjectId(ownCourseId),
      category: 'major_elective',
      createdBy: new mongoose.Types.ObjectId(actorId),
    }],
    [courseId, {
      _id: new mongoose.Types.ObjectId(courseId),
      category: 'major_elective',
      createdBy: new mongoose.Types.ObjectId(otherUserId),
    }],
    [officialCourseId, {
      _id: new mongoose.Types.ObjectId(officialCourseId),
      category: 'major_elective',
      createdBy: null,
    }],
  ]);

  t.mock.method(planModel, 'findById', () => createQuery(plan));
  t.mock.method(courseModel, 'deleteMany', async (filter: CourseCleanupFilter) => {
    let deletedCount = 0;
    for (const id of filter._id.$in) {
      const course = courses.get(id);
      const matchesOwner = typeof filter.createdBy === 'string'
        ? course?.createdBy?.toString() === filter.createdBy
        : course?.createdBy !== null;
      if (course && matchesOwner) {
        courses.delete(id);
        deletedCount += 1;
      }
    }
    return { deletedCount };
  });

  await planService.resetPlan(planId, actorId);

  assert.equal(plan.semesters.length, 0);
  assert.equal(courses.has(ownCourseId), false);
  assert.equal(courses.has(courseId), true);
  assert.equal(courses.has(officialCourseId), true);
});
