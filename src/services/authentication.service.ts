/**
 * Credential Authentication Service
 * @api-separable
 * @migration-notes Move with services/models when the API is separated.
 */

import bcrypt from 'bcryptjs';
import type { IUserDocument } from '@/models';
import { loginThrottleService } from './login-throttle.service';
import { userService } from './user.service';

export const DUMMY_PASSWORD_HASH =
  '$2b$12$Pi89zBOq/7QIWXDuIlN/QeyU3dGf6rPhLmPCusA09xZ7QgcKQkA6q';

export interface CredentialAuthenticationInput {
  email: unknown;
  password: unknown;
  source: string;
}

export interface AuthenticationDependencies {
  isBlocked(input: { source: string; email: string }): Promise<boolean>;
  findByEmailWithPassword(email: string): Promise<IUserDocument | null>;
  comparePassword(
    plainPassword: string,
    passwordHash: string
  ): Promise<boolean>;
  recordFailure(input: { source: string; email: string }): Promise<void>;
  clearPair(input: { source: string; email: string }): Promise<void>;
}

export function createAuthenticationService(
  dependencies: AuthenticationDependencies
) {
  return {
    async authenticateCredentials(
      input: CredentialAuthenticationInput
    ): Promise<IUserDocument | null> {
      const email =
        typeof input.email === 'string'
          ? input.email.trim().toLowerCase()
          : '';
      const password = typeof input.password === 'string' ? input.password : '';
      const throttleInput = { source: input.source, email };

      if (await dependencies.isBlocked(throttleInput)) return null;

      const user = await dependencies.findByEmailWithPassword(email);
      const passwordMatches = await dependencies.comparePassword(
        password,
        user?.password ?? DUMMY_PASSWORD_HASH
      );

      if (!email || !password || !user?.password || !passwordMatches) {
        await dependencies.recordFailure(throttleInput);
        return null;
      }

      await dependencies.clearPair(throttleInput);
      return user;
    },
  };
}

export const authenticationService = createAuthenticationService({
  isBlocked: loginThrottleService.isBlocked,
  findByEmailWithPassword: userService.findByEmailWithPassword,
  comparePassword: bcrypt.compare,
  recordFailure: loginThrottleService.recordFailure,
  clearPair: loginThrottleService.clearPair,
});
