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
  schema: {
    indexes(): Array<[Record<string, number>, Record<string, unknown>]>;
    options: Record<string, unknown>;
    paths: Record<string, unknown>;
  };
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
  isBlocked?: unknown;
  recordFailure?: unknown;
  clearPair?: unknown;
}

interface AtomicWrite {
  key: string;
  cap: number;
  cutoff: Date;
  now: Date;
  newExpiry: Date;
  options: Record<string, unknown>;
}

async function loadThrottleModules() {
  const [modelModule, serviceModule, sourceModule] = await Promise.all([
    import('../src/models/LoginThrottle'),
    import('../src/services/login-throttle.service'),
    import('../src/lib/auth/client-source'),
  ]);

  return {
    LoginThrottle: modelModule.default as unknown as LoginThrottleModelDouble,
    createLoginThrottleKeys: serviceModule.createLoginThrottleKeys,
    loginThrottleService:
      serviceModule.loginThrottleService as unknown as LoginThrottleServiceDouble,
    getCredentialClientSource: sourceModule.getCredentialClientSource,
    CredentialSourceUnavailableError:
      sourceModule.CredentialSourceUnavailableError,
  };
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

function dateMatches(value: unknown, expected: Date): boolean {
  return value instanceof Date && value.getTime() === expected.getTime();
}

function installThrottleHarness(
  t: TestContext,
  model: LoginThrottleModelDouble,
  initialDocuments: StoredThrottle[] = []
) {
  const documents = new Map(
    initialDocuments.map((document) => [document._id, cloneThrottle(document)])
  );
  const writes: AtomicWrite[] = [];
  const deletes: Record<string, unknown>[] = [];
  const refunds: Record<string, unknown>[] = [];

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
      assert.equal(typeof filter._id, 'string');
      assert.equal(pipeline.length, 1);
      const set = asRecord(pipeline[0].$set, 'reservation must use $set');
      const failureCondition = asArray(
        asRecord(set.failures, 'failures must use $cond').$cond,
        'failures must use $cond'
      );
      const expired = asRecord(failureCondition[0], 'expiry condition is required');
      const expiryBranches = asArray(expired.$or, 'expiry must use $or');
      assert.deepEqual(
        asRecord(expiryBranches[0], 'missing window check must use $eq').$eq,
        [{ $type: '$windowStartedAt' }, 'missing']
      );
      const cutoffOperands = asArray(
        asRecord(expiryBranches[1], 'boundary check must use $lte').$lte,
        'boundary check must use $lte'
      );
      assert.equal(cutoffOperands[0], '$windowStartedAt');
      const cutoff = asDate(cutoffOperands[1], 'cutoff must be a Date');
      assert.equal(failureCondition[1], 1);
      const minimum = asArray(
        asRecord(failureCondition[2], 'active increments must be capped').$min,
        'active increments must be capped'
      );
      assert.deepEqual(minimum[0], {
        $add: [{ $ifNull: ['$failures', 0] }, 1],
      });
      assert.equal(typeof minimum[1], 'number');
      const cap = minimum[1] as number;

      const windowCondition = asArray(
        asRecord(set.windowStartedAt, 'window start must use $cond').$cond,
        'window start must use $cond'
      );
      assert.deepEqual(windowCondition[0], expired);
      const now = asDate(windowCondition[1], 'window reset must use current time');
      assert.equal(windowCondition[2], '$windowStartedAt');
      const expiryCondition = asArray(
        asRecord(set.expiresAt, 'TTL expiry must use $cond').$cond,
        'TTL expiry must use $cond'
      );
      assert.deepEqual(expiryCondition[0], expired);
      const newExpiry = asDate(expiryCondition[1], 'new TTL expiry must be a Date');
      assert.equal(expiryCondition[2], '$expiresAt');

      const key = filter._id as string;
      const current = documents.get(key);
      const isExpired =
        current === undefined ||
        current.windowStartedAt.getTime() <= cutoff.getTime();
      const updated: StoredThrottle = {
        _id: key,
        failures: isExpired
          ? 1
          : Math.min(current.failures + 1, cap),
        windowStartedAt: isExpired
          ? new Date(now)
          : new Date(current.windowStartedAt),
        expiresAt: isExpired
          ? new Date(newExpiry)
          : new Date(current.expiresAt),
      };
      documents.set(key, updated);
      writes.push({ key, cap, cutoff, now, newExpiry, options });
      return cloneThrottle(updated);
    }
  );

  t.mock.method(model, 'deleteOne', async (filter: Record<string, unknown>) => {
    const key = filter._id;
    assert.equal(typeof key, 'string');
    const current = documents.get(key as string);
    const matches =
      current !== undefined &&
      dateMatches(filter.windowStartedAt, current.windowStartedAt);
    if (matches) documents.delete(key as string);
    deletes.push(filter);
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
      assert.deepEqual(filter.failures, { $gt: 0 });
      assert.deepEqual(update, { $inc: { failures: -1 } });
      const current = documents.get(key as string);
      const matches =
        current !== undefined &&
        current.failures > 0 &&
        dateMatches(filter.windowStartedAt, current.windowStartedAt);
      if (matches) current.failures -= 1;
      refunds.push(filter);
      return { modifiedCount: matches ? 1 : 0 };
    }
  );

  return {
    deletes,
    documents,
    refunds,
    writes,
    get(key: string): StoredThrottle | undefined {
      const document = documents.get(key);
      return document ? cloneThrottle(document) : undefined;
    },
  };
}

