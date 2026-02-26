/**
 * Environment Variable Validation
 * @api-separable
 * @migration-notes 분리 시 백엔드에서도 동일한 검증 사용
 */

import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI 환경변수를 설정해주세요.'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET 환경변수를 설정해주세요.'),
  NEXTAUTH_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID 환경변수를 설정해주세요.'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET 환경변수를 설정해주세요.'),
});

export const env = envSchema.parse(process.env);
