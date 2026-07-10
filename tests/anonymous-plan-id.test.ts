import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const planId = '64b000000000000000000001';
const otherPlanId = '64b000000000000000000002';
const departmentId = '64b000000000000000000010';
const otherDepartmentId = '64b000000000000000000011';
const secret = 'stable-shared-secret';

async function loadAnonymousPlanId() {
  try {
    return await import('../src/lib/security/anonymous-plan-id');
  } catch (error) {
    assert.fail(`anonymous plan ID utility is unavailable: ${String(error)}`);
  }
}

test('anonymous plan ids are deterministic and opaque across independent calls', async () => {
  const { createAnonymousPlanId } = await loadAnonymousPlanId();

  const firstInstanceId = createAnonymousPlanId(planId, departmentId, secret);
  const restartedInstanceId = createAnonymousPlanId(planId, departmentId, secret);

  assert.equal(firstInstanceId, restartedInstanceId);
  assert.match(firstInstanceId, /^v1\.[A-Za-z0-9_-]{43}$/);
  assert.equal(firstInstanceId.includes(planId), false);
});

test('anonymous plan ids are bound to the plan, department, and shared secret', async () => {
  const { createAnonymousPlanId } = await loadAnonymousPlanId();
  const base = createAnonymousPlanId(planId, departmentId, secret);

  assert.notEqual(base, createAnonymousPlanId(otherPlanId, departmentId, secret));
  assert.notEqual(base, createAnonymousPlanId(planId, otherDepartmentId, secret));
  assert.notEqual(base, createAnonymousPlanId(planId, departmentId, 'rotated-secret'));
});

test('detail resolution works without cache state and rejects tampering or another department', async () => {
  const { createAnonymousPlanId, resolveAnonymousPlanId } =
    await loadAnonymousPlanId();
  const anonymousId = createAnonymousPlanId(planId, departmentId, secret);
  const tamperedId = `${anonymousId.slice(0, -1)}${anonymousId.endsWith('A') ? 'B' : 'A'}`;

  assert.equal(
    resolveAnonymousPlanId(
      [otherPlanId, planId],
      anonymousId,
      departmentId,
      secret
    ),
    planId
  );
  assert.equal(
    resolveAnonymousPlanId([planId], tamperedId, departmentId, secret),
    null
  );
  assert.equal(
    resolveAnonymousPlanId([planId], anonymousId, otherDepartmentId, secret),
    null
  );
  assert.equal(
    resolveAnonymousPlanId([planId], 'malformed-id', departmentId, secret),
    null
  );
});

test('statistics service no longer depends on random UUID mappings or a warm list cache', async () => {
  const source = await readFile(
    new URL('../src/services/statistics.service.ts', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(source, /randomUUID/);
  assert.doesNotMatch(source, /idMapping/);
  assert.match(source, /createAnonymousPlanId/);
  assert.match(source, /resolveAnonymousPlanId/);
  assert.doesNotMatch(source, /If plans cache expired/);
  assert.doesNotMatch(source, /plansCache\.idMapping/);
});