test('TTL model stores only opaque counters and expires them through MongoDB', async () => {
  const { LoginThrottle } = await loadThrottleModules();
  const paths = Object.keys(LoginThrottle.schema.paths).sort();

  assert.deepEqual(paths, ['_id', 'expiresAt', 'failures', 'windowStartedAt']);
  assert.equal(LoginThrottle.schema.options.versionKey, false);
  assert.ok(
    LoginThrottle.schema.indexes().some(
      ([fields, options]) =>
        fields.expiresAt === 1 && options.expireAfterSeconds === 0
    )
  );
});

test('throttle keys are deterministic, scoped, and contain no raw identifiers', async () => {
  const { createLoginThrottleKeys } = await loadThrottleModules();
  const input = { source: '203.0.113.10', email: 'Student@Example.com' };
  const keys = createLoginThrottleKeys(input, 'test-secret');
  const normalized = createLoginThrottleKeys(
    { source: input.source, email: '  student@example.com  ' },
    'test-secret'
  );
  const anotherEmail = createLoginThrottleKeys(
    { source: input.source, email: 'other@example.com' },
    'test-secret'
  );
  const anotherSource = createLoginThrottleKeys(
    { source: '203.0.113.11', email: input.email },
    'test-secret'
  );

  assert.deepEqual(keys, normalized);
  assert.notEqual(keys.sourceKey, keys.pairKey);
  assert.equal(keys.sourceKey, anotherEmail.sourceKey);
  assert.notEqual(keys.pairKey, anotherEmail.pairKey);
  assert.notEqual(keys.sourceKey, anotherSource.sourceKey);
  assert.notDeepEqual(keys, createLoginThrottleKeys(input, 'rotated-secret'));
  assert.doesNotMatch(JSON.stringify(keys), /203\.0\.113\.10|student@example\.com/i);
});

test('credential source uses trusted production input and validated development fallbacks', async () => {
  const {
    CredentialSourceUnavailableError,
    getCredentialClientSource,
  } = await loadThrottleModules();

  assert.equal(
    getCredentialClientSource(
      new Headers({
        'x-vercel-forwarded-for': '203.0.113.20, 198.51.100.1',
        'x-forwarded-for': '203.0.113.200',
      }),
      { production: true, vercel: false }
    ),
    '203.0.113.20'
  );
  assert.throws(
    () =>
      getCredentialClientSource(
        new Headers({ 'x-forwarded-for': '203.0.113.200' }),
        { production: true, vercel: false }
      ),
    CredentialSourceUnavailableError
  );
  assert.equal(
    getCredentialClientSource(
      new Headers({ 'x-real-ip': '203.0.113.22' }),
      { production: false, vercel: false }
    ),
    '203.0.113.22'
  );
  assert.equal(
    getCredentialClientSource(undefined, {
      production: false,
      vercel: false,
    }),
    'local-development'
  );
  assert.throws(
    () =>
      getCredentialClientSource(
        new Headers({ 'x-vercel-forwarded-for': 'invalid' }),
        { production: false, vercel: false }
      ),
    CredentialSourceUnavailableError
  );
});

