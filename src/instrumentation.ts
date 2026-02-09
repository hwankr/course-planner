import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');

    try {
      const { connectDB } = await import('@/lib/db/mongoose');
      await connectDB();
      console.log('MongoDB 사전 연결 완료');
    } catch (error) {
      console.error('MongoDB 사전 연결 실패:', error);
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;