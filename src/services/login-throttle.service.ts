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

export interface LoginThrottleReservation extends LoginThrottleKeys {
  sourceWindowStartedAt: Date;
  pairWindowStartedAt: Date;
}

export type LoginThrottleAdmission =
  | { allowed: false }
  | { allowed: true; reservation: LoginThrottleReservation };

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

async function reserveKey(
  key: string,
  limit: number,
  now: Date
): Promise<ILoginThrottle> {
  const cutoff = new Date(now.getTime() - LOGIN_THROTTLE_WINDOW_MS);
  const newExpiry = new Date(
    now.getTime() + LOGIN_THROTTLE_WINDOW_MS * 2
  );
  const expired = {
    $or: [
      { $eq: [{ $type: '$windowStartedAt' }, 'missing'] },
      { $lte: ['$windowStartedAt', cutoff] },
    ],
  };

  const record = await LoginThrottle.findOneAndUpdate(
    { _id: key },
    [
      {
        $set: {
          failures: {
            $cond: [
              expired,
              1,
              {
                $min: [
                  { $add: [{ $ifNull: ['$failures', 0] }, 1] },
                  limit + 1,
                ],
              },
            ],
          },
          windowStartedAt: {
            $cond: [expired, now, '$windowStartedAt'],
          },
          expiresAt: {
            $cond: [expired, newExpiry, '$expiresAt'],
          },
        },
      },
    ],
    { upsert: true, returnDocument: 'after', updatePipeline: true }
  );

  if (!record) {
    throw new Error('Login throttle reservation failed');
  }

  return record;
}

async function reserveAttempt(
  input: LoginThrottleInput
): Promise<LoginThrottleAdmission> {
  await connectDB();
  const now = new Date(Date.now());
  const keys = createLoginThrottleKeys(input, env.NEXTAUTH_SECRET);
  const sourceRecord = await reserveKey(
    keys.sourceKey,
    LOGIN_THROTTLE_SOURCE_LIMIT,
    now
  );
  if (sourceRecord.failures > LOGIN_THROTTLE_SOURCE_LIMIT) {
    return { allowed: false };
  }

  const pairRecord = await reserveKey(
    keys.pairKey,
    LOGIN_THROTTLE_PAIR_LIMIT,
    now
  );
  if (pairRecord.failures > LOGIN_THROTTLE_PAIR_LIMIT) {
    return { allowed: false };
  }

  return {
    allowed: true,
    reservation: {
      ...keys,
      sourceWindowStartedAt: sourceRecord.windowStartedAt,
      pairWindowStartedAt: pairRecord.windowStartedAt,
    },
  };
}

async function completeSuccessfulAttempt(
  reservation: LoginThrottleReservation
): Promise<void> {
  await connectDB();
  const pairDeletion = await LoginThrottle.deleteOne({
    _id: reservation.pairKey,
    windowStartedAt: reservation.pairWindowStartedAt,
  });
  if (pairDeletion.deletedCount !== 1) return;

  await LoginThrottle.updateOne(
    {
      _id: reservation.sourceKey,
      windowStartedAt: reservation.sourceWindowStartedAt,
      failures: { $gt: 0 },
    },
    { $inc: { failures: -1 } }
  );
}

export const loginThrottleService = {
  reserveAttempt,
  completeSuccessfulAttempt,
};
