import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test, { type TestContext } from 'node:test';
import mongoose, { type ClientSession } from 'mongoose';

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

const targetAdminId = '64b000000000000000000001';
const otherAdminId = '64b000000000000000000002';

interface SessionDouble {
  withTransaction<T>(
    operation: () => Promise<T>,
    options?: Record<string, unknown>
  ): Promise<T>;
  endSession(): Promise<void>;
}

interface GuardModelDouble {
  updateOne(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<unknown>;
}

interface UserModelDouble {
  findById(id: string): unknown;
  exists(filter: Record<string, unknown>): unknown;
  findByIdAndUpdate(...args: unknown[]): unknown;
  findByIdAndDelete(...args: unknown[]): unknown;
}

interface CascadeServiceDouble {
  deleteAllByUser(userId: string, session?: ClientSession): Promise<number>;
}

interface CourseServiceDouble {
  deleteCustomByUser(userId: string, session?: ClientSession): Promise<number>;
}

interface GraduationRequirementServiceDouble {
  remove(userId: string, session?: ClientSession): Promise<unknown>;
}

interface PatchNoteServiceDouble {
  deleteAllReadsByUser(userId: string, session?: ClientSession): Promise<number>;
}

async function loadSecurityModules() {
  try {
    const [
      { default: User },
      { default: AdminSecurityState },
      { userService },
      { UserSecurityError },
      { planService },
      { courseService },
      { graduationRequirementService },
      { feedbackService },
      { patchNoteService },
    ] = await Promise.all([
      import('../src/models/User'),
      import('../src/models/AdminSecurityState'),
      import('../src/services/user.service'),
      import('../src/services/user-security.error'),
      import('../src/services/plan.service'),
      import('../src/services/course.service'),
      import('../src/services/graduationRequirement.service'),
      import('../src/services/feedback.service'),
      import('../src/services/patchNote.service'),
    ]);

    return {
      User: User as unknown as UserModelDouble,
      AdminSecurityState: AdminSecurityState as unknown as GuardModelDouble,
      userService,
      UserSecurityError,
      planService: planService as unknown as CascadeServiceDouble,
      courseService: courseService as unknown as CourseServiceDouble,
      graduationRequirementService:
        graduationRequirementService as unknown as GraduationRequirementServiceDouble,
      feedbackService: feedbackService as unknown as CascadeServiceDouble,
      patchNoteService: patchNoteService as unknown as PatchNoteServiceDouble,
    };
  } catch (error) {
    assert.fail(`administrator membership security modules are unavailable: ${String(error)}`);
  }
}

function installTransactionDouble(
  t: TestContext,
  guardModel: GuardModelDouble,
  events: string[]
): ClientSession {
  const session: SessionDouble = {
    async withTransaction<T>(
      operation: () => Promise<T>,
      options?: Record<string, unknown>
    ): Promise<T> {
      events.push('transaction:start');
      assert.deepEqual(options, {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });
      const value = await operation();
      events.push('transaction:end');
      return value;
    },
    async endSession(): Promise<void> {
      events.push('session:end');
    },
  };
  const clientSession = session as unknown as ClientSession;

  t.mock.method(mongoose, 'startSession', async () => clientSession);
  t.mock.method(
    guardModel,
    'updateOne',
    async (
      filter: Record<string, unknown>,
      update: Record<string, unknown>,
      options?: Record<string, unknown>
    ) => {
      assert.deepEqual(filter, { _id: 'admin-membership' });
      if (options?.session === clientSession) {
        events.push('guard:transaction');
        assert.deepEqual(update, { $inc: { revision: 1 } });
      } else {
        events.push('guard:ensure');
        assert.deepEqual(update, { $setOnInsert: { revision: 0 } });
        assert.equal(options?.upsert, true);
      }
      return { acknowledged: true };
    }
  );

  return clientSession;
}

function sessionLeanQuery<T>(
  value: T,
  expectedSession: ClientSession,
  onSession?: () => void
) {
  return {
    session(session: ClientSession) {
      assert.equal(session, expectedSession);
      onSession?.();
      return {
        async lean(): Promise<T> {
          return value;
        },
      };
    },
  };
}

function sessionResultQuery<T>(
  value: T,
  expectedSession: ClientSession,
  onSession?: () => void
) {
  return {
    session(session: ClientSession): Promise<T> {
      assert.equal(session, expectedSession);
      onSession?.();
      return Promise.resolve(value);
    },
  };
}

async function routeFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await routeFiles(path)));
    } else if (entry.name === 'route.ts') {
      files.push(path);
    }
  }
  return files;
}

