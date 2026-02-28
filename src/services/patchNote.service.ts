/**
 * PatchNote Service
 * @api-separable
 * @migration-notes 분리 시 백엔드 프로젝트의 services/patchNote.service.ts로 이동
 */

import { connectDB } from '@/lib/db/mongoose';
import { PatchNote } from '@/models/PatchNote';
import { PatchNoteRead } from '@/models/PatchNoteRead';
import type { IPatchNoteDocument } from '@/models/PatchNote';

interface CreatePatchNoteInput {
  title: string;
  content: string;
  version?: string;
  status?: 'draft' | 'published';
}

interface PatchNoteFilter {
  status?: 'draft' | 'published';
}

/**
 * 업데이트 소식 생성 (관리자)
 */
async function create(
  data: CreatePatchNoteInput,
  createdBy: string
): Promise<IPatchNoteDocument> {
  await connectDB();

  const patchNoteData: Record<string, unknown> = {
    title: data.title,
    content: data.content,
    createdBy,
  };

  if (data.version) {
    patchNoteData.version = data.version;
  }

  if (data.status) {
    patchNoteData.status = data.status;
    if (data.status === 'published') {
      patchNoteData.publishedAt = new Date();
    }
  }

  const patchNote = await PatchNote.create(patchNoteData);
  return patchNote;
}

/**
 * 업데이트 소식 목록 조회 (관리자: 전체, 필터 가능)
 */
async function findAll(filter?: PatchNoteFilter): Promise<IPatchNoteDocument[]> {
  await connectDB();

  const conditions: Record<string, unknown> = {};

  if (filter?.status) {
    conditions.status = filter.status;
  }

  return PatchNote.find(conditions)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * 업데이트 소식 단건 조회
 */
async function findById(id: string): Promise<IPatchNoteDocument | null> {
  await connectDB();
  return PatchNote.findById(id)
    .populate('createdBy', 'name email')
    .lean();
}

/**
 * 업데이트 소식 수정 (관리자)
 */
async function update(
  id: string,
  data: Partial<CreatePatchNoteInput>
): Promise<IPatchNoteDocument | null> {
  await connectDB();

  const updateFields: Record<string, unknown> = {};

  if (data.title !== undefined) updateFields.title = data.title;
  if (data.content !== undefined) updateFields.content = data.content;
  if (data.version !== undefined) updateFields.version = data.version;
  if (data.status !== undefined) {
    updateFields.status = data.status;
    if (data.status === 'published') {
      updateFields.publishedAt = new Date();
    }
  }

  return PatchNote.findByIdAndUpdate(id, updateFields, { new: true })
    .populate('createdBy', 'name email');
}

/**
 * 업데이트 소식 발행 (draft → published)
 */
async function publish(id: string): Promise<IPatchNoteDocument | null> {
  await connectDB();
  return PatchNote.findByIdAndUpdate(
    id,
    { status: 'published', publishedAt: new Date() },
    { new: true }
  ).populate('createdBy', 'name email');
}

/**
 * 업데이트 소식 삭제 (관리자) + PatchNoteRead cascade 삭제
 */
async function deleteById(id: string): Promise<boolean> {
  await connectDB();
  const result = await PatchNote.findByIdAndDelete(id);
  if (result) {
    await PatchNoteRead.deleteMany({ patchNoteId: id });
  }
  return !!result;
}

/**
 * 발행된 업데이트 소식 목록 (사용자용)
 */
async function findPublished(limit = 20): Promise<IPatchNoteDocument[]> {
  await connectDB();
  return PatchNote.find({ status: 'published' })
    .populate('createdBy', 'name email')
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();
}

/**
 * 사용자의 미읽음 업데이트 소식 수
 */
async function getUnreadCountForUser(userId: string): Promise<number> {
  await connectDB();

  const readIds = await PatchNoteRead.find({ userId })
    .select('patchNoteId')
    .lean();

  const readPatchNoteIds = readIds.map((r) => r.patchNoteId);

  return PatchNote.countDocuments({
    status: 'published',
    _id: { $nin: readPatchNoteIds },
  });
}

/**
 * 단건 읽음 처리 (upsert)
 */
async function markAsRead(userId: string, patchNoteId: string): Promise<void> {
  await connectDB();
  await PatchNoteRead.updateOne(
    { userId, patchNoteId },
    { userId, patchNoteId, readAt: new Date() },
    { upsert: true }
  );
}

/**
 * 모든 미읽음 업데이트 소식 읽음 처리
 */
async function markAllAsRead(userId: string): Promise<void> {
  await connectDB();

  const readIds = await PatchNoteRead.find({ userId })
    .select('patchNoteId')
    .lean();

  const readPatchNoteIds = readIds.map((r) => r.patchNoteId);

  const unreadNotes = await PatchNote.find({
    status: 'published',
    _id: { $nin: readPatchNoteIds },
  })
    .select('_id')
    .lean();

  if (unreadNotes.length > 0) {
    const docs = unreadNotes.map((note: { _id: unknown }) => ({
      userId,
      patchNoteId: note._id,
      readAt: new Date(),
    }));

    await PatchNoteRead.insertMany(docs, { ordered: false }).catch(() => {
      // Ignore duplicate key errors from concurrent inserts
    });
  }
}

/**
 * 사용자의 모든 읽음 기록 삭제 (회원 탈퇴 시 cascade용)
 */
async function deleteAllReadsByUser(userId: string): Promise<number> {
  await connectDB();
  const result = await PatchNoteRead.deleteMany({ userId });
  return result.deletedCount;
}

export const patchNoteService = {
  create,
  findAll,
  findById,
  update,
  publish,
  deleteById,
  findPublished,
  getUnreadCountForUser,
  markAsRead,
  markAllAsRead,
  deleteAllReadsByUser,
};
