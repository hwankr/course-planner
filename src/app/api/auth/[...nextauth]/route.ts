/**
 * NextAuth API Route
 * @api-separable
 * @endpoint /api/auth/*
 * @migration-notes 분리 시 삭제, 별도 JWT 인증 서버로 대체
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
