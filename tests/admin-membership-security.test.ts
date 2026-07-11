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

interface MembershipUserState {
  _id: string;
  role: 'student' | 'admin';
}

interface StatefulMembershipDouble {
  events: string[];
  adminIds(): string[];
  retryCount(): number;
}

interface MembershipTransactionContext {
  attempt: number;
  guardWritten: boolean;
  releaseGuard?: () => void;
  sessionId: number;
  snapshotRevision: number;
  users: Map<string, MembershipUserState>;
}

interface StatefulMembershipDoubleOptions {
  synchronizeFirstAttempts?: number;
}

class TransientMembershipWriteConflict extends Error {}

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

function installStatefulMembershipDouble(
  t: TestContext,
  modules: NonNullable<Awaited<ReturnType<typeof loadSecurityModules>>>,
  initialUsers: MembershipUserState[],
  options: StatefulMembershipDoubleOptions = {}
): StatefulMembershipDouble {
  const events: string[] = [];
  const transactions = new Map<ClientSession, MembershipTransactionContext>();
  let committedUsers = new Map(
    initialUsers.map((user) => [user._id, { ...user }])
  );
  let committedRevision = 0;
  let guardLocked = false;
  const guardWaiters: Array<() => void> = [];
  let retries = 0;
  let nextSessionId = 0;
  let synchronizedAttemptArrivals = 0;
  let releaseSynchronizedAttempts!: () => void;
  const synchronizedAttempts = new Promise<void>((resolveReady) => {
    releaseSynchronizedAttempts = resolveReady;
  });
  let releaseFirstGuardAcquired!: () => void;
  const firstGuardAcquired = new Promise<void>((resolveAcquired) => {
    releaseFirstGuardAcquired = resolveAcquired;
  });

  function cloneUsers(users: Map<string, MembershipUserState>) {
    return new Map(
      [...users].map(([id, user]) => [id, { ...user }])
    );
  }

  function requireTransaction(
    session: ClientSession | undefined,
    requireGuard = true
  ): MembershipTransactionContext {
    assert.ok(session, 'a transaction session is required');
    const transaction = transactions.get(session);
    assert.ok(transaction, 'the session must have an active transaction');
    if (requireGuard) {
      assert.equal(
        transaction.guardWritten,
        true,
        'the shared guard must be written before user state is read or changed'
      );
    }
    return transaction;
  }

  async function synchronizeFirstAttempt(
    transaction: MembershipTransactionContext
  ): Promise<void> {
    const participantCount = options.synchronizeFirstAttempts ?? 0;
    if (participantCount === 0 || transaction.attempt !== 1) return;

    synchronizedAttemptArrivals += 1;
    if (synchronizedAttemptArrivals === participantCount) {
      releaseSynchronizedAttempts();
    }
    await synchronizedAttempts;

    if (transaction.sessionId !== 1) {
      await firstGuardAcquired;
    }
  }

  async function acquireGuard(): Promise<() => void> {
    if (guardLocked) {
      await new Promise<void>((resolveGuard) => {
        guardWaiters.push(resolveGuard);
      });
    } else {
      guardLocked = true;
    }

    return () => {
      const next = guardWaiters.shift();
      if (next) {
        next();
      } else {
        guardLocked = false;
      }
    };
  }

  function releaseTransactionGuard(transaction: MembershipTransactionContext): void {
    transaction.releaseGuard?.();
    transaction.releaseGuard = undefined;
  }

  t.mock.method(mongoose, 'startSession', async () => {
    const sessionId = ++nextSessionId;
    const session: SessionDouble = {
      async withTransaction<T>(
        operation: () => Promise<T>,
        options?: Record<string, unknown>
      ): Promise<T> {
        assert.deepEqual(options, {
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
        });
        let attempt = 0;
        while (true) {
          attempt += 1;
          events.push(`transaction:start:${sessionId}:attempt:${attempt}`);
          const transaction: MembershipTransactionContext = {
            attempt,
            guardWritten: false,
            sessionId,
            snapshotRevision: committedRevision,
            users: cloneUsers(committedUsers),
          };
          transactions.set(clientSession, transaction);

          try {
            const value = await operation();
            assert.equal(transaction.guardWritten, true, 'a transaction cannot commit without the guard');
            committedUsers = cloneUsers(transaction.users);
            committedRevision += 1;
            events.push(`transaction:commit:${sessionId}:attempt:${attempt}`);
            releaseTransactionGuard(transaction);
            return value;
          } catch (error) {
            releaseTransactionGuard(transaction);
            if (error instanceof TransientMembershipWriteConflict) {
              retries += 1;
              events.push(`transaction:retry:${sessionId}:attempt:${attempt + 1}`);
              continue;
            }
            events.push(`transaction:abort:${sessionId}:attempt:${attempt}`);
            throw error;
          } finally {
            transactions.delete(clientSession);
          }
        }
      },
      async endSession(): Promise<void> {
        events.push(`session:end:${sessionId}`);
      },
    };
    const clientSession = session as unknown as ClientSession;
    return clientSession;
  });

  t.mock.method(
    modules.AdminSecurityState,
    'updateOne',
    async (
      filter: Record<string, unknown>,
      update: Record<string, unknown>,
      options?: Record<string, unknown>
    ) => {
      assert.deepEqual(filter, { _id: 'admin-membership' });
      const session = options?.session as ClientSession | undefined;
      if (!session) {
        assert.deepEqual(update, { $setOnInsert: { revision: 0 } });
        assert.equal(options?.upsert, true);
        events.push('guard:ensure');
        return { acknowledged: true };
      }

      const transaction = requireTransaction(session, false);
      assert.deepEqual(update, { $inc: { revision: 1 } });
      assert.equal(transaction.guardWritten, false, 'the guard is written once per attempt');
      await synchronizeFirstAttempt(transaction);
      const releaseGuard = await acquireGuard();
      if (transaction.sessionId === 1 && transaction.attempt === 1) {
        releaseFirstGuardAcquired();
      }
      if (transaction.snapshotRevision !== committedRevision) {
        events.push(
          `transaction:write-conflict:${transaction.sessionId}:attempt:${transaction.attempt}`
        );
        releaseGuard();
        throw new TransientMembershipWriteConflict();
      }
      transaction.releaseGuard = releaseGuard;
      transaction.guardWritten = true;
      events.push('transaction:guard');
      events.push(
        `transaction:guard:${transaction.sessionId}:attempt:${transaction.attempt}`
      );
      return { acknowledged: true };
    }
  );

  t.mock.method(modules.User, 'findById', (id: string) => ({
    session(session: ClientSession) {
      const transaction = requireTransaction(session);
      events.push(`transaction:target-read:${id}`);
      events.push(
        `transaction:target-read:${transaction.sessionId}:attempt:${transaction.attempt}:${id}`
      );
      return {
        async lean(): Promise<MembershipUserState | null> {
          const user = transaction.users.get(id);
          return user ? { ...user } : null;
        },
      };
    },
  }));

  t.mock.method(modules.User, 'exists', (filter: Record<string, unknown>) => ({
    session(session: ClientSession): Promise<{ _id: string } | null> {
      const transaction = requireTransaction(session);
      const excludedId = (filter._id as { $ne: string }).$ne;
      assert.equal(filter.role, 'admin');
      events.push(`transaction:admin-check:${excludedId}`);
      events.push(
        `transaction:admin-check:${transaction.sessionId}:attempt:${transaction.attempt}:${excludedId}`
      );
      const anotherAdmin = [...transaction.users.values()].find(
        (user) => user._id !== excludedId && user.role === 'admin'
      );
      return Promise.resolve(anotherAdmin ? { _id: anotherAdmin._id } : null);
    },
  }));

  t.mock.method(
    modules.User,
    'findByIdAndUpdate',
    (
      id: string,
      update: { role: MembershipUserState['role'] },
      options?: Record<string, unknown>
    ) => {
      const transaction = requireTransaction(options?.session as ClientSession | undefined);
      const user = transaction.users.get(id);
      const updatedUser = user ? { ...user, role: update.role } : null;
      if (updatedUser) transaction.users.set(id, updatedUser);
      events.push(`transaction:role-update:${id}:${update.role}`);
      return {
        populate() {
          return {
            async lean(): Promise<MembershipUserState | null> {
              return updatedUser ? { ...updatedUser } : null;
            },
          };
        },
      };
    }
  );

  t.mock.method(
    modules.User,
    'findByIdAndDelete',
    async (id: string, options?: Record<string, unknown>) => {
      const transaction = requireTransaction(options?.session as ClientSession | undefined);
      const user = transaction.users.get(id);
      if (user) transaction.users.delete(id);
      events.push(`transaction:user-delete:${id}`);
      return user ? { ...user } : null;
    }
  );

  function cascade(label: string) {
    return async (userId: string, session?: ClientSession): Promise<number> => {
      requireTransaction(session);
      events.push(`transaction:cascade:${label}:${userId}`);
      return 1;
    };
  }

  t.mock.method(modules.planService, 'deleteAllByUser', cascade('plans'));
  t.mock.method(modules.courseService, 'deleteCustomByUser', cascade('courses'));
  t.mock.method(
    modules.graduationRequirementService,
    'remove',
    cascade('graduation-requirement')
  );
  t.mock.method(modules.feedbackService, 'deleteAllByUser', cascade('feedback'));
  t.mock.method(
    modules.patchNoteService,
    'deleteAllReadsByUser',
    cascade('patch-note-reads')
  );

  return {
    events,
    adminIds: () =>
      [...committedUsers.values()]
        .filter((user) => user.role === 'admin')
        .map((user) => user._id)
        .sort(),
    retryCount: () => retries,
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
  assert.match(errorSource, /'TRANSACTIONS_UNAVAILABLE'/);
});

