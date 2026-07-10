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

interface LoginThrottleModelDouble {
  schema: {
    indexes(): Array<[Record<string, number>, Record<string, unknown>]>;
    options: Record<string, unknown>;
    paths: Record<string, unknown>;
  };
  find(filter: Record<string, unknown>): unknown;
  findOneAndUpdate(
    filter: Record<string, unknown>,
    update: Array<Record<string, unknown>>,
    options: Record<string, unknown>
  ): Promise<StoredThrottle>;
  deleteOne(filter: Record<string, unknown>): Promise<{ deletedCount: number }>;
}

interface LoginThrottleServiceDouble {
  isBlocked(input: ThrottleInput): Promise<boolean>;
  recordFailure(input: ThrottleInput): Promise<void>;
  clearPair(input: ThrottleInput): Promise<void>;
}

interface AtomicWrite {
  filter: Record<string, unknown>;
  pipeline: Array<Record<string, unknown>>;
  options: Record<string, unknown>;
}

async function loadThrottleModules() {
  try {
    const [modelModule, serviceModule, sourceModule] = await Promise.all([
      import('../src/models/LoginThrottle'),
      import('../src/services/login-throttle.service'),
      import('../src/lib/auth/client-source'),
    ]);

    return {
      LoginThrottle: modelModule.default as unknown as LoginThrottleModelDouble,
      createLoginThrottleKeys: serviceModule.createLoginThrottleKeys,
      loginThrottleService:
        serviceModule.loginThrottleService as LoginThrottleServiceDouble,
      getCredentialClientSource: sourceModule.getCredentialClientSource,
    };
  } catch (error) {
    assert.fail(`login throttle modules are unavailable: ${String(error)}`);
  }
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

  t.mock.method(model, 'find', (filter: Record<string, unknown>) => {
    const idFilter = asRecord(filter._id, 'find must filter by opaque IDs');
    const ids = asArray(idFilter.$in, 'find must read both opaque IDs');

    return {
      async lean(): Promise<StoredThrottle[]> {
        return ids.flatMap((id) => {
          assert.ok(typeof id === 'string');
          const document = documents.get(id);
          return document ? [cloneThrottle(document)] : [];
        });
      },
    };
  });

  t.mock.method(
    model,
    'findOneAndUpdate',
    async (
      filter: Record<string, unknown>,
      pipeline: Array<Record<string, unknown>>,
      options: Record<string, unknown>
    ) => {
      assert.equal(typeof filter._id, 'string', 'counter key must be opaque text');
      assert.equal(pipeline.length, 1, 'one aggregation stage must update each key');
      assert.deepEqual(options, {
        upsert: true,
        updatePipeline: true,
      });
      assert.equal(Object.hasOwn(options, 'new'), false);
      assert.equal(Object.hasOwn(options, 'returnOriginal'), false);

      const set = asRecord(pipeline[0].$set, 'pipeline must contain one $set stage');
      const failures = asRecord(set.failures, 'failures must use $cond');
      const failuresCondition = asArray(
        failures.$cond,
        'failures must atomically reset or increment'
      );
      assert.equal(failuresCondition.length, 3);

      const expired = asRecord(
        failuresCondition[0],
        'the first $cond argument must detect expiry'
      );
      const expiryBranches = asArray(expired.$or, 'expiry must handle missing and old windows');
      const missingCheck = asRecord(expiryBranches[0], 'first expiry branch must use $eq');
      assert.deepEqual(missingCheck.$eq, [
        { $type: '$windowStartedAt' },
        'missing',
      ]);
      const cutoffCheck = asRecord(expiryBranches[1], 'second expiry branch must use $lte');
      const cutoffOperands = asArray(cutoffCheck.$lte, 'expiry boundary must use $lte');
      assert.equal(cutoffOperands[0], '$windowStartedAt');
      const cutoff = asDate(cutoffOperands[1], 'expiry cutoff must be a Date');

      assert.equal(failuresCondition[1], 1, 'expired and missing counters reset to one');
      assert.deepEqual(failuresCondition[2], {
        $add: [{ $ifNull: ['$failures', 0] }, 1],
      });

      const windowStartedAt = asRecord(
        set.windowStartedAt,
        'windowStartedAt must use the same expiry condition'
      );
      const windowCondition = asArray(
        windowStartedAt.$cond,
        'windowStartedAt must reset or remain unchanged'
      );
      assert.deepEqual(windowCondition[0], expired);
      const now = asDate(windowCondition[1], 'reset time must be a Date');
      assert.equal(windowCondition[2], '$windowStartedAt');
      const expiresAt = asDate(set.expiresAt, 'TTL expiry must be a Date');

      const key = filter._id as string;
      const current = documents.get(key);
      const isExpired =
        current === undefined ||
        current.windowStartedAt.getTime() <= cutoff.getTime();
      const updated: StoredThrottle = {
        _id: key,
        failures: isExpired ? 1 : current.failures + 1,
        windowStartedAt: isExpired ? new Date(now) : new Date(current.windowStartedAt),
        expiresAt: new Date(expiresAt),
      };

      documents.set(key, updated);
      writes.push({ filter, pipeline, options });
      return cloneThrottle(updated);
    }
  );

  t.mock.method(model, 'deleteOne', async (filter: Record<string, unknown>) => {
    assert.equal(typeof filter._id, 'string');
    const deleted = documents.delete(filter._id as string);
    deletes.push(filter);
    return { deletedCount: deleted ? 1 : 0 };
  });

  return {
    deletes,
    documents,
    writes,
    get(key: string) {
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
    ),
    'expiresAt must have an absolute TTL index'
  );
});

