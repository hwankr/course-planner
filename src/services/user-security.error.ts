/**
 * User Security Errors
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 services/user-security.error.ts로 이동
 */

export class UserSecurityError extends Error {
  constructor(
    public readonly code: 'LAST_ADMIN' | 'SELF_DELETE' | 'USER_NOT_FOUND',
    message: string
  ) {
    super(message);
    this.name = 'UserSecurityError';
  }
}
