/**
 * User Security Errors
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 services/user-security.error.ts로 이동
 */

export type UserSecurityErrorCode =
  | 'LAST_ADMIN'
  | 'SELF_DELETE'
  | 'USER_NOT_FOUND'
  | 'TRANSACTIONS_UNAVAILABLE';

export class UserSecurityError extends Error {
  constructor(
    public readonly code: UserSecurityErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'UserSecurityError';
  }
}

const TRANSACTION_UNAVAILABLE_MESSAGE =
  /^Transaction numbers are only allowed on a replica set member or mongos\.?$/i;

export function isTransactionsUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as {
    code?: unknown;
    codeName?: unknown;
    message?: unknown;
  };
  if (candidate.code === 20 && candidate.codeName === 'IllegalOperation') {
    return true;
  }

  return (
    typeof candidate.message === 'string' &&
    TRANSACTION_UNAVAILABLE_MESSAGE.test(candidate.message.trim())
  );
}