test('throttle keys are deterministic, scoped, and contain no raw identifiers', async () => {
  const { createLoginThrottleKeys } = await loadThrottleModules();
  const input = { source: '203.0.113.10', email: 'Student@Example.com' };
  const keys = createLoginThrottleKeys(input, 'test-secret');
  const normalizedKeys = createLoginThrottleKeys(
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

  assert.deepEqual(keys, normalizedKeys);
  assert.notEqual(keys.sourceKey, keys.pairKey);
  assert.equal(keys.sourceKey, anotherEmail.sourceKey);
  assert.notEqual(keys.pairKey, anotherEmail.pairKey);
  assert.notEqual(keys.sourceKey, anotherSource.sourceKey);
  assert.notEqual(keys.pairKey, anotherSource.pairKey);
  assert.notDeepEqual(keys, createLoginThrottleKeys(input, 'rotated-secret'));
  assert.doesNotMatch(
    JSON.stringify(keys),
    /203\.0\.113\.10|student@example\.com/i
  );
});

test('credential client source honors bounded Vercel header precedence', async () => {
  const { getCredentialClientSource } = await loadThrottleModules();

  assert.equal(
    getCredentialClientSource(
      new Headers({
        'x-vercel-forwarded-for': ' 203.0.113.20, 198.51.100.1 ',
        'x-forwarded-for': '203.0.113.21',
        'x-real-ip': '203.0.113.22',
      })
    ),
    '203.0.113.20'
  );
  assert.equal(
    getCredentialClientSource(
      new Headers({
        'x-forwarded-for': '203.0.113.21, 198.51.100.2',
        'x-real-ip': '203.0.113.22',
      })
    ),
    '203.0.113.21'
  );
  assert.equal(
    getCredentialClientSource(new Headers({ 'x-real-ip': '203.0.113.22' })),
    '203.0.113.22'
  );
  assert.equal(
    getCredentialClientSource({
      'X-VERCEL-FORWARDED-FOR': ['203.0.113.23', '198.51.100.3'],
      'x-forwarded-for': '203.0.113.24',
    }),
    '203.0.113.23'
  );
  assert.equal(
    getCredentialClientSource(
      new Headers({ 'x-vercel-forwarded-for': 'x'.repeat(256) })
    ).length,
    128
  );
  assert.equal(getCredentialClientSource(new Headers()), 'unknown');
  assert.equal(getCredentialClientSource(undefined), 'unknown');
  assert.equal(
    getCredentialClientSource(new Headers({ 'x-forwarded-for': ' ,ignored' })),
    'unknown'
  );
});

test('recordFailure uses atomic upserts to reset expired and increment active windows', async (t) => {
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
  const staleStartedAt = new Date(fixedNow.getTime() - 15 * 60_000);
  const originalExpiry = new Date(fixedNow.getTime() + 60_000);
  const harness = installThrottleHarness(t, LoginThrottle, [
    {
      _id: keys.sourceKey,
      failures: 8,
      windowStartedAt: staleStartedAt,
      expiresAt: originalExpiry,
    },
    {
      _id: keys.pairKey,
      failures: 3,
      windowStartedAt: activeStartedAt,
      expiresAt: originalExpiry,
    },
  ]);

  await loginThrottleService.recordFailure(input);

  assert.equal(harness.writes.length, 2);
  assert.deepEqual(harness.get(keys.sourceKey), {
    _id: keys.sourceKey,
    failures: 1,
    windowStartedAt: fixedNow,
    expiresAt: new Date(fixedNow.getTime() + 30 * 60_000),
  });
  assert.deepEqual(harness.get(keys.pairKey), {
    _id: keys.pairKey,
    failures: 4,
    windowStartedAt: activeStartedAt,
    expiresAt: new Date(fixedNow.getTime() + 30 * 60_000),
  });

  for (const write of harness.writes) {
    assert.deepEqual(write.options, {
      upsert: true,
      updatePipeline: true,
    });
    assert.equal(Object.hasOwn(write.options, 'new'), false);
    assert.equal(Object.hasOwn(write.options, 'returnOriginal'), false);
    const set = asRecord(write.pipeline[0].$set, 'counter update needs $set');
    const failures = asArray(
      asRecord(set.failures, 'counter update needs failure $cond').$cond,
      'counter update needs failure $cond'
    );
    const expiry = asArray(
      asRecord(failures[0], 'counter update needs expiry $or').$or,
      'counter update needs expiry $or'
    );
    assert.deepEqual(expiry, [
      { $eq: [{ $type: '$windowStartedAt' }, 'missing'] },
      {
        $lte: [
          '$windowStartedAt',
          new Date(fixedNow.getTime() - 15 * 60_000),
        ],
      },
    ]);
  }
});

test('concurrent failures increment both counters without lost updates', async (t) => {
  const fixedNow = new Date('2026-07-10T03:15:00.000Z');
  t.mock.method(Date, 'now', () => fixedNow.getTime());
  const {
    LoginThrottle,
    createLoginThrottleKeys,
    loginThrottleService,
  } = await loadThrottleModules();
  const input = { source: '203.0.113.31', email: 'student@example.com' };
  const keys = createLoginThrottleKeys(input, process.env.NEXTAUTH_SECRET!);
  const harness = installThrottleHarness(t, LoginThrottle);

  await Promise.all(
    Array.from({ length: 4 }, () => loginThrottleService.recordFailure(input))
  );

  assert.equal(harness.get(keys.pairKey)?.failures, 4);
  assert.equal(harness.get(keys.sourceKey)?.failures, 4);
  assert.equal(harness.writes.length, 8);
});

test('pair and source thresholds map to exactly five and twenty failures', async (t) => {
  const fixedNow = new Date('2026-07-10T03:30:00.000Z');
  t.mock.method(Date, 'now', () => fixedNow.getTime());
  const {
    LoginThrottle,
    createLoginThrottleKeys,
    loginThrottleService,
  } = await loadThrottleModules();
  const input = { source: '203.0.113.32', email: 'student@example.com' };
  const keys = createLoginThrottleKeys(input, process.env.NEXTAUTH_SECRET!);
  const startedAt = new Date(fixedNow.getTime() - 1);
  const expiresAt = new Date(fixedNow.getTime() + 30 * 60_000);
  const harness = installThrottleHarness(t, LoginThrottle, [
    { _id: keys.pairKey, failures: 4, windowStartedAt: startedAt, expiresAt },
    { _id: keys.sourceKey, failures: 19, windowStartedAt: startedAt, expiresAt },
  ]);

  assert.equal(await loginThrottleService.isBlocked(input), false);
  harness.documents.set(keys.pairKey, {
    _id: keys.pairKey,
    failures: 5,
    windowStartedAt: startedAt,
    expiresAt,
  });
  harness.documents.set(keys.sourceKey, {
    _id: keys.sourceKey,
    failures: 5,
    windowStartedAt: startedAt,
    expiresAt,
  });
  assert.equal(await loginThrottleService.isBlocked(input), true);

  harness.documents.set(keys.pairKey, {
    _id: keys.pairKey,
    failures: 0,
    windowStartedAt: startedAt,
    expiresAt,
  });
  assert.equal(await loginThrottleService.isBlocked(input), false);
  harness.documents.set(keys.sourceKey, {
    _id: keys.sourceKey,
    failures: 20,
    windowStartedAt: startedAt,
    expiresAt,
  });
  assert.equal(await loginThrottleService.isBlocked(input), true);
});

test('an already-blocked request performs no write and cannot extend expiry', async (t) => {
  const fixedNow = new Date('2026-07-10T03:45:00.000Z');
  t.mock.method(Date, 'now', () => fixedNow.getTime());
  const {
    LoginThrottle,
    createLoginThrottleKeys,
    loginThrottleService,
  } = await loadThrottleModules();
  const input = { source: '203.0.113.33', email: 'student@example.com' };
  const keys = createLoginThrottleKeys(input, process.env.NEXTAUTH_SECRET!);
  const originalExpiry = new Date(fixedNow.getTime() + 10_000);
  const harness = installThrottleHarness(t, LoginThrottle, [
    {
      _id: keys.pairKey,
      failures: 5,
      windowStartedAt: new Date(fixedNow.getTime() - 1),
      expiresAt: originalExpiry,
    },
  ]);

  await loginThrottleService.recordFailure(input);

  assert.equal(harness.writes.length, 0);
  assert.equal(harness.get(keys.pairKey)?.expiresAt.getTime(), originalExpiry.getTime());
  assert.equal(harness.get(keys.pairKey)?.failures, 5);
});

test('the exact observation-window boundary is expired and resets on failure', async (t) => {
  const fixedNow = new Date('2026-07-10T04:00:00.000Z');
  t.mock.method(Date, 'now', () => fixedNow.getTime());
  const {
    LoginThrottle,
    createLoginThrottleKeys,
    loginThrottleService,
  } = await loadThrottleModules();
  const input = { source: '203.0.113.34', email: 'student@example.com' };
  const keys = createLoginThrottleKeys(input, process.env.NEXTAUTH_SECRET!);
  const boundary = new Date(fixedNow.getTime() - 15 * 60_000);
  const expiresAt = new Date(fixedNow.getTime() + 60_000);
  const harness = installThrottleHarness(t, LoginThrottle, [
    { _id: keys.pairKey, failures: 50, windowStartedAt: boundary, expiresAt },
    { _id: keys.sourceKey, failures: 50, windowStartedAt: boundary, expiresAt },
  ]);

  assert.equal(await loginThrottleService.isBlocked(input), false);
  await loginThrottleService.recordFailure(input);

  assert.equal(harness.get(keys.pairKey)?.failures, 1);
  assert.equal(harness.get(keys.sourceKey)?.failures, 1);
  assert.equal(harness.get(keys.pairKey)?.windowStartedAt.getTime(), fixedNow.getTime());
  assert.equal(harness.get(keys.sourceKey)?.windowStartedAt.getTime(), fixedNow.getTime());
});

test('a blocked attacker source does not block another source for the same email', async (t) => {
  const fixedNow = new Date('2026-07-10T04:15:00.000Z');
  t.mock.method(Date, 'now', () => fixedNow.getTime());
  const {
    LoginThrottle,
    createLoginThrottleKeys,
    loginThrottleService,
  } = await loadThrottleModules();
  const email = 'student@example.com';
  const attacker = { source: 'attacker', email };
  const victim = { source: 'victim', email };
  const attackerKeys = createLoginThrottleKeys(
    attacker,
    process.env.NEXTAUTH_SECRET!
  );
  const startedAt = new Date(fixedNow.getTime() - 1);
  const expiresAt = new Date(fixedNow.getTime() + 30 * 60_000);
  installThrottleHarness(t, LoginThrottle, [
    {
      _id: attackerKeys.pairKey,
      failures: 5,
      windowStartedAt: startedAt,
      expiresAt,
    },
    {
      _id: attackerKeys.sourceKey,
      failures: 20,
      windowStartedAt: startedAt,
      expiresAt,
    },
  ]);

  assert.equal(await loginThrottleService.isBlocked(attacker), true);
  assert.equal(await loginThrottleService.isBlocked(victim), false);
});

test('clearPair deletes only the pair key and preserves source-wide state', async (t) => {
  const fixedNow = new Date('2026-07-10T04:30:00.000Z');
  t.mock.method(Date, 'now', () => fixedNow.getTime());
  const {
    LoginThrottle,
    createLoginThrottleKeys,
    loginThrottleService,
  } = await loadThrottleModules();
  const input = { source: '203.0.113.35', email: 'student@example.com' };
  const keys = createLoginThrottleKeys(input, process.env.NEXTAUTH_SECRET!);
  const document = {
    failures: 2,
    windowStartedAt: fixedNow,
    expiresAt: new Date(fixedNow.getTime() + 30 * 60_000),
  };
  const harness = installThrottleHarness(t, LoginThrottle, [
    { _id: keys.sourceKey, ...document },
    { _id: keys.pairKey, ...document },
  ]);

  await loginThrottleService.clearPair(input);

  assert.deepEqual(harness.deletes, [{ _id: keys.pairKey }]);
  assert.equal(harness.get(keys.pairKey), undefined);
  assert.equal(harness.get(keys.sourceKey)?.failures, 2);
});

test('model and service barrels expose the shared throttle components', async () => {
  const [modelsIndex, servicesIndex] = await Promise.all([
    readFile(new URL('../src/models/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/services/index.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(modelsIndex, /LoginThrottle/);
  assert.match(servicesIndex, /loginThrottleService/);
  assert.match(servicesIndex, /createLoginThrottleKeys/);
});
