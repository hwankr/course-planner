/**
 * Feedback Service
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 services/feedback.service.ts로 이동
 */

import { connectDB } from '@/lib/db/mongoose';
import { Feedback } from '@/models/Feedback';
import type { IFeedbackDocument } from '@/models/Feedback';

interface CreateFeedbackInput {
  category: 'bug' | 'feature' | 'data-error' | 'other' | 'contact';
  message: string;
  email?: string;
  userId?: string;
}

interface FeedbackFilter {
  status?: 'pending' | 'resolved';
  category?: 'bug' | 'feature' | 'data-error' | 'other' | 'contact';
  limit?: number;
}

/**
 * 새 피드백 생성
 */
async function create(data: CreateFeedbackInput): Promise<IFeedbackDocument> {
  await connectDB();

  const feedbackData: Record<string, unknown> = {
    category: data.category,
    message: data.message,
  };

  if (data.email) {
    feedbackData.email = data.email;
  }

  if (data.userId) {
    feedbackData.userId = data.userId;
  }

  const feedback = await Feedback.create(feedbackData);
  return feedback;
}

/**
 * 피드백 목록 조회 (관리자용)
 */
async function findAll(filter?: FeedbackFilter): Promise<IFeedbackDocument[]> {
  await connectDB();

  const conditions: Record<string, unknown> = {};

  if (filter?.status) {
    conditions.status = filter.status;
  }

  if (filter?.category) {
    conditions.category = filter.category;
  }

  const limit = filter?.limit ?? 50;

  return Feedback.find(conditions)
    .populate('userId', 'email name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

/**
 * 피드백 상태 업데이트 (관리자용)
 */
async function updateStatus(
  id: string,
  status: 'pending' | 'resolved'
): Promise<IFeedbackDocument | null> {
  await connectDB();

  const updateFields: Record<string, unknown> = {
    status,
    isReadByAdmin: true,
  };

  if (status === 'resolved') {
    updateFields.isReadByUser = false;
  }

  return Feedback.findByIdAndUpdate(
    id,
    updateFields,
    { new: true }
  ).populate('userId', 'email name');
}

/**
 * 사용자 본인 문의 목록 조회
 */
async function findByUserId(userId: string): Promise<IFeedbackDocument[]> {
  await connectDB();
  return Feedback.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * 사용자 본인 문의 목록 조회 + 읽음 처리 (서비스 레이어 일괄)
 */
async function findByUserIdAndMarkRead(userId: string): Promise<IFeedbackDocument[]> {
  await connectDB();
  const feedbacks = await Feedback.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  await Feedback.updateMany(
    { userId, isReadByUser: false },
    { isReadByUser: true }
  );

  return feedbacks;
}

/**
 * 관리자 답변 작성 (자동 해결 처리)
 */
async function addAdminReply(
  id: string,
  reply: string
): Promise<IFeedbackDocument | null> {
  await connectDB();
  return Feedback.findByIdAndUpdate(
    id,
    {
      adminReply: reply,
      adminReplyAt: new Date(),
      status: 'resolved',
      isReadByUser: false,
      isReadByAdmin: true,
    },
    { new: true }
  ).populate('userId', 'email name');
}

/**
 * 관리자용 미읽음 문의 수
 */
async function getUnreadCountForAdmin(): Promise<number> {
  await connectDB();
  return Feedback.countDocuments({ isReadByAdmin: false });
}

/**
 * 사용자용 미읽음 답변 수
 */
async function getUnreadCountForUser(userId: string): Promise<number> {
  await connectDB();
  return Feedback.countDocuments({ userId, isReadByUser: false });
}

/**
 * 관리자 읽음 처리
 */
async function markAsReadByAdmin(ids: string[]): Promise<void> {
  await connectDB();
  await Feedback.updateMany(
    { _id: { $in: ids } },
    { isReadByAdmin: true }
  );
}

/**
 * 사용자 읽음 처리 (일괄)
 */
async function markAsReadByUser(userId: string): Promise<void> {
  await connectDB();
  await Feedback.updateMany(
    { userId, isReadByUser: false },
    { isReadByUser: true }
  );
}

/**
 * 관리자 목록 조회 + 읽음 처리 (서비스 레이어에서 일괄 처리)
 */
async function findAllAndMarkRead(filter?: FeedbackFilter): Promise<IFeedbackDocument[]> {
  await connectDB();

  const conditions: Record<string, unknown> = {};
  if (filter?.status) {
    conditions.status = filter.status;
  }
  if (filter?.category) {
    conditions.category = filter.category;
  }

  const limit = filter?.limit ?? 50;

  const feedbacks = await Feedback.find(conditions)
    .populate('userId', 'email name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadIds = feedbacks
    .filter((fb: any) => !fb.isReadByAdmin)
    .map((fb: any) => fb._id.toString());
  if (unreadIds.length > 0) {
    await Feedback.updateMany(
      { _id: { $in: unreadIds } },
      { isReadByAdmin: true }
    );
  }

  return feedbacks;
}

/**
 * 관리자 피드백 삭제
 */
async function deleteById(id: string): Promise<boolean> {
  await connectDB();
  const result = await Feedback.findByIdAndDelete(id);
  return !!result;
}

/**
 * 사용자 본인 피드백 삭제 (userId 일치 확인)
 */
async function deleteByUser(id: string, userId: string): Promise<boolean> {
  await connectDB();
  const result = await Feedback.findOneAndDelete({ _id: id, userId });
  return !!result;
}

export const feedbackService = {
  create,
  findAll,
  findAllAndMarkRead,
  findByUserId,
  findByUserIdAndMarkRead,
  updateStatus,
  addAdminReply,
  getUnreadCountForAdmin,
  getUnreadCountForUser,
  markAsReadByAdmin,
  markAsReadByUser,
  deleteById,
  deleteByUser,
};
