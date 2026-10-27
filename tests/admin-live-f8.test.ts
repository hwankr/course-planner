import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import { buildOfficialCoursePayload } from '../src/app/(dashboard)/admin/courses/courseForm';
import { createFormSession } from '../src/app/(dashboard)/admin/_components/useAdminMutation';

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/course-planner-test';
process.env.NEXTAUTH_SECRET ||= 'test-nextauth-secret';
process.env.GOOGLE_CLIENT_ID ||= 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET ||= 'test-google-client-secret';
globalThis.mongooseCache = { conn: mongoose, promise: null };
const owner = '64b000000000000000000001';
const other = '64b000000000000000000002';
const id = '64b000000000000000000003';
const department = '64b000000000000000000004';
function query<T>(value: T) {
  const q = { populate: () => q, select: () => q, sort: () => q, skip: () => q,
    limit: () => q, session: () => q, lean: async () => value,
    then: (resolve: (v: T) => unknown) => Promise.resolve(value).then(resolve) };
  return q;
}

test('custom course detail is hidden from anonymous and another owner, public official remains visible', async t => {
  const [{ courseService }, { Course }] = await Promise.all([import('../src/services/course.service'), import('../src/models')]);
  let creator: string | null | undefined = owner;
  const queries: Record<string, unknown>[] = [];
  t.mock.method(Course, 'findOne', (filter: { $or?: { createdBy: string | null }[] }) => {
    queries.push(filter);
    const visible = !filter.$or || filter.$or.some(rule => rule.createdBy === (creator ?? null));
    return query(visible ? { _id: id, createdBy: creator } : null);
  });
  assert.equal(await courseService.findById(id), null);
  assert.equal(await courseService.findById(id, { userId: other }), null);
  assert.ok(await courseService.findById(id, { userId: owner }));
  assert.ok(await courseService.findById(id, { userId: other, isAdmin: true }));
  creator = null;
  assert.ok(await courseService.findById(id));
  creator = undefined;
  assert.ok(await courseService.findById(id));
  assert.equal(queries.every(q => q._id === id), true);
});

test('curriculum category filters distinct official courses with stable page boundaries and metadata', async t => {
  const [{ courseService }, { Course, DepartmentCurriculum }] = await Promise.all([import('../src/services/course.service'), import('../src/models')]);
  let skip = -1;
  let limit = -1;
  t.mock.method(DepartmentCurriculum, 'find', (filter: Record<string, unknown>) => {
    assert.deepEqual(filter, { year: 2026, category: 'major_required' });
    return query([{ course: id, category: 'major_required', recommendedYear: 2, recommendedSemester: 'fall' },
      { course: id, category: 'major_required', recommendedYear: 3, recommendedSemester: 'spring' }]);
  });
  // Replace with a chain that records pagination without a database.
  t.mock.method(Course, 'find', (filter: Record<string, unknown>) => {
    assert.deepEqual(filter._id, { $in: [id] });
    assert.equal(filter.category, undefined);
    assert.equal(filter.createdBy, null);
    assert.equal(filter.isActive, true);
    const q = { populate: () => q, sort: () => q, skip: (n: number) => { skip = n; return q; }, limit: (n: number) => { limit = n; return q; }, lean: async () => [{ _id: id }] };
    return q;
  });
  t.mock.method(Course, 'countDocuments', async () => 1048);
  const result = await courseService.findPage({ page: 2, limit: 50, curriculumYear: 2026, category: 'major_required' });
  assert.deepEqual(result.pagination, { page: 2, limit: 50, total: 1048, totalPages: 21 });
  assert.equal(skip, 50); assert.equal(limit, 50);
  assert.equal(result.data[0].category, 'major_required');
  assert.equal(result.data[0].recommendedYear, 2);
});

const form = { code: ' audit01 ', name: ' Official ', credits: 3, department,
  category: 'major_required' as const, semesters: ['spring' as const], recommendedYear: '1',
  recommendedSemester: 'spring' as const, curriculumYear: 2026, description: ' Test ' };
test('official form payload requires curriculum and never includes a creator', () => {
  const payload = buildOfficialCoursePayload(form);
  assert.equal(payload.official, true); assert.equal(payload.code, 'AUDIT01');
  assert.equal(payload.curriculumYear, 2026); assert.equal(payload.category, 'major_required');
  assert.equal('createdBy' in payload, false);
  for (const missing of ['department', 'category', 'recommendedYear', 'code', 'name'] as const) {
    assert.throws(() => buildOfficialCoursePayload({ ...form, [missing]: '' }));
  }
  assert.throws(() => buildOfficialCoursePayload({ ...form, semesters: [] }));
});

