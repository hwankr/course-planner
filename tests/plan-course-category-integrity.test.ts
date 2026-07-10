import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/course-planner-test';
process.env.NEXTAUTH_SECRET ||= 'test-nextauth-secret';
process.env.GOOGLE_CLIENT_ID ||= 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET ||= 'test-google-client-secret';

type Category =
  | 'major_required'
  | 'major_compulsory'
  | 'major_elective'
  | 'general_required'
  | 'general_elective'
  | 'free_elective'
  | 'teaching';

type FakeCourse = {
  _id: mongoose.Types.ObjectId;
  category?: Category;
  createdBy: mongoose.Types.ObjectId | null;
  department?: mongoose.Types.ObjectId | null;
};

type FakeUser = {
  department?: mongoose.Types.ObjectId;
  secondaryDepartment?: mongoose.Types.ObjectId;
  majorType: 'single' | 'double' | 'minor';
  curriculumYear?: number;
};

type FakePlan = {
  semesters: Array<{
    year: number;
    term: 'spring' | 'fall';
    courses: Array<{
      course: mongoose.Types.ObjectId;
      status: 'planned';
      category?: Category;
    }>;
  }>;
  save(): Promise<FakePlan>;
  populate(): Promise<FakePlan>;
};

type SelectLeanQuery<T> = {
  select(): {
    lean(): Promise<T>;
  };
};

const actorId = '64c000000000000000000001';
const primaryDepartmentId = '64c000000000000000000002';
const secondaryDepartmentId = '64c000000000000000000003';
const unrelatedDepartmentId = '64c000000000000000000004';
const officialCourseId = '64c000000000000000000005';
const customCourseId = '64c000000000000000000006';
const planId = '64c000000000000000000007';

(globalThis as typeof globalThis & {
  mongooseCache?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}).mongooseCache = { conn: mongoose, promise: null };

function createPlan(): FakePlan {
  return {
    semesters: [{ year: 1, term: 'spring', courses: [] }],
    async save() {
      return this;
    },
    async populate() {
      return this;
    },
  };
}

function selectLean<T>(value: T): SelectLeanQuery<T> {
  return {
    select() {
      return {
        async lean() {
          return value;
        },
      };
    },
  };
}

function addInput(overrides: Record<string, unknown> = {}) {
  return {
    planId,
    actorId,
    year: 1,
    term: 'spring',
    courseId: officialCourseId,
    departmentId: secondaryDepartmentId,
    ...overrides,
  };
}

async function loadModelsAndService() {
  const [{ default: Course }, { default: Plan }, { default: User }, { default: DepartmentCurriculum }, { planService }] =
    await Promise.all([
      import('../src/models/Course'),
      import('../src/models/Plan'),
      import('../src/models/User'),
      import('../src/models/DepartmentCurriculum'),
      import('../src/services/plan.service'),
    ]);

  return {
    courseModel: Course as unknown as {
      findOne(filter: unknown): Promise<FakeCourse | null>;
    },
    planModel: Plan as unknown as {
      findById(id: string): Promise<FakePlan | null>;
    },
    userModel: User as unknown as {
      findById(id: string): SelectLeanQuery<FakeUser | null>;
    },
    curriculumModel: DepartmentCurriculum as unknown as {
      findOne(filter: unknown): SelectLeanQuery<{ category: Category } | null>;
    },
    planService,
  };
}

test('stores the selected department curriculum category instead of a forged client category', async (t) => {
  const { courseModel, planModel, userModel, curriculumModel, planService } =
    await loadModelsAndService();
  const plan = createPlan();
  const officialCourse: FakeCourse = {
    _id: new mongoose.Types.ObjectId(officialCourseId),
    category: 'major_elective',
    createdBy: null,
  };
  let curriculumFilter: unknown;

  t.mock.method(courseModel, 'findOne', async () => officialCourse);
  t.mock.method(planModel, 'findById', async () => plan);
  t.mock.method(userModel, 'findById', () => selectLean({
    department: new mongoose.Types.ObjectId(primaryDepartmentId),
    secondaryDepartment: new mongoose.Types.ObjectId(secondaryDepartmentId),
    majorType: 'double',
    curriculumYear: 2026,
  }));
  t.mock.method(curriculumModel, 'findOne', (filter: unknown) => {
    curriculumFilter = filter;
    return selectLean({ category: 'major_required' });
  });

  await planService.addCourseToSemester(addInput({
    category: 'free_elective',
    curriculumYear: 2025,
  }) as never);

  assert.equal(plan.semesters[0].courses[0]?.category, 'major_required');
  assert.deepEqual(curriculumFilter, {
    course: officialCourseId,
    department: secondaryDepartmentId,
    year: 2026,
  });
});

