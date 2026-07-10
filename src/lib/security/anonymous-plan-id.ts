import { createHmac, timingSafeEqual } from 'node:crypto';

const VERSION = 'v1';
const DIGEST_LENGTH = 32;
const ID_PATTERN = /^v1\.([A-Za-z0-9_-]{43})$/;

function digestPlanId(
  planId: string,
  departmentId: string,
  secret: string
): Buffer {
  if (!secret) {
    throw new Error('Anonymous plan ID secret is required');
  }

  return createHmac('sha256', secret)
    .update(VERSION)
    .update('\0')
    .update(departmentId)
    .update('\0')
    .update(planId)
    .digest();
}

export function createAnonymousPlanId(
  planId: string,
  departmentId: string,
  secret: string
): string {
  const digest = digestPlanId(planId, departmentId, secret);
  return `${VERSION}.${digest.toString('base64url')}`;
}

export function resolveAnonymousPlanId(
  planIds: readonly string[],
  anonymousId: string,
  departmentId: string,
  secret: string
): string | null {
  const match = ID_PATTERN.exec(anonymousId);
  if (!match) return null;

  const suppliedDigest = Buffer.from(match[1], 'base64url');
  if (suppliedDigest.length !== DIGEST_LENGTH) return null;

  for (const planId of planIds) {
    const expectedDigest = digestPlanId(planId, departmentId, secret);
    if (timingSafeEqual(suppliedDigest, expectedDigest)) {
      return planId;
    }
  }

  return null;
}