test('unsupported MongoDB transactions become a typed service error', async (t) => {
  const { User, AdminSecurityState, userService, UserSecurityError } =
    await loadSecurityModules();
  const events: string[] = [];
  const session = {
    async withTransaction(operation: () => Promise<void>): Promise<void> {
      events.push('transaction:start');
      await operation();
    },
    async endSession(): Promise<void> {
      events.push('session:end');
    },
  } as unknown as ClientSession;

  t.mock.method(mongoose, 'startSession', async () => session);
  t.mock.method(
    AdminSecurityState,
    'updateOne',
    async (
      _filter: Record<string, unknown>,
      _update: Record<string, unknown>,
      options?: Record<string, unknown>
    ) => {
      if (options?.session === session) {
        throw Object.assign(
          new Error(
            'Transaction numbers are only allowed on a replica set member or mongos'
          ),
          { code: 20, codeName: 'IllegalOperation' }
        );
      }
      return { acknowledged: true };
    }
  );
  t.mock.method(User, 'findById', () => {
    assert.fail('the membership read must not run when transactions are unavailable');
  });

  await assert.rejects(
    userService.updateRole(targetAdminId, 'student'),
    (error: unknown) =>
      error instanceof UserSecurityError &&
      error.code === 'TRANSACTIONS_UNAVAILABLE'
  );
  assert.deepEqual(events, ['transaction:start', 'session:end']);
});

