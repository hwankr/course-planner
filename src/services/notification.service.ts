/**
 * Notification Service
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 services/notification.service.ts로 이동
 */

import { connectDB } from '@/lib/db/mongoose';
import { Feedback } from '@/models/Feedback';

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  href: string;
  createdAt: string;
}

/**
 * 알림 목록 조회 (역할에 따라 다른 알림 반환)
 */
async function getNotifications(userId: string, role: string): Promise<NotificationItem[]> {
  await connectDB();

  if (role === 'admin') {
    const feedbacks = await Feedback.find({ isReadByAdmin: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('message createdAt category')
      .lean();

    return feedbacks.map((fb: any) => ({
      id: fb._id.toString(),
      type: 'feedback-new',
      message: `새로운 ${fb.category === 'contact' ? '문의' : '피드백'}이 등록되었습니다.`,
      href: '/admin/feedback',
      createdAt: fb.createdAt.toISOString(),
    }));
  } else {
    const feedbacks = await Feedback.find({ userId, isReadByUser: false, adminReply: { $exists: true, $ne: null } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('updatedAt')
      .lean();

    return feedbacks.map((fb: any) => ({
      id: fb._id.toString(),
      type: 'feedback-reply',
      message: '문의에 답변이 달렸습니다.',
      href: '/help/feedback',
      createdAt: fb.updatedAt.toISOString(),
    }));
  }
}

/**
 * 모든 알림 읽음 처리
 */
async function markAllAsRead(userId: string, role: string): Promise<void> {
  await connectDB();

  if (role === 'admin') {
    await Feedback.updateMany(
      { isReadByAdmin: false },
      { isReadByAdmin: true }
    );
  } else {
    await Feedback.updateMany(
      { userId, isReadByUser: false },
      { isReadByUser: true }
    );
  }
}

export const notificationService = {
  getNotifications,
  markAllAsRead,
};