test('official creation commits course and curriculum together, and rolls both back on curriculum failure', async t => {
  const [{ courseService }, { Course, Department, DepartmentCurriculum }] = await Promise.all([import('../src/services/course.service'), import('../src/models')]);
  const records: unknown[] = [];
  let fail = false, ended = 0;
  const session = { withTransaction: async (fn: () => Promise<unknown>) => {
    const length = records.length;
    try { return await fn(); } catch (error) { records.splice(length); throw error; }
  }, endSession: async () => { ended++; } };
  t.mock.method(mongoose, 'startSession', async () => session);
  t.mock.method(Department, 'exists', () => query({ _id: department }));
  t.mock.method(Course, 'findOne', () => query(null));
  t.mock.method(Course, 'create', async (docs: Record<string, unknown>[], options: { session: unknown }) => {
    assert.equal(options.session, session); assert.equal(docs[0].createdBy, undefined);
    records.push(docs[0]); return [{ _id: id, populate: async () => ({ _id: id, ...docs[0] }) }];
  });
  t.mock.method(DepartmentCurriculum, 'create', async (docs: Record<string, unknown>[], options: { session: unknown }) => {
    assert.equal(options.session, session);
    assert.deepEqual(docs[0], { department, course: id, year: 2026, category: 'major_required', recommendedYear: 1, recommendedSemester: 'spring' });
    if (fail) throw new Error('curriculum write failed');
    records.push(docs[0]); return docs;
  });
  await courseService.createOfficial(buildOfficialCoursePayload(form));
  assert.equal(records.length, 2);
  fail = true;
  await assert.rejects(courseService.createOfficial(buildOfficialCoursePayload(form)), /curriculum write failed/);
  assert.equal(records.length, 2); assert.equal(ended, 2);
});

test('feedback reads are side effect free and explicit read updates only unread targets', async t => {
  const [{ feedbackService }, { Feedback }] = await Promise.all([import('../src/services/feedback.service'), import('../src/models/Feedback')]);
  const updates: unknown[] = [];
  t.mock.method(Feedback, 'find', () => query([{ _id: id, isReadByAdmin: false }]));
  t.mock.method(Feedback, 'updateMany', async (filter: unknown) => { updates.push(filter); return { modifiedCount: 1 }; });
  assert.equal((await feedbackService.findAll())[0].isReadByAdmin, false);
  await feedbackService.findAllAndMarkRead();
  assert.equal(updates.length, 0);
  await feedbackService.markAsReadByAdmin([id]);
  await feedbackService.markAsReadByAdmin([]);
  await feedbackService.markAsReadByAdmin();
  assert.deepEqual(updates, [
    { isReadByAdmin: false, _id: { $in: [id] } },
    { isReadByAdmin: false, _id: { $in: [] } },
    { isReadByAdmin: false },
  ]);
});

test('completion from an older form instance cannot close a newly opened instance', () => {
  const session = createFormSession();
  session.begin(); const firstRequest = session.capture();
  assert.equal(session.isCurrent(firstRequest), true);
  session.begin(); assert.equal(session.isCurrent(firstRequest), false);
  assert.equal(session.isCurrent(session.capture()), true);
});

test('all admin form and confirmation dialogs carry pending policy', async () => {
  const ts = await import('typescript');
  for (const page of ['courses', 'departments', 'requirements', 'patch-notes', 'users', 'feedback']) {
    const source = await readFile(`src/app/(dashboard)/admin/${page}/page.tsx`, 'utf8');
    const file = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let dialogs = 0;
    function visit(node: import('typescript').Node) {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && /^Admin(?:Confirm)?Dialog$/.test(node.tagName.getText(file))) {
        dialogs++;
        assert.ok(node.attributes.properties.some(prop => ts.isJsxAttribute(prop) && prop.name.getText(file) === 'pending'), page);
      }
      ts.forEachChild(node, visit);
    }
    visit(file); assert.ok(dialogs, page);
  }
});

test('admin writes expire cached public list and detail without replacing their data shapes', async () => {
  const { QueryClient } = await import('@tanstack/react-query');
  const { invalidateAdminData } = await import('../src/app/(dashboard)/admin/_components/adminCache');
  const client = new QueryClient();
  const keys = [['admin-patch-notes'], ['patch-notes'], ['patch-note', id], ['admin-departments'], ['departments'], ['courses', { departmentId: department }], ['admin-stats', 2026], ['statistics', department]];
  for (const key of keys) client.setQueryData(key, key[0] === 'admin-departments' ? { data: [] } : []);
  for (const resource of ['patch-notes', 'departments', 'courses'] as const) await invalidateAdminData(client, resource);
  for (const key of keys) assert.equal(client.getQueryState(key)?.isInvalidated, true, String(key));
  assert.deepEqual(client.getQueryData(['admin-departments']), { data: [] });
  assert.deepEqual(client.getQueryData(['departments']), []);
  client.clear();
});

test('user pagination uses count and offset while the legacy call still returns an array', async t => {
  const [{ userService }, { User }] = await Promise.all([import('../src/services/user.service'), import('../src/models')]);
  const offsets: number[] = [], limits: number[] = [];
  t.mock.method(User, 'find', () => {
    const q = { select: () => q, populate: () => q, sort: () => q,
      skip: (n: number) => { offsets.push(n); return q; },
      limit: (n: number) => { limits.push(n); return q; }, lean: async () => [] };
    return q;
  });
  t.mock.method(User, 'countDocuments', async () => 231);
  assert.deepEqual(await userService.findAllUsers(), []);
  const page = await userService.findAllUsers({ page: 3, limit: 50 });
  assert.deepEqual(page.pagination, { page: 3, limit: 50, total: 231, totalPages: 5 });
  assert.deepEqual(offsets, [0, 100]); assert.deepEqual(limits, [200, 50]);
});


test('a close handler from the previous render observes the synchronous mutation lock', () => {
  const session = createFormSession();
  const canClose = () => !session.isPending();
  assert.equal(canClose(), true);
  assert.equal(session.tryLock(), true);
  assert.equal(canClose(), false);
  assert.equal(session.tryLock(), false);
  session.unlock();
  assert.equal(canClose(), true);
  assert.equal(session.tryLock(), true);
});
