/**
 * @api-separable
 * @endpoint GET /api/health
 * @service N/A (DB 연결 확인용)
 * @migration-notes Express 변환 시: app.get('/api/health', ...)
 */

import { connectDB } from '@/lib/db/mongoose';

export async function GET() {
  try {
    await connectDB();
    return Response.json({ status: 'ok' });
  } catch {
    return Response.json({ status: 'error' }, { status: 503 });
  }
}
