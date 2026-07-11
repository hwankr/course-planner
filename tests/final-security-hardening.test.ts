import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { type TestContext } from 'node:test';
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

interface ThrottleInput {
  source: string;
  email: string;
}

interface StoredThrottle {
  _id: string;
  failures: number;
  windowStartedAt: Date;
  expiresAt: Date;
}

interface ThrottleReservation {
  sourceKey: string;
  pairKey: string;
  sourceWindowStartedAt: Date;
  pairWindowStartedAt: Date;
}

type ThrottleAdmission =
  | { allowed: false }
  | { allowed: true; reservation: ThrottleReservation };

interface LoginThrottleModelDouble {
  findOneAndUpdate(
    filter: Record<string, unknown>,
    update: Array<Record<string, unknown>>,
    options: Record<string, unknown>
  ): Promise<StoredThrottle | null>;
  deleteOne(filter: Record<string, unknown>): Promise<{ deletedCount: number }>;
  updateOne(
    filter: Record<string, unknown>,
    update: Record<string, unknown>
  ): Promise<{ modifiedCount: number }>;
}

interface LoginThrottleServiceDouble {
  reserveAttempt(input: ThrottleInput): Promise<ThrottleAdmission>;
  completeSuccessfulAttempt(reservation: ThrottleReservation): Promise<void>;
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), message);
  return value as Record<string, unknown>;
}

function asArray(value: unknown, message: string): unknown[] {
  assert.ok(Array.isArray(value), message);
  return value;
}

function asDate(value: unknown, message: string): Date {
  assert.ok(value instanceof Date, message);
  return value;
}

function cloneThrottle(document: StoredThrottle): StoredThrottle {
  return {
    ...document,
    windowStartedAt: new Date(document.windowStartedAt),
    expiresAt: new Date(document.expiresAt),
  };
}

function sameDate(left: unknown, right: Date): boolean {
  return left instanceof Date && left.getTime() === right.getTime();
}

function installAtomicThrottleHarness(
  t: TestContext,
  model: LoginThrottleModelDouble
) {
  const documents = new Map<string, StoredThrottle>();

  t.mock.method(
    model,
    'findOneAndUpdate',
    async (
      filter: Record<string, unknown>,
      pipeline: Array<Record<string, unknown>>,
      options: Record<string, unknown>
    ) => {
      assert.deepEqual(options, {
        upsert: true,
        returnDocument: 'after',
        updatePipeline: true,
      });
      const key = filter._id;
      assert.equal(typeof key, 'string');
      const set = asRecord(pipeline[0]?.$set, 'reservation must use one $set stage');
      const failureCondition = asArray(
        asRecord(set.failures, 'failures must use $cond').$cond,
        'failures must use $cond'
      );
      const expired = asRecord(failureCondition[0], 'expiry condition is required');
      const expiryBranches = asArray(expired.$or, 'expiry must use $or');
      const cutoff = asDate(
        asArray(
          asRecord(expiryBranches[1], 'second expiry branch must use $lte').$lte,
          'expiry must use $lte'
        )[1],
        'expiry cutoff must be a Date'
      );
      const cappedIncrement = asArray(
        asRecord(failureCondition[2], 'active counter must use $min').$min,
        'active counter must use $min'
      );
      const cap = cappedIncrement[1];
      assert.equal(typeof cap, 'number');

      const windowCondition = asArray(
        asRecord(set.windowStartedAt, 'window start must use $cond').$cond,
        'window start must use $cond'
      );
      assert.deepEqual(windowCondition[0], expired);
      const now = asDate(windowCondition[1], 'new window start must be a Date');
      const expiresCondition = asArray(
        asRecord(set.expiresAt, 'TTL expiry must use $cond').$cond,
        'TTL expiry must use $cond'
      );
      assert.deepEqual(expiresCondition[0], expired);
      const newExpiry = asDate(expiresCondition[1], 'new TTL expiry must be a Date');
      assert.equal(expiresCondition[2], '$expiresAt');

      const current = documents.get(key as string);
      const isExpired =
        current === undefined ||
        current.windowStartedAt.getTime() <= cutoff.getTime();
      const updated: StoredThrottle = {
        _id: key as string,
        failures: isExpired
          ? 1
          : Math.min(current.failures + 1, cap as number),
        windowStartedAt: isExpired
          ? new Date(now)
          : new Date(current.windowStartedAt),
        expiresAt: isExpired
          ? new Date(newExpiry)
          : new Date(current.expiresAt),
      };
      documents.set(updated._id, updated);
      return cloneThrottle(updated);
    }
  );

  t.mock.method(model, 'deleteOne', async (filter: Record<string, unknown>) => {
    const key = filter._id;
    assert.equal(typeof key, 'string');
    const current = documents.get(key as string);
    const expectedWindow = filter.windowStartedAt;
    const matches =
      current !== undefined &&
      sameDate(expectedWindow, current.windowStartedAt);
    if (matches) documents.delete(key as string);
    return { deletedCount: matches ? 1 : 0 };
  });

  t.mock.method(
    model,
    'updateOne',
    async (
      filter: Record<string, unknown>,
      update: Record<string, unknown>
    ) => {
      const key = filter._id;
      assert.equal(typeof key, 'string');
      const current = documents.get(key as string);
      const expectedWindow = filter.windowStartedAt;
      const failureFilter = asRecord(
        filter.failures,
        'refund must require a positive counter'
      );
      assert.equal(failureFilter.$gt, 0);
      assert.deepEqual(update, { $inc: { failures: -1 } });
      const matches =
        current !== undefined &&
        current.failures > 0 &&
        sameDate(expectedWindow, current.windowStartedAt);
      if (matches) current.failures -= 1;
      return { modifiedCount: matches ? 1 : 0 };
    }
  );

  return {
    documents,
    get(key: string): StoredThrottle | undefined {
      const document = documents.get(key);
      return document ? cloneThrottle(document) : undefined;
    },
  };
}

