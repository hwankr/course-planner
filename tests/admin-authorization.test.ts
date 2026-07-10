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

const adminId = '64b000000000000000000001';

async function loadAdminAuthorization() {
  try {
    return await Promise.all([
      import('../src/models/User'),
      import('../src/services/admin-auth.service'),
      import('../src/lib/auth/admin-session'),
    ]);
  } catch (error) {
    assert.fail(`administrator authorization modules are unavailable: ${String(error)}`);
  }
}

test('active administrator lookup requires the current database role', async (t) => {
  const [{ default: User }, { adminAuthService }] = await loadAdminAuthorization();
  const userModel = User as unknown as {
    exists(filter: Record<string, unknown>): Promise<{ _id: string } | null>;
  };
  const filters: Record<string, unknown>[] = [];

  t.mock.method(userModel, 'exists', async (filter: Record<string, unknown>) => {
    filters.push(filter);
    return { _id: adminId };
  });

  assert.equal(await adminAuthService.isActiveAdmin(adminId), true);
  assert.deepEqual(filters, [{ _id: adminId, role: 'admin' }]);
});

test('demoted or deleted administrators are rejected despite a stale session role', async (t) => {
  const [{ default: User }, { adminAuthService }, { isActiveAdminSession }] =
    await loadAdminAuthorization();
  const userModel = User as unknown as {
    exists(filter: Record<string, unknown>): Promise<{ _id: string } | null>;
  };

  t.mock.method(userModel, 'exists', async () => null);

  const staleAdminSession = {
    user: {
      id: adminId,
      role: 'admin' as const,
      name: 'Former admin',
      email: 'former-admin@example.com',
    },
    expires: new Date(Date.now() + 60_000).toISOString(),
  };

  assert.equal(await adminAuthService.isActiveAdmin(adminId), false);
  assert.equal(await isActiveAdminSession(staleAdminSession), false);
});

test('malformed user ids are denied without querying MongoDB', async (t) => {
  const [{ default: User }, { adminAuthService }] = await loadAdminAuthorization();
  const userModel = User as unknown as {
    exists(filter: Record<string, unknown>): Promise<{ _id: string } | null>;
  };
  let queryCount = 0;

  t.mock.method(userModel, 'exists', async () => {
    queryCount += 1;
    return { _id: adminId };
  });

  assert.equal(await adminAuthService.isActiveAdmin('not-an-object-id'), false);
  assert.equal(queryCount, 0);
});

const privilegedRouteFiles = [
  'src/app/api/academic-events/[id]/route.ts',
  'src/app/api/academic-events/route.ts',
  'src/app/api/admin/requirements/[id]/route.ts',
  'src/app/api/admin/requirements/route.ts',
  'src/app/api/admin/seed-academic-events/route.ts',
  'src/app/api/admin/seed-common-courses/route.ts',
  'src/app/api/admin/stats/route.ts',
  'src/app/api/admin/users/[id]/plan/route.ts',
  'src/app/api/admin/users/[id]/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/courses/[id]/route.ts',
  'src/app/api/departments/[id]/route.ts',
  'src/app/api/departments/route.ts',
  'src/app/api/feedback/[id]/route.ts',
  'src/app/api/feedback/route.ts',
  'src/app/api/feedback/unread-count/route.ts',
  'src/app/api/notifications/mark-read/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/notifications/unread-count/route.ts',
  'src/app/api/patch-notes/[id]/publish/route.ts',
  'src/app/api/patch-notes/[id]/route.ts',
  'src/app/api/patch-notes/route.ts',
  'src/app/api/requirements/route.ts',
] as const;

test('every privileged API role branch uses the database-backed shared guard', async () => {
  for (const file of privilegedRouteFiles) {
    const source = await readFile(resolve(process.cwd(), file), 'utf8');
    assert.match(source, /isActiveAdminSession/, `${file} must use the shared guard`);
    assert.doesNotMatch(
      source,
      /session\.user\.role/,
      `${file} must not trust the JWT role directly`
    );
  }
});
