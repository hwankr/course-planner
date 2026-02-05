/**
 * NextAuth Type Extensions
 */

import 'next-auth';
import type { UserRole } from '@/types';

declare module 'next-auth' {
  interface User {
    id: string;
    role?: UserRole;
    department?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role?: UserRole;
      department?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: UserRole;
    department?: string;
  }
}