test('atomic pre-auth reservations bound concurrent bcrypt work', async (t) => {
  const [{ default: LoginThrottle }, throttleModule, authenticationModule] =
    await Promise.all([
      import('../src/models/LoginThrottle'),
      import('../src/services/login-throttle.service'),
      import('../src/services/authentication.service'),
    ]);
  installAtomicThrottleHarness(
    t,
    LoginThrottle as unknown as LoginThrottleModelDouble
  );
  const throttle =
    throttleModule.loginThrottleService as unknown as LoginThrottleServiceDouble;
  let pairComparisons = 0;
  const pairService = authenticationModule.createAuthenticationService({
    reserveAttempt: (input: ThrottleInput) => throttle.reserveAttempt(input),
    findByEmailWithPassword: async () => null,
    comparePassword: async () => {
      pairComparisons += 1;
      return false;
    },
    completeSuccessfulAttempt: (reservation: ThrottleReservation) =>
      throttle.completeSuccessfulAttempt(reservation),
  });

  await Promise.all(
    Array.from({ length: 100 }, () =>
      pairService.authenticateCredentials({
        email: 'student@example.com',
        password: 'wrong-password',
        source: '203.0.113.70',
      })
    )
  );
  assert.equal(pairComparisons, 5);

  let sourceComparisons = 0;
  const sourceService = authenticationModule.createAuthenticationService({
    reserveAttempt: (input: ThrottleInput) => throttle.reserveAttempt(input),
    findByEmailWithPassword: async () => null,
    comparePassword: async () => {
      sourceComparisons += 1;
      return false;
    },
    completeSuccessfulAttempt: (reservation: ThrottleReservation) =>
      throttle.completeSuccessfulAttempt(reservation),
  });
  await Promise.all(
    Array.from({ length: 100 }, (_, index) =>
      sourceService.authenticateCredentials({
        email: `student-${index}@example.com`,
        password: 'wrong-password',
        source: '203.0.113.71',
      })
    )
  );
  assert.equal(sourceComparisons, 20);
});

test('successful reservations clear the pair and refund only the same source window', async (t) => {
  const [{ default: LoginThrottle }, throttleModule] = await Promise.all([
    import('../src/models/LoginThrottle'),
    import('../src/services/login-throttle.service'),
  ]);
  const harness = installAtomicThrottleHarness(
    t,
    LoginThrottle as unknown as LoginThrottleModelDouble
  );
  const throttle =
    throttleModule.loginThrottleService as unknown as LoginThrottleServiceDouble;
  const input = { source: '203.0.113.72', email: 'student@example.com' };
  const admission = await throttle.reserveAttempt(input);
  assert.equal(admission.allowed, true);
  if (!admission.allowed) return;

  await throttle.completeSuccessfulAttempt(admission.reservation);
  assert.equal(harness.get(admission.reservation.pairKey), undefined);
  assert.equal(harness.get(admission.reservation.sourceKey)?.failures, 0);

  const secondAdmission = await throttle.reserveAttempt(input);
  assert.equal(secondAdmission.allowed, true);
  if (!secondAdmission.allowed) return;
  const newWindow = new Date(
    secondAdmission.reservation.sourceWindowStartedAt.getTime() + 60_000
  );
  harness.documents.set(secondAdmission.reservation.sourceKey, {
    _id: secondAdmission.reservation.sourceKey,
    failures: 4,
    windowStartedAt: newWindow,
    expiresAt: new Date(newWindow.getTime() + 30 * 60_000),
  });
  harness.documents.set(secondAdmission.reservation.pairKey, {
    _id: secondAdmission.reservation.pairKey,
    failures: 3,
    windowStartedAt: newWindow,
    expiresAt: new Date(newWindow.getTime() + 30 * 60_000),
  });

  await throttle.completeSuccessfulAttempt(secondAdmission.reservation);
  assert.equal(harness.get(secondAdmission.reservation.sourceKey)?.failures, 4);
  assert.equal(harness.get(secondAdmission.reservation.pairKey)?.failures, 3);
});