test('arbitrary database errors are not reclassified as topology failures', async (t) => {
  const { AdminSecurityState, userService, UserSecurityError } =
    await loadSecurityModules();
  const original = new Error('database timeout');
  const session = {
    async withTransaction(): Promise<void> {
      throw original;
    },
    async endSession(): Promise<void> {},
  } as unknown as ClientSession;

  t.mock.method(mongoose, 'startSession', async () => session);
  t.mock.method(AdminSecurityState, 'updateOne', async () => ({
    acknowledged: true,
  }));

  await assert.rejects(
    userService.updateRole(targetAdminId, 'student'),
    (error: unknown) =>
      error === original && !(error instanceof UserSecurityError)
  );
});

test('all administrator-decreasing mutations serialize on one guard write', async () => {
  const source = await readFile(resolve('src/services/user.service.ts'), 'utf8');
  assert.match(source, /AdminSecurityState\.updateOne\([\s\S]*\$inc:\s*\{\s*revision:\s*1/);
  assert.match(source, /withTransaction/);
  assert.match(source, /role:\s*'admin'/);
  assert.match(source, /\$ne:\s*targetUserId/);
  assert.doesNotMatch(source, /countDocuments\(\{\s*role:\s*'admin'/);

  const transactionBodyStart = source.indexOf(
    'await activeSession.withTransaction'
  );
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

test('self-service deletion rejects the final administrator with LAST_ADMIN', async (t) => {
  const modules = await loadSecurityModules();
  const state = installStatefulMembershipDouble(t, modules, [
    { _id: targetAdminId, role: 'admin' },
  ]);

  await assert.rejects(
    modules.userService.deleteOwnAccount(targetAdminId),
    (error: unknown) =>
      error instanceof modules.UserSecurityError && error.code === 'LAST_ADMIN'
  );

  assert.deepEqual(state.adminIds(), [targetAdminId]);
  assert.equal(state.retryCount(), 0);
  assert.ok(
    state.events.indexOf('transaction:guard') <
      state.events.indexOf(`transaction:target-read:${targetAdminId}`),
    'the guard write must precede the self-delete target read'
  );
  assert.ok(
    state.events.indexOf('transaction:guard') <
      state.events.indexOf(`transaction:admin-check:${targetAdminId}`),
    'the guard write must precede the final-administrator predicate'
  );
  assert.doesNotMatch(state.events.join('\n'), /cascade|user-delete/);
});

test('simultaneous self-delete and demotion serialize, retry, and preserve one administrator', async (t) => {
  const modules = await loadSecurityModules();
  const state = installStatefulMembershipDouble(t, modules, [
    { _id: targetAdminId, role: 'admin' },
    { _id: otherAdminId, role: 'admin' },
  ], { synchronizeFirstAttempts: 2 });

  const [selfDelete, demotion] = await Promise.allSettled([
    modules.userService.deleteOwnAccount(targetAdminId),
    modules.userService.updateRole(otherAdminId, 'student'),
  ]);

  assert.equal(selfDelete.status, 'fulfilled');
  assert.equal(demotion.status, 'rejected');
  assert.ok(
    demotion.reason instanceof modules.UserSecurityError &&
      demotion.reason.code === 'LAST_ADMIN'
  );
  assert.deepEqual(state.adminIds(), [otherAdminId]);
  assert.equal(state.retryCount(), 1, 'the guard write conflict must retry the losing operation');
  assert.equal(
    state.events.filter((event) => event.startsWith('transaction:commit:')).length,
    1,
    'only one administrator-decreasing transaction may commit'
  );

  const retry = state.events.indexOf('transaction:retry:2:attempt:2');
  const retriedGuard = state.events.indexOf('transaction:guard:2:attempt:2');
  const retriedTargetRead = state.events.indexOf(
    `transaction:target-read:2:attempt:2:${otherAdminId}`
  );
  const retriedAdminCheck = state.events.indexOf(
    `transaction:admin-check:2:attempt:2:${otherAdminId}`
  );
  assert.ok(retry >= 0, 'the losing transaction must record a retry');
  assert.ok(
    retry < retriedGuard &&
      retriedGuard < retriedTargetRead &&
      retriedTargetRead < retriedAdminCheck,
    'the retried operation must take the guard before re-reading committed administrator state'
  );
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
  const [route, selfRoute] = await Promise.all([
    readFile(resolve('src/app/api/admin/users/[id]/route.ts'), 'utf8'),
    readFile(resolve('src/app/api/users/me/route.ts'), 'utf8'),
  ]);
  for (const source of [route, selfRoute]) {
    assert.match(source, /error instanceof UserSecurityError/);
    assert.match(source, /error\.code === 'TRANSACTIONS_UNAVAILABLE'[\s\S]*503/);
    assert.match(source, /error\.code === 'LAST_ADMIN'[\s\S]*409/);
    assert.match(source, /error\.code === 'USER_NOT_FOUND'[\s\S]*404/);
    assert.doesNotMatch(source, /message\.includes\(/);
  }
});