test('rejects a curriculum department outside the actor primary and secondary departments', async (t) => {
  const { courseModel, planModel, userModel, curriculumModel, planService } =
    await loadModelsAndService();
  const plan = createPlan();
  let curriculumQueried = false;

  t.mock.method(courseModel, 'findOne', async () => ({
    _id: new mongoose.Types.ObjectId(officialCourseId),
    category: 'major_elective',
    createdBy: null,
  }));
  t.mock.method(planModel, 'findById', async () => plan);
  t.mock.method(userModel, 'findById', () => selectLean({
    department: new mongoose.Types.ObjectId(primaryDepartmentId),
    secondaryDepartment: new mongoose.Types.ObjectId(secondaryDepartmentId),
    majorType: 'minor',
    curriculumYear: 2026,
  }));
  t.mock.method(curriculumModel, 'findOne', () => {
    curriculumQueried = true;
    return selectLean({ category: 'major_required' });
  });

  await assert.rejects(
    planService.addCourseToSemester(addInput({
      departmentId: unrelatedDepartmentId,
    }) as never),
    /선택할 수 없는 학과/
  );

  assert.equal(curriculumQueried, false);
  assert.equal(plan.semesters[0].courses.length, 0);
});

test('rejects an official curriculum course when department context is omitted', async (t) => {
  const { courseModel, planModel, userModel, curriculumModel, planService } =
    await loadModelsAndService();
  const plan = createPlan();
  let userQueried = false;

  t.mock.method(courseModel, 'findOne', async () => ({
    _id: new mongoose.Types.ObjectId(officialCourseId),
    category: 'major_elective',
    createdBy: null,
  }));
  t.mock.method(planModel, 'findById', async () => plan);
  t.mock.method(userModel, 'findById', () => {
    userQueried = true;
    return selectLean(null);
  });
  t.mock.method(curriculumModel, 'findOne', () =>
    selectLean({ category: 'major_required' })
  );

  await assert.rejects(
    planService.addCourseToSemester(addInput({
      departmentId: undefined,
      category: 'free_elective',
    }) as never),
    /학과 정보가 필요/
  );

  assert.equal(userQueried, false);
  assert.equal(plan.semesters[0].courses.length, 0);
});

test('uses the default curriculum year when the actor has no stored curriculum year', async (t) => {
  const { courseModel, planModel, userModel, curriculumModel, planService } =
    await loadModelsAndService();
  const plan = createPlan();
  let curriculumFilter: unknown;

  t.mock.method(courseModel, 'findOne', async () => ({
    _id: new mongoose.Types.ObjectId(officialCourseId),
    createdBy: null,
  }));
  t.mock.method(planModel, 'findById', async () => plan);
  t.mock.method(userModel, 'findById', () => selectLean({
    department: new mongoose.Types.ObjectId(primaryDepartmentId),
    majorType: 'single',
  }));
  t.mock.method(curriculumModel, 'findOne', (filter: unknown) => {
    curriculumFilter = filter;
    return selectLean({ category: 'major_elective' });
  });

  await planService.addCourseToSemester(addInput({
    departmentId: primaryDepartmentId,
  }) as never);

  assert.deepEqual(curriculumFilter, {
    course: officialCourseId,
    department: primaryDepartmentId,
    year: 2026,
  });
});

test('uses a custom course stored category instead of a forged client category', async (t) => {
  const { courseModel, planModel, userModel, curriculumModel, planService } =
    await loadModelsAndService();
  const plan = createPlan();

  t.mock.method(courseModel, 'findOne', async () => ({
    _id: new mongoose.Types.ObjectId(customCourseId),
    category: 'major_elective',
    createdBy: new mongoose.Types.ObjectId(actorId),
    department: new mongoose.Types.ObjectId(secondaryDepartmentId),
  }));
  t.mock.method(planModel, 'findById', async () => plan);
  t.mock.method(userModel, 'findById', () => selectLean({
    department: new mongoose.Types.ObjectId(primaryDepartmentId),
    secondaryDepartment: new mongoose.Types.ObjectId(secondaryDepartmentId),
    majorType: 'double',
    curriculumYear: 2026,
  }));
  t.mock.method(curriculumModel, 'findOne', () => selectLean(null));

  await planService.addCourseToSemester(addInput({
    courseId: customCourseId,
    category: 'free_elective',
  }) as never);

  assert.equal(plan.semesters[0].courses[0]?.category, 'major_elective');
});
