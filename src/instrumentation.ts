export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { connectDB } = await import('@/lib/db/mongoose');
      await connectDB();
      console.log('MongoDB 사전 연결 완료');
    } catch (error) {
      console.error('MongoDB 사전 연결 실패:', error);
    }
  }
}
