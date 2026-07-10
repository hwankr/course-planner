/**
 * Database-backed administrator session verification.
 * A signed JWT proves the session identity, while the database remains the
 * source of truth for current administrator privileges.
 */

import type { Session } from 'next-auth';
import { adminAuthService } from '@/services/admin-auth.service';

export async function isActiveAdminSession(
  session: Session | null
): Promise<boolean> {
  if (!session?.user?.id) return false;
  return adminAuthService.isActiveAdmin(session.user.id);
}
