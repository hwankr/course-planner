/**
 * AcademicEvent Service (학사 일정)
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import { connectDB } from '@/lib/db/mongoose';
import { AcademicEvent } from '@/models';
import type { IAcademicEventDocument } from '@/models';
import type { CreateAcademicEventInput, AcademicEventFilter } from '@/types';

/**
 * 학사 일정 목록 조회 (필터 적용)
 * year/month가 제공되면 해당 월에 겹치는 모든 일정을 반환
 */
async function findAll(filter?: AcademicEventFilter): Promise<IAcademicEventDocument[]> {
  await connectDB();

  const conditions: Record<string, unknown>[] = [];

  if (filter?.year && filter?.month) {
    const startOfMonth = new Date(filter.year, filter.month - 1, 1);
    const endOfMonth = new Date(filter.year, filter.month, 0, 23, 59, 59, 999);

    // 해당 월에 겹치는 일정: startDate가 월 안에 있거나, endDate가 월 안에 있거나, 일정이 월 전체를 포함
    conditions.push({
      $or: [
        { startDate: { $gte: startOfMonth, $lte: endOfMonth } },
        { endDate: { $gte: startOfMonth, $lte: endOfMonth } },
        {
          $and: [
            { startDate: { $lte: startOfMonth } },
            { endDate: { $gte: endOfMonth } },
          ],
        },
      ],
    });
  } else if (filter?.year) {
    const startOfYear = new Date(filter.year, 0, 1);
    const endOfYear = new Date(filter.year, 11, 31, 23, 59, 59, 999);
    conditions.push({
      $or: [
        { startDate: { $gte: startOfYear, $lte: endOfYear } },
        { endDate: { $gte: startOfYear, $lte: endOfYear } },
      ],
    });
  }

  if (filter?.category) {
    conditions.push({ category: filter.category });
  }

  const query = conditions.length > 0 ? { $and: conditions } : {};

  return AcademicEvent.find(query)
    .sort({ startDate: 1 })
    .lean();
}

/**
 * ID로 학사 일정 조회
 */
async function findById(id: string): Promise<IAcademicEventDocument | null> {
  await connectDB();
  return AcademicEvent.findById(id).lean();
}

/**
 * 학사 일정 생성
 */
async function create(input: CreateAcademicEventInput, userId?: string): Promise<IAcademicEventDocument> {
  await connectDB();

  const eventData: Record<string, unknown> = {
    title: input.title,
    description: input.description,
    startDate: new Date(input.startDate),
    category: input.category,
    color: input.color,
    isHoliday: input.isHoliday ?? false,
  };

  if (input.endDate) {
    eventData.endDate = new Date(input.endDate);
  }

  if (userId) {
    eventData.createdBy = userId;
  }

  const event = await AcademicEvent.create(eventData);
  return event.toObject();
}

/**
 * 학사 일정 업데이트
 */
async function update(
  id: string,
  data: Partial<CreateAcademicEventInput>
): Promise<IAcademicEventDocument | null> {
  await connectDB();

  const updateData: Record<string, unknown> = { ...data };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);
  if (data.endDate === '') {
    updateData.endDate = null;
    updateData.$unset = { endDate: 1 };
    delete updateData.endDate;
  }

  return AcademicEvent.findByIdAndUpdate(id, updateData, { new: true }).lean();
}

/**
 * 학사 일정 삭제 (hard delete)
 */
async function remove(id: string): Promise<IAcademicEventDocument | null> {
  await connectDB();
  return AcademicEvent.findByIdAndDelete(id).lean();
}

export const academicEventService = {
  findAll,
  findById,
  create,
  update,
  remove,
};