test('credential normalization bounds dependency inputs without authenticating overflow', async () => {
  const authenticationModule = await import(
    '../src/services/authentication.service'
  );
  assert.equal(authenticationModule.MAX_CREDENTIAL_EMAIL_LENGTH, 320);
  assert.equal(authenticationModule.MAX_CREDENTIAL_PASSWORD_LENGTH, 1024);
  const reservation: ThrottleReservation = {
    sourceKey: 'source-key',
    pairKey: 'pair-key',
    sourceWindowStartedAt: new Date(0),
    pairWindowStartedAt: new Date(0),
  };
  const observed = {
    throttle: undefined as ThrottleInput | undefined,
    lookup: '',
    password: '',
    completed: false,
  };
  const service = authenticationModule.createAuthenticationService({
    reserveAttempt: async (input: ThrottleInput) => {
      observed.throttle = input;
      return { allowed: true as const, reservation };
    },
    findByEmailWithPassword: async (email: string) => {
      observed.lookup = email;
      return {
        _id: { toString: () => 'user-1' },
        email,
        password: 'real-password-hash',
      } as never;
    },
    comparePassword: async (password: string) => {
      observed.password = password;
      return true;
    },
    completeSuccessfulAttempt: async () => {
      observed.completed = true;
    },
  });

  const result = await service.authenticateCredentials({
    email: `${'a'.repeat(400)}@example.com`,
    password: 'p'.repeat(2_000),
    source: '203.0.113.73',
  });

  assert.equal(result, null);
  assert.equal(observed.throttle?.email.length, 320);
  assert.equal(observed.lookup.length, 320);
  assert.equal(observed.password.length, 1024);
  assert.equal(observed.completed, false);
});

test('production source extraction trusts only a valid Vercel IP and fails closed', async () => {
  const sourceModule = await import('../src/lib/auth/client-source');
  const production = { production: true, vercel: false };

  assert.equal(
    sourceModule.getCredentialClientSource(
      new Headers({
        'x-vercel-forwarded-for': '2001:0DB8:0:0:0:0:0:1, 198.51.100.1',
        'x-forwarded-for': '203.0.113.200',
        'x-real-ip': '203.0.113.201',
      }),
      production
    ),
    '2001:db8::1'
  );

  for (const headers of [
    new Headers({ 'x-forwarded-for': '203.0.113.200' }),
    new Headers({ 'x-vercel-forwarded-for': 'not-an-ip' }),
    new Headers(),
  ]) {
    assert.throws(
      () => sourceModule.getCredentialClientSource(headers, production),
      (error: unknown) =>
        error instanceof sourceModule.CredentialSourceUnavailableError &&
        error.code === 'SOURCE_UNAVAILABLE'
    );
  }

  const originalVercel = process.env.VERCEL;
  process.env.VERCEL = '1';
  try {
    assert.throws(
      () =>
        sourceModule.getCredentialClientSource(
          new Headers({ 'x-forwarded-for': '203.0.113.200' }),
          { production: false, vercel: false }
        ),
      sourceModule.CredentialSourceUnavailableError,
      'test overrides must not weaken a real production/Vercel runtime'
    );
  } finally {
    if (originalVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = originalVercel;
    }
  }

  const development = { production: false, vercel: false };
  assert.equal(
    sourceModule.getCredentialClientSource(
      new Headers({ 'x-forwarded-for': '203.0.113.202, 198.51.100.2' }),
      development
    ),
    '203.0.113.202'
  );
  assert.equal(
    sourceModule.getCredentialClientSource(new Headers(), development),
    'local-development'
  );
  assert.throws(
    () =>
      sourceModule.getCredentialClientSource(
        new Headers({ 'x-real-ip': 'invalid' }),
        development
      ),
    sourceModule.CredentialSourceUnavailableError
  );
});

