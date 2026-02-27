/**
 * NextAuth Type Extensions
 */

import 'next-auth';
import type { UserRole, MajorType } from '@/types';

declare module 'next-auth' {
  interface User {
    id: string;
    role?: UserRole;
    department?: string;
    onboardingCompleted?: boolean;
    majorType?: MajorType;
    secondaryDepartment?: string;
    curriculumYear?: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role?: UserRole;
      department?: string;
      onboardingCompleted?: boolean;
      majorType?: MajorType;
      secondaryDepartment?: string;
      curriculumYear?: number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: UserRole;
    department?: string;
    onboardingCompleted?: boolean;
    majorType?: MajorType;
    secondaryDepartment?: string;
    curriculumYear?: number;
  }
}
