/**
 * Notification Service
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 services/notification.service.ts로 이동
 */

import { connectDB } from '@/lib/db/mongoose';
import { Feedback } from '@/models/Feedback';
import { PatchNote } from '@/models/PatchNote';
import { PatchNoteRead } from '@/models/PatchNoteRead';
import { patchNoteService } from '@/services/patchNote.service';

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  href: string;
  createdAt: string;
}

/**
 * 피드백 알림 조회 (소스별 private 함수)
 */
async function getFeedbackNotifications(userId: string, role: string): Promise<NotificationItem[]> {
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
 * 업데이트 소식 알림 조회 (소스별 private 함수)
 */
async function getPatchNoteNotifications(userId: string): Promise<NotificationItem[]> {
  const readIds = await PatchNoteRead.find({ userId })
    .select('patchNoteId')
    .lean();

  const readPatchNoteIds = readIds.map((r) => r.patchNoteId);

  const unreadNotes = await PatchNote.find({
    status: 'published',
    _id: { $nin: readPatchNoteIds },
  })
    .sort({ publishedAt: -1 })
    .limit(20)
    .select('title publishedAt')
    .lean();

  return unreadNotes.map((note: any) => ({
    id: note._id.toString(),
    type: 'patch-note',
    message: `새로운 업데이트: ${note.title}`,
    href: `/patch-notes/${note._id.toString()}`,
    createdAt: note.publishedAt?.toISOString() || note.createdAt?.toISOString() || new Date().toISOString(),
  }));
}

/**
 * 알림 목록 조회 (역할에 따라 다른 알림 반환 + 업데이트 소식 통합)
 */
async function getNotifications(userId: string, role: string): Promise<NotificationItem[]> {
  await connectDB();

  const [feedbackItems, patchNoteItems] = await Promise.all([
    getFeedbackNotifications(userId, role),
    getPatchNoteNotifications(userId),
  ]);

  const merged = [...feedbackItems, ...patchNoteItems];
  merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return merged.slice(0, 20);
}

/**
 * 통합 미읽음 알림 수 조회
 */
async function getUnreadCount(userId: string, role: string): Promise<number> {
  await connectDB();

  const [feedbackCount, patchNoteCount] = await Promise.all([
    role === 'admin'
      ? Feedback.countDocuments({ isReadByAdmin: false })
      : Feedback.countDocuments({ userId, isReadByUser: false, adminReply: { $exists: true, $ne: null } }),
    patchNoteService.getUnreadCountForUser(userId),
  ]);

  return feedbackCount + patchNoteCount;
}

/**
 * 모든 알림 읽음 처리 (피드백 + 업데이트 소식)
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

  // 업데이트 소식도 모두 읽음 처리
  await patchNoteService.markAllAsRead(userId);
}

export const notificationService = {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
};