test('reservations reset expired windows, increment active windows, and anchor expiry', async (t) => {
  const fixedNow = new Date('2026-07-10T03:00:00.000Z');
  t.mock.method(Date, 'now', () => fixedNow.getTime());
  const {
    LoginThrottle,
    createLoginThrottleKeys,
    loginThrottleService,
  } = await loadThrottleModules();
  const input = { source: '203.0.113.30', email: 'student@example.com' };
  const keys = createLoginThrottleKeys(input, process.env.NEXTAUTH_SECRET!);
  const activeStartedAt = new Date(fixedNow.getTime() - 60_000);
  const boundary = new Date(fixedNow.getTime() - 15 * 60_000);
  const originalExpiry = new Date(fixedNow.getTime() + 60_000);
  const harness = installThrottleHarness(t, LoginThrottle, [
    {
      _id: keys.sourceKey,
      failures: 20,
      windowStartedAt: boundary,
      expiresAt: originalExpiry,
    },
    {
      _id: keys.pairKey,
      failures: 4,
      windowStartedAt: activeStartedAt,
      expiresAt: originalExpiry,
    },
  ]);

  const admission = await loginThrottleService.reserveAttempt(input);
  assert.equal(admission.allowed, true);
  assert.deepEqual(harness.get(keys.sourceKey), {
    _id: keys.sourceKey,
    failures: 1,
    windowStartedAt: fixedNow,
    expiresAt: new Date(fixedNow.getTime() + 30 * 60_000),
  });
  assert.deepEqual(harness.get(keys.pairKey), {
    _id: keys.pairKey,
    failures: 5,
    windowStartedAt: activeStartedAt,
    expiresAt: originalExpiry,
  });
  assert.deepEqual(harness.writes.map(({ cap }) => cap), [21, 6]);
});

test('pair and source rejections cap at limit plus one without extending the window', async (t) => {
  const fixedNow = new Date('2026-07-10T03:15:00.000Z');
  t.mock.method(Date, 'now', () => fixedNow.getTime());
  const {
    LoginThrottle,
    createLoginThrottleKeys,
    loginThrottleService,
  } = await loadThrottleModules();
  const startedAt = new Date(fixedNow.getTime() - 1);
  const originalExpiry = new Date(fixedNow.getTime() + 10_000);
  const pairInput = { source: '203.0.113.31', email: 'pair@example.com' };
  const pairKeys = createLoginThrottleKeys(
    pairInput,
    process.env.NEXTAUTH_SECRET!
  );
  const sourceInput = { source: '203.0.113.32', email: 'source@example.com' };
  const sourceKeys = createLoginThrottleKeys(
    sourceInput,
    process.env.NEXTAUTH_SECRET!
  );
  const harness = installThrottleHarness(t, LoginThrottle, [
    {
      _id: pairKeys.sourceKey,
      failures: 0,
      windowStartedAt: startedAt,
      expiresAt: originalExpiry,
    },
    {
      _id: pairKeys.pairKey,
      failures: 5,
      windowStartedAt: startedAt,
      expiresAt: originalExpiry,
    },
    {
      _id: sourceKeys.sourceKey,
      failures: 20,
      windowStartedAt: startedAt,
      expiresAt: originalExpiry,
    },
  ]);

  assert.deepEqual(await loginThrottleService.reserveAttempt(pairInput), {
    allowed: false,
  });
  assert.equal(harness.get(pairKeys.sourceKey)?.failures, 1);
  assert.equal(harness.get(pairKeys.pairKey)?.failures, 6);
  assert.deepEqual(await loginThrottleService.reserveAttempt(pairInput), {
    allowed: false,
  });
  assert.equal(harness.get(pairKeys.pairKey)?.failures, 6);
  assert.equal(
    harness.get(pairKeys.pairKey)?.expiresAt.getTime(),
    originalExpiry.getTime()
  );

  assert.deepEqual(await loginThrottleService.reserveAttempt(sourceInput), {
    allowed: false,
  });
  assert.equal(harness.get(sourceKeys.sourceKey)?.failures, 21);
  assert.deepEqual(await loginThrottleService.reserveAttempt(sourceInput), {
    allowed: false,
  });
  assert.equal(harness.get(sourceKeys.sourceKey)?.failures, 21);
  assert.equal(harness.get(sourceKeys.pairKey), undefined);
  assert.equal(
    harness.get(sourceKeys.sourceKey)?.expiresAt.getTime(),
    originalExpiry.getTime()
  );
});

