/**
 * Login Throttle Service
 * @api-separable
 * @migration-notes Move with services/models when the API is separated.
 */

import { createHmac } from 'node:crypto';
import { connectDB } from '@/lib/db/mongoose';
import { env } from '@/lib/env';
import LoginThrottle, { type ILoginThrottle } from '@/models/LoginThrottle';

export const LOGIN_THROTTLE_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_THROTTLE_PAIR_LIMIT = 5;
export const LOGIN_THROTTLE_SOURCE_LIMIT = 20;

export interface LoginThrottleInput {
  source: string;
  email: string;
}

export interface LoginThrottleKeys {
  sourceKey: string;
  pairKey: string;
}

function digest(scope: 'source' | 'pair', value: string, secret: string): string {
  return `${scope}:${createHmac('sha256', secret)
    .update(`v1:${scope}:${value}`)
    .digest('base64url')}`;
}

export function createLoginThrottleKeys(
  input: LoginThrottleInput,
  secret: string
): LoginThrottleKeys {
  const source = input.source.trim();
  const email = input.email.trim().toLowerCase();

  return {
    sourceKey: digest('source', source, secret),
    pairKey: digest('pair', `${source}\0${email}`, secret),
  };
}

function isActive(
  record: Pick<ILoginThrottle, 'windowStartedAt'>,
  cutoff: Date
): boolean {
  return record.windowStartedAt.getTime() > cutoff.getTime();
}

async function areKeysBlocked(
  keys: LoginThrottleKeys,
  now: Date
): Promise<boolean> {
  const records = await LoginThrottle.find({
    _id: { $in: [keys.sourceKey, keys.pairKey] },
  }).lean();
  const byId = new Map(records.map((record) => [record._id, record]));
  const cutoff = new Date(now.getTime() - LOGIN_THROTTLE_WINDOW_MS);
  const sourceRecord = byId.get(keys.sourceKey);
  const pairRecord = byId.get(keys.pairKey);

  const sourceBlocked =
    sourceRecord !== undefined &&
    isActive(sourceRecord, cutoff) &&
    sourceRecord.failures >= LOGIN_THROTTLE_SOURCE_LIMIT;
  const pairBlocked =
    pairRecord !== undefined &&
    isActive(pairRecord, cutoff) &&
    pairRecord.failures >= LOGIN_THROTTLE_PAIR_LIMIT;

  return sourceBlocked || pairBlocked;
}

async function incrementKey(key: string, now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - LOGIN_THROTTLE_WINDOW_MS);
  const expired = {
    $or: [
      { $eq: [{ $type: '$windowStartedAt' }, 'missing'] },
      { $lte: ['$windowStartedAt', cutoff] },
    ],
  };

  await LoginThrottle.findOneAndUpdate(
    { _id: key },
    [
      {
        $set: {
          failures: {
            $cond: [
              expired,
              1,
              { $add: [{ $ifNull: ['$failures', 0] }, 1] },
            ],
          },
          windowStartedAt: {
            $cond: [expired, now, '$windowStartedAt'],
          },
          expiresAt: new Date(
            now.getTime() + LOGIN_THROTTLE_WINDOW_MS * 2
          ),
        },
      },
    ],
    { upsert: true, new: true, updatePipeline: true }
  );
}

async function isBlocked(input: LoginThrottleInput): Promise<boolean> {
  await connectDB();
  const keys = createLoginThrottleKeys(input, env.NEXTAUTH_SECRET);
  return areKeysBlocked(keys, new Date(Date.now()));
}

async function recordFailure(input: LoginThrottleInput): Promise<void> {
  await connectDB();
  const now = new Date(Date.now());
  const keys = createLoginThrottleKeys(input, env.NEXTAUTH_SECRET);

  if (await areKeysBlocked(keys, now)) return;

  await Promise.all([
    incrementKey(keys.sourceKey, now),
    incrementKey(keys.pairKey, now),
  ]);
}

async function clearPair(input: LoginThrottleInput): Promise<void> {
  await connectDB();
  const { pairKey } = createLoginThrottleKeys(input, env.NEXTAUTH_SECRET);
  await LoginThrottle.deleteOne({ _id: pairKey });
}

export const loginThrottleService = {
  isBlocked,
  recordFailure,
  clearPair,
};
