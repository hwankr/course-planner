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

  return Feedback.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).populate('userId', 'email name');
}

export const feedbackService = {
  create,
  findAll,
  updateStatus,
};
