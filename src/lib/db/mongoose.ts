/**
 * MongoDB Connection Module
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 lib/db/mongoose.ts로 이동
 */

// NOTE: MongoDB Atlas 클러스터는 Seoul 리전 (ap-northeast-2) 권장
// Vercel icn1 리전과의 최소 지연시간을 위해

import mongoose from 'mongoose';
import { env } from '@/lib/env';

const MONGODB_URI = env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// 전역 캐시 (개발 모드에서 Hot Reload 시 연결 재사용)
declare global {
  // var is required for global declarations in Next.js
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * MongoDB 연결을 가져오거나 새로 생성합니다.
 * 개발 모드에서는 연결을 캐시하여 Hot Reload 시 재사용합니다.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
