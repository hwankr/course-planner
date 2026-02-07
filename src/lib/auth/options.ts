/**
 * NextAuth Configuration
 * @migration-notes 분리 시 별도 JWT 인증으로 변환 필요
 *                  userService는 재사용 가능
 */

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import type { MajorType } from '@/types';
import { userService } from '@/services';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.');
        }

        const user = await userService.findByEmailWithPassword(credentials.email);
        if (!user) {
          throw new Error('등록되지 않은 이메일입니다.');
        }

        if (!user.password) {
          throw new Error('Google 계정으로 가입된 사용자입니다. Google 로그인을 이용해주세요.');
        }

        const isValid = await userService.verifyPassword(
          credentials.password,
          user.password
        );
        if (!isValid) {
          throw new Error('비밀번호가 일치하지 않습니다.');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          department: user.department?.toString(),
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
          majorType: user.majorType,
          secondaryDepartment: user.secondaryDepartment?.toString(),
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await userService.findOrCreateOAuthUser(
            user.email!,
            user.name!,
            user.image || undefined
          );
          return true;
        } catch (error) {
          console.error('OAuth sign in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        if (account?.provider === 'google') {
          const dbUser = await userService.findByEmail(user.email!);
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.department = dbUser.department?.toString();
            // Auto-migrate existing users with department
            if (dbUser.department && !dbUser.onboardingCompleted) {
              await userService.update(dbUser._id.toString(), { onboardingCompleted: true });
              dbUser.onboardingCompleted = true;
            }
            token.onboardingCompleted = dbUser.onboardingCompleted ?? false;
            token.majorType = dbUser.majorType;
            token.secondaryDepartment = dbUser.secondaryDepartment?.toString();
          }
        } else {
          token.id = user.id;
          token.role = user.role;
          token.department = user.department;
          // Auto-migrate existing users with department
          if (user.department && !user.onboardingCompleted) {
            await userService.update(user.id, { onboardingCompleted: true });
            token.onboardingCompleted = true;
          } else {
            token.onboardingCompleted = user.onboardingCompleted ?? false;
          }
          token.majorType = user.majorType;
          token.secondaryDepartment = user.secondaryDepartment;
        }
      } else if (trigger === 'update') {
        // Session refresh: re-fetch from DB to get updated department
        const dbUser = await userService.findByEmail(token.email as string);
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.department = dbUser.department?.toString();
          // Auto-migrate existing users with department
          if (dbUser.department && !dbUser.onboardingCompleted) {
            await userService.update(dbUser._id.toString(), { onboardingCompleted: true });
            dbUser.onboardingCompleted = true;
          }
          token.onboardingCompleted = dbUser.onboardingCompleted ?? false;
          token.majorType = dbUser.majorType;
          token.secondaryDepartment = dbUser.secondaryDepartment?.toString();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.department = token.department;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
        session.user.majorType = token.majorType as MajorType | undefined;
        session.user.secondaryDepartment = token.secondaryDepartment as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