test('credential diagnostics retain only a sanitized failure category', async () => {
  const optionsModule = await import('../src/lib/auth/options');
  const secretFailure = new Error(
    'database failed for student@example.com password=Secret123 source=203.0.113.74'
  );
  const reports: unknown[] = [];
  const authorize = optionsModule.createCredentialsAuthorize({
    authenticateCredentials: async () => {
      throw secretFailure;
    },
    getClientSource: () => '203.0.113.74',
    reportUnexpectedFailure: (diagnostic: unknown) => reports.push(diagnostic),
  });

  assert.equal(
    await authorize(
      { email: 'student@example.com', password: 'Secret123' },
      { body: {}, query: {}, headers: {}, method: 'POST' }
    ),
    null
  );
  assert.deepEqual(reports, [{ category: 'authentication_service_failure' }]);
  const serialized = JSON.stringify(reports);
  for (const secret of [
    secretFailure.message,
    'student@example.com',
    'Secret123',
    '203.0.113.74',
  ]) {
    assert.equal(serialized.includes(secret), false);
  }
});

test('unsupported transaction errors are classified narrowly and mapped to 503', async () => {
  const errorModule = await import('../src/services/user-security.error');

  assert.equal(
    errorModule.isTransactionsUnavailableError({
      code: 20,
      codeName: 'IllegalOperation',
      message: 'Transaction numbers are only allowed on a replica set member or mongos',
    }),
    true
  );
  assert.equal(
    errorModule.isTransactionsUnavailableError(
      new Error('Transaction numbers are only allowed on a replica set member or mongos')
    ),
    true
  );
  assert.equal(errorModule.isTransactionsUnavailableError(new Error('timeout')), false);
  assert.equal(
    errorModule.isTransactionsUnavailableError(
      new Error('Transactions are not supported by this topology')
    ),
    false
  );
  assert.equal(
    errorModule.isTransactionsUnavailableError(
      new Error('Transaction support is not available')
    ),
    false
  );
  assert.equal(
    errorModule.isTransactionsUnavailableError({
      code: 20,
      codeName: 'DifferentOperation',
      message: 'another illegal operation',
    }),
    false
  );
  assert.equal(
    errorModule.isTransactionsUnavailableError({
      code: 20,
      codeName: 'IllegalOperation',
      message: 'unrelated illegal operation',
    }),
    false
  );

  const root = new URL('../', import.meta.url);
  const [service, adminRoute, selfRoute] = await Promise.all([
    readFile(new URL('src/services/user.service.ts', root), 'utf8'),
    readFile(new URL('src/app/api/admin/users/[id]/route.ts', root), 'utf8'),
    readFile(new URL('src/app/api/users/me/route.ts', root), 'utf8'),
  ]);
  assert.match(service, /isTransactionsUnavailableError/);
  assert.match(service, /new UserSecurityError\(\s*'TRANSACTIONS_UNAVAILABLE'/);
  for (const route of [adminRoute, selfRoute]) {
    assert.match(
      route,
      /error\.code === 'TRANSACTIONS_UNAVAILABLE'\) return 503/
    );
  }
});

test('admin routes reject malformed JSON and user lists use an allowlisted DTO', async () => {
  const root = new URL('../', import.meta.url);
  const [adminRoute, userService] = await Promise.all([
    readFile(new URL('src/app/api/admin/users/[id]/route.ts', root), 'utf8'),
    readFile(new URL('src/services/user.service.ts', root), 'utf8'),
  ]);

  const jsonRead = adminRoute.indexOf('await request.json()');
  const schemaParse = adminRoute.indexOf('updateRoleSchema.safeParse');
  assert.ok(jsonRead >= 0 && schemaParse > jsonRead);
  assert.match(
    adminRoute.slice(jsonRead, schemaParse),
    /catch[\s\S]*status:\s*400/
  );
  assert.match(userService, /ADMIN_USER_LIST_PROJECTION/);
  assert.match(userService, /\.select\(ADMIN_USER_LIST_PROJECTION\)/);
  assert.match(userService, /\.map\(toAdminUserListItem\)/);
  const projection = userService.match(
    /const ADMIN_USER_LIST_PROJECTION =[\s\S]*?} as const;/
  )?.[0];
  assert.ok(projection);
  assert.doesNotMatch(
    projection,
    /password|failedLoginAttempts|lockUntil/
  );
});

test('tracked authentication adapters use consistent CRLF line endings', async () => {
  const root = new URL('../', import.meta.url);
  for (const relativePath of [
    'src/hooks/useAuth.ts',
    'src/lib/auth/options.ts',
  ]) {
    const bytes = await readFile(new URL(relativePath, root));
    for (let index = 0; index < bytes.length; index += 1) {
      if (bytes[index] === 0x0a) {
        assert.equal(
          bytes[index - 1],
          0x0d,
          `${relativePath} contains a non-CRLF newline at byte ${index}`
        );
      }
    }
  }
});