test('the exact observation-window boundary starts a new admitted reservation', async (t) => {
  const fixedNow = new Date('2026-07-10T03:30:00.000Z');
  t.mock.method(Date, 'now', () => fixedNow.getTime());
  const {
    LoginThrottle,
    createLoginThrottleKeys,
    loginThrottleService,
  } = await loadThrottleModules();
  const input = { source: '203.0.113.33', email: 'student@example.com' };
  const keys = createLoginThrottleKeys(input, process.env.NEXTAUTH_SECRET!);
  const boundary = new Date(fixedNow.getTime() - 15 * 60_000);
  const harness = installThrottleHarness(t, LoginThrottle, [
    {
      _id: keys.sourceKey,
      failures: 21,
      windowStartedAt: boundary,
      expiresAt: fixedNow,
    },
    {
      _id: keys.pairKey,
      failures: 6,
      windowStartedAt: boundary,
      expiresAt: fixedNow,
    },
  ]);

  const admission = await loginThrottleService.reserveAttempt(input);
  assert.equal(admission.allowed, true);
  assert.equal(harness.get(keys.sourceKey)?.failures, 1);
  assert.equal(harness.get(keys.pairKey)?.failures, 1);
  assert.equal(harness.get(keys.sourceKey)?.windowStartedAt.getTime(), fixedNow.getTime());
  assert.equal(harness.get(keys.pairKey)?.windowStartedAt.getTime(), fixedNow.getTime());
});

test('successful completion clears and refunds only its original windows', async (t) => {
  const fixedNow = new Date('2026-07-10T03:45:00.000Z');
  t.mock.method(Date, 'now', () => fixedNow.getTime());
  const {
    LoginThrottle,
    loginThrottleService,
  } = await loadThrottleModules();
  const harness = installThrottleHarness(t, LoginThrottle);
  const input = { source: '203.0.113.34', email: 'student@example.com' };
  const admission = await loginThrottleService.reserveAttempt(input);
  assert.equal(admission.allowed, true);
  if (!admission.allowed) return;

  await loginThrottleService.completeSuccessfulAttempt(admission.reservation);
  assert.equal(harness.get(admission.reservation.pairKey), undefined);
  assert.equal(harness.get(admission.reservation.sourceKey)?.failures, 0);
  assert.deepEqual(harness.deletes, [
    {
      _id: admission.reservation.pairKey,
      windowStartedAt: admission.reservation.pairWindowStartedAt,
    },
  ]);
  assert.deepEqual(harness.refunds, [
    {
      _id: admission.reservation.sourceKey,
      windowStartedAt: admission.reservation.sourceWindowStartedAt,
      failures: { $gt: 0 },
    },
  ]);
});

test('another source remains available for the same submitted email', async (t) => {
  const fixedNow = new Date('2026-07-10T04:00:00.000Z');
  t.mock.method(Date, 'now', () => fixedNow.getTime());
  const {
    LoginThrottle,
    createLoginThrottleKeys,
    loginThrottleService,
  } = await loadThrottleModules();
  const email = 'student@example.com';
  const attacker = { source: '203.0.113.35', email };
  const victim = { source: '203.0.113.36', email };
  const attackerKeys = createLoginThrottleKeys(
    attacker,
    process.env.NEXTAUTH_SECRET!
  );
  const startedAt = new Date(fixedNow.getTime() - 1);
  installThrottleHarness(t, LoginThrottle, [
    {
      _id: attackerKeys.sourceKey,
      failures: 21,
      windowStartedAt: startedAt,
      expiresAt: new Date(fixedNow.getTime() + 60_000),
    },
  ]);

  assert.deepEqual(await loginThrottleService.reserveAttempt(attacker), {
    allowed: false,
  });
  assert.equal(
    (await loginThrottleService.reserveAttempt(victim)).allowed,
    true
  );
});

test('service barrels expose reservation APIs and remove check-then-record methods', async () => {
  const [modelsIndex, servicesIndex, serviceSource] = await Promise.all([
    readFile(new URL('../src/models/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/services/index.ts', import.meta.url), 'utf8'),
    readFile(
      new URL('../src/services/login-throttle.service.ts', import.meta.url),
      'utf8'
    ),
  ]);
  const { loginThrottleService } = await loadThrottleModules();

  assert.match(modelsIndex, /LoginThrottle/);
  assert.match(servicesIndex, /loginThrottleService/);
  assert.match(servicesIndex, /createLoginThrottleKeys/);
  assert.match(servicesIndex, /LoginThrottleAdmission/);
  assert.match(servicesIndex, /LoginThrottleReservation/);
  assert.equal(loginThrottleService.isBlocked, undefined);
  assert.equal(loginThrottleService.recordFailure, undefined);
  assert.equal(loginThrottleService.clearPair, undefined);
  assert.doesNotMatch(serviceSource, /\bisBlocked\b|\brecordFailure\b|\bclearPair\b/);
});
