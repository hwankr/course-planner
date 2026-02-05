/**
 * MongoDB Connection Module
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 lib/db/mongoose.ts로 이동
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI 환경변수를 설정해주세요.');
}

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
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('MongoDB 연결 성공');
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
