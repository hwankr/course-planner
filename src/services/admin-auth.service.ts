/**
 * Administrator Authorization Service
 * @api-separable
 * @migration-notes Move with services/models when the API is separated.
 */

import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db/mongoose';
import User from '@/models/User';

async function isActiveAdmin(userId: string): Promise<boolean> {
  if (!isValidObjectId(userId)) return false;

  await connectDB();
  const administrator = await User.exists({ _id: userId, role: 'admin' });
  return administrator !== null;
}

export const adminAuthService = { isActiveAdmin };