test('guard model and typed security errors define the shared invariant contract', async () => {
  const [modelSource, errorSource, modelsIndex] = await Promise.all([
    readFile(resolve('src/models/AdminSecurityState.ts'), 'utf8'),
    readFile(resolve('src/services/user-security.error.ts'), 'utf8'),
    readFile(resolve('src/models/index.ts'), 'utf8'),
  ]);

  assert.match(modelSource, /collection:\s*'admin_security_state'/);
  assert.match(modelSource, /revision:[\s\S]*default:\s*0/);
  assert.match(modelsIndex, /AdminSecurityState/);
  assert.match(errorSource, /export class UserSecurityError extends Error/);
  assert.match(errorSource, /'LAST_ADMIN'\s*\|\s*'SELF_DELETE'\s*\|\s*'USER_NOT_FOUND'/);
});

test('all administrator-decreasing mutations serialize on one guard write', async () => {
  const source = await readFile(resolve('src/services/user.service.ts'), 'utf8');
  assert.match(source, /AdminSecurityState\.updateOne\([\s\S]*\$inc:\s*\{\s*revision:\s*1/);
  assert.match(source, /withTransaction/);
  assert.match(source, /role:\s*'admin'/);
  assert.match(source, /\$ne:\s*targetUserId/);
  assert.doesNotMatch(source, /countDocuments\(\{\s*role:\s*'admin'/);

  const transactionBodyStart = source.indexOf('await session.withTransaction');
  const guardWrite = source.indexOf('await AdminSecurityState.updateOne', transactionBodyStart);
  const anotherAdminPredicate = source.indexOf('await User.exists', guardWrite);
  assert.ok(transactionBodyStart >= 0, 'transaction callback must exist');
  assert.ok(guardWrite > transactionBodyStart, 'guard increment must be inside the transaction');
  assert.ok(
    anotherAdminPredicate > guardWrite,
    'the shared guard write must happen before the administrator-count predicate'
  );

  assert.equal(
    source.match(/withAdminMembershipTransaction\(/g)?.length,
    3,
    'all three public membership mutations must use one transaction wrapper'
  );
});

test('cascade deletion services accept and pass through one optional MongoDB session', async () => {
  const serviceContracts = [
    {
      file: 'src/services/plan.service.ts',
      signature: /deleteAllByUser\(userId:\s*string,\s*session\?:\s*ClientSession\)/,
      mutation: /Plan\.deleteMany\(\{\s*user:\s*userId\s*\},\s*\{\s*session\s*\}\)/,
    },
    {
      file: 'src/services/course.service.ts',
      signature: /deleteCustomByUser\(userId:\s*string,\s*session\?:\s*ClientSession\)/,
      mutation: /Course\.deleteMany\(\{\s*createdBy:\s*userId\s*\},\s*\{\s*session\s*\}\)/,
    },
    {
      file: 'src/services/graduationRequirement.service.ts',
      signature: /remove\(\s*userId:\s*string,\s*session\?:\s*ClientSession\s*\)/,
      mutation:
        /GraduationRequirement\.findOneAndDelete\(\{\s*user:\s*userId\s*\},\s*\{\s*session\s*\}\)/,
    },
    {
      file: 'src/services/feedback.service.ts',
      signature: /deleteAllByUser\(userId:\s*string,\s*session\?:\s*ClientSession\)/,
      mutation: /Feedback\.deleteMany\(\{\s*userId\s*\},\s*\{\s*session\s*\}\)/,
    },
    {
      file: 'src/services/patchNote.service.ts',
      signature: /deleteAllReadsByUser\(userId:\s*string,\s*session\?:\s*ClientSession\)/,
      mutation: /PatchNoteRead\.deleteMany\(\{\s*userId\s*\},\s*\{\s*session\s*\}\)/,
    },
  ] as const;

  for (const contract of serviceContracts) {
    const source = await readFile(resolve(contract.file), 'utf8');
    assert.match(source, /ClientSession/, `${contract.file} must import ClientSession`);
    assert.match(source, contract.signature, `${contract.file} must accept a session`);
    assert.match(source, contract.mutation, `${contract.file} must pass the session to Mongoose`);
  }
});

test('demoting the final administrator rejects with LAST_ADMIN after taking the guard', async (t) => {
  const { User, AdminSecurityState, userService, UserSecurityError } =
    await loadSecurityModules();
  const events: string[] = [];
  const session = installTransactionDouble(t, AdminSecurityState, events);

  t.mock.method(User, 'findById', () =>
    sessionLeanQuery(
      { _id: targetAdminId, role: 'admin' },
      session,
      () => events.push('target:read')
    )
  );
  t.mock.method(User, 'exists', (filter: Record<string, unknown>) => {
    events.push('another-admin:read');
    assert.deepEqual(filter, {
      _id: { $ne: targetAdminId },
      role: 'admin',
    });
    return sessionResultQuery(null, session);
  });
  t.mock.method(User, 'findByIdAndUpdate', () => {
    assert.fail('the final administrator must not be updated');
  });

  await assert.rejects(
    userService.updateRole(targetAdminId, 'student'),
    (error: unknown) =>
      error instanceof UserSecurityError && error.code === 'LAST_ADMIN'
  );
  assert.ok(events.indexOf('guard:transaction') < events.indexOf('another-admin:read'));
  assert.equal(events.at(-1), 'session:end');
});

test('deleting the final administrator rejects with LAST_ADMIN before cascading', async (t) => {
  const {
    User,
    AdminSecurityState,
    userService,
    UserSecurityError,
    planService,
    courseService,
    graduationRequirementService,
    feedbackService,
    patchNoteService,
  } = await loadSecurityModules();
  const events: string[] = [];
  const session = installTransactionDouble(t, AdminSecurityState, events);

  t.mock.method(User, 'findById', () =>
    sessionLeanQuery(
      { _id: targetAdminId, role: 'admin' },
      session,
      () => events.push('target:read')
    )
  );
  t.mock.method(User, 'exists', () =>
    sessionResultQuery(null, session, () => events.push('another-admin:read'))
  );
  t.mock.method(User, 'findByIdAndDelete', () => {
    assert.fail('the final administrator must not be deleted');
  });

  const failCascade = async () => {
    assert.fail('the final administrator must not enter cascade deletion');
    return 0;
  };
  t.mock.method(planService, 'deleteAllByUser', failCascade);
  t.mock.method(courseService, 'deleteCustomByUser', failCascade);
  t.mock.method(graduationRequirementService, 'remove', failCascade);
  t.mock.method(feedbackService, 'deleteAllByUser', failCascade);
  t.mock.method(patchNoteService, 'deleteAllReadsByUser', failCascade);

  await assert.rejects(
    userService.adminDeleteUser(targetAdminId, otherAdminId),
    (error: unknown) =>
      error instanceof UserSecurityError && error.code === 'LAST_ADMIN'
  );
  assert.ok(events.indexOf('guard:transaction') < events.indexOf('another-admin:read'));
  assert.equal(events.at(-1), 'session:end');
});

test('self-service deletion runs every cascade sequentially with the transaction session', async (t) => {
  const {
    User,
    AdminSecurityState,
    userService,
    planService,
    courseService,
    graduationRequirementService,
    feedbackService,
    patchNoteService,
  } = await loadSecurityModules();
  const events: string[] = [];
  const session = installTransactionDouble(t, AdminSecurityState, events);
  let cascadeStage = 0;

  t.mock.method(User, 'findById', () =>
    sessionLeanQuery(
      { _id: targetAdminId, role: 'student' },
      session,
      () => events.push('target:read')
    )
  );
  t.mock.method(User, 'exists', () => {
    assert.fail('student deletion does not need an administrator-count predicate');
  });

  function sequentialCascade(expectedStage: number, label: string) {
    return async (userId: string, receivedSession?: ClientSession): Promise<number> => {
      assert.equal(userId, targetAdminId);
      assert.equal(receivedSession, session);
      assert.equal(cascadeStage, expectedStage, `${label} must wait for the previous cascade`);
      cascadeStage += 1;
      events.push(`${label}:start`);
      await Promise.resolve();
      cascadeStage += 1;
      events.push(`${label}:end`);
      return 1;
    };
  }

  t.mock.method(planService, 'deleteAllByUser', sequentialCascade(0, 'plans'));
  t.mock.method(courseService, 'deleteCustomByUser', sequentialCascade(2, 'courses'));
  t.mock.method(
    graduationRequirementService,
    'remove',
    sequentialCascade(4, 'graduation-requirement')
  );
  t.mock.method(feedbackService, 'deleteAllByUser', sequentialCascade(6, 'feedback'));
  t.mock.method(
    patchNoteService,
    'deleteAllReadsByUser',
    sequentialCascade(8, 'patch-note-reads')
  );
  t.mock.method(
    User,
    'findByIdAndDelete',
    async (userId: string, options?: Record<string, unknown>) => {
      assert.equal(userId, targetAdminId);
      assert.equal(options?.session, session);
      assert.equal(cascadeStage, 10, 'the user document must be deleted after every cascade');
      events.push('user:delete');
      return { _id: targetAdminId, role: 'student' };
    }
  );

  await userService.deleteOwnAccount(targetAdminId);

  assert.deepEqual(events.slice(0, 4), [
    'guard:ensure',
    'transaction:start',
    'guard:transaction',
    'target:read',
  ]);
  assert.deepEqual(events.slice(-3), ['user:delete', 'transaction:end', 'session:end']);
});

test('self-service deletion cannot bypass administrator protection', async () => {
  const route = await readFile(resolve('src/app/api/users/me/route.ts'), 'utf8');
  assert.match(route, /@service[\s\S]*userService\.deleteOwnAccount/);
  assert.match(route, /userService\.deleteOwnAccount\(session\.user\.id\)/);
  assert.doesNotMatch(route, /deleteWithCascade/);
  assert.match(route, /error instanceof UserSecurityError/);
});

test('API routes cannot call the private raw cascade helper', async () => {
  const routes = await routeFiles(resolve('src/app/api'));
  for (const route of routes) {
    const source = await readFile(route, 'utf8');
    assert.doesNotMatch(source, /deleteWithCascade/, `${route} must use a safe public operation`);
  }

  const userServiceSource = await readFile(resolve('src/services/user.service.ts'), 'utf8');
  const exportedService = userServiceSource.slice(userServiceSource.indexOf('export const userService'));
  assert.doesNotMatch(exportedService, /deleteWithCascade/);
  assert.match(exportedService, /deleteOwnAccount/);
  assert.match(exportedService, /adminDeleteUser/);
  assert.match(exportedService, /updateRole/);
});

test('administrator route maps typed security errors without message parsing', async () => {
  const route = await readFile(resolve('src/app/api/admin/users/[id]/route.ts'), 'utf8');
  assert.match(route, /error instanceof UserSecurityError/);
  assert.match(route, /error\.code === 'LAST_ADMIN'[\s\S]*409/);
  assert.match(route, /error\.code === 'USER_NOT_FOUND'[\s\S]*404/);
  assert.doesNotMatch(route, /message\.includes\(/);
});
