/**
 * Credential Authentication Service
 * @api-separable
 * @migration-notes Move with services/models when the API is separated.
 */

import bcrypt from 'bcryptjs';
import type { IUserDocument } from '@/models';
import {
  loginThrottleService,
  type LoginThrottleAdmission,
  type LoginThrottleInput,
  type LoginThrottleReservation,
} from './login-throttle.service';
import { userService } from './user.service';

export const DUMMY_PASSWORD_HASH =
  '$2b$12$Pi89zBOq/7QIWXDuIlN/QeyU3dGf6rPhLmPCusA09xZ7QgcKQkA6q';
export const MAX_CREDENTIAL_EMAIL_LENGTH = 320;
export const MAX_CREDENTIAL_PASSWORD_LENGTH = 1024;

export interface CredentialAuthenticationInput {
  email: unknown;
  password: unknown;
  source: string;
}

export interface AuthenticationDependencies {
  reserveAttempt(input: LoginThrottleInput): Promise<LoginThrottleAdmission>;
  findByEmailWithPassword(email: string): Promise<IUserDocument | null>;
  comparePassword(
    plainPassword: string,
    passwordHash: string
  ): Promise<boolean>;
  completeSuccessfulAttempt(
    reservation: LoginThrottleReservation
  ): Promise<void>;
}

function normalizeBoundedCredential(
  value: unknown,
  maximumLength: number,
  transform: (value: string) => string = (input) => input
): { value: string; withinLimit: boolean } {
  const normalized = transform(typeof value === 'string' ? value : '');
  return {
    value: normalized.slice(0, maximumLength),
    withinLimit: normalized.length <= maximumLength,
  };
}

export function createAuthenticationService(
  dependencies: AuthenticationDependencies
) {
  return {
    async authenticateCredentials(
      input: CredentialAuthenticationInput
    ): Promise<IUserDocument | null> {
      const emailInput = normalizeBoundedCredential(
        input.email,
        MAX_CREDENTIAL_EMAIL_LENGTH,
        (value) => value.trim().toLowerCase()
      );
      const passwordInput = normalizeBoundedCredential(
        input.password,
        MAX_CREDENTIAL_PASSWORD_LENGTH
      );
      const email = emailInput.value;
      const password = passwordInput.value;
      const throttleInput = { source: input.source, email };

      const admission = await dependencies.reserveAttempt(throttleInput);
      if (!admission.allowed) return null;

      const user = await dependencies.findByEmailWithPassword(email);
      const passwordMatches = await dependencies.comparePassword(
        password,
        user?.password ?? DUMMY_PASSWORD_HASH
      );

      if (
        !email ||
        !password ||
        !emailInput.withinLimit ||
        !passwordInput.withinLimit ||
        !user?.password ||
        !passwordMatches
      ) {
        return null;
      }

      await dependencies.completeSuccessfulAttempt(admission.reservation);
      return user;
    },
  };
}

export const authenticationService = createAuthenticationService({
  reserveAttempt: loginThrottleService.reserveAttempt,
  findByEmailWithPassword: userService.findByEmailWithPassword,
  comparePassword: bcrypt.compare,
  completeSuccessfulAttempt: loginThrottleService.completeSuccessfulAttempt,
});
