/**
 * 학사 일정 시드 스크립트
 * 실행: npx tsx scripts/seed-academic-events.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI가 설정되지 않았습니다.');
  process.exit(1);
}

// AcademicEvent 스키마 인라인 정의 (모듈 임포트 대신)
const academicEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    category: { type: String, enum: ['academic', 'registration', 'exam', 'holiday', 'other'], default: 'academic' },
    color: { type: String, trim: true },
    isHoliday: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const AcademicEvent = mongoose.models.AcademicEvent || mongoose.model('AcademicEvent', academicEventSchema);

interface SeedEvent {
  title: string;
  startDate: string;
  endDate?: string;
  category: 'academic' | 'registration' | 'exam' | 'holiday' | 'other';
}

const EVENTS: SeedEvent[] = [
  // 2026년 2월
  { title: '추가휴학원서접수', startDate: '2026-02-02', endDate: '2026-02-27', category: 'registration' },
  { title: '추가재입학원서접수', startDate: '2026-02-04', endDate: '2026-02-06', category: 'registration' },
  { title: '수강신청', startDate: '2026-02-11', endDate: '2026-02-13', category: 'registration' },
  { title: '등록기간', startDate: '2026-02-19', endDate: '2026-02-23', category: 'registration' },
  { title: '학위수여식', startDate: '2026-02-20', category: 'academic' },
  { title: '추가복학원서접수', startDate: '2026-02-25', endDate: '2026-02-27', category: 'registration' },
  { title: '입학식', startDate: '2026-02-26', category: 'academic' },

  // 2026년 3월
  { title: '학기개시일', startDate: '2026-03-01', category: 'academic' },
  { title: '개강', startDate: '2026-03-03', category: 'academic' },
  { title: '수업일수 1/4', startDate: '2026-03-27', category: 'academic' },
  { title: '학기개시일(30일)', startDate: '2026-03-30', category: 'academic' },

  // 2026년 4월
  { title: '중간시험', startDate: '2026-04-21', endDate: '2026-04-27', category: 'exam' },
  { title: '수업일수 1/2', startDate: '2026-04-23', category: 'academic' },
  { title: '학기개시일(60일)', startDate: '2026-04-29', category: 'academic' },

  // 2026년 5월
  { title: '수업일수 3/4', startDate: '2026-05-22', category: 'academic' },
  { title: '학기개시일(90일)', startDate: '2026-05-29', category: 'academic' },

  // 2026년 6월
  { title: '공휴일수업대체지정일 (05.01 근로자의날)', startDate: '2026-06-09', category: 'academic' },
  { title: '공휴일수업대체지정일 (05.05 어린이날)', startDate: '2026-06-10', category: 'academic' },
  { title: '공휴일수업대체지정일 (05.25 부처님오신날 대체공휴일)', startDate: '2026-06-11', category: 'academic' },
  { title: '공휴일수업대체지정일 (06.03 전국동시지방선거)', startDate: '2026-06-12', category: 'academic' },
  { title: '기말시험', startDate: '2026-06-15', endDate: '2026-06-19', category: 'exam' },
  { title: '방학', startDate: '2026-06-22', category: 'academic' },

  // 2026년 7월
  { title: '복학·재입학원서접수', startDate: '2026-07-01', endDate: '2026-07-03', category: 'registration' },
  { title: '휴학원서접수', startDate: '2026-07-01', endDate: '2026-07-03', category: 'registration' },

  // 2026년 8월
  { title: '수강신청', startDate: '2026-08-11', endDate: '2026-08-13', category: 'registration' },
  { title: '등록기간', startDate: '2026-08-18', endDate: '2026-08-20', category: 'registration' },
  { title: '학위수여식', startDate: '2026-08-21', category: 'academic' },

  // 2026년 9월
  { title: '학기개시일', startDate: '2026-09-01', category: 'academic' },
  { title: '개강', startDate: '2026-09-01', category: 'academic' },
  { title: '수업일수 1/4', startDate: '2026-09-29', category: 'academic' },
  { title: '학기개시일(30일)', startDate: '2026-09-30', category: 'academic' },

  // 2026년 10월
  { title: '중간시험', startDate: '2026-10-20', endDate: '2026-10-26', category: 'exam' },
  { title: '수업일수 1/2', startDate: '2026-10-28', category: 'academic' },
  { title: '학기개시일(60일)', startDate: '2026-10-30', category: 'academic' },

  // 2026년 11월
  { title: '수업일수 3/4', startDate: '2026-11-24', category: 'academic' },
  { title: '학기개시일(90일)', startDate: '2026-11-29', category: 'academic' },

  // 2026년 12월
  { title: '공휴일수업대체지정일 (09.24 추석연휴)', startDate: '2026-12-08', category: 'academic' },
  { title: '공휴일수업대체지정일 (09.25 추석연휴)', startDate: '2026-12-09', category: 'academic' },
  { title: '공휴일수업대체지정일 (10.05 개천절 대체공휴일)', startDate: '2026-12-10', category: 'academic' },
  { title: '공휴일수업대체지정일 (10.09 한글날)', startDate: '2026-12-11', category: 'academic' },
  { title: '기말시험', startDate: '2026-12-14', endDate: '2026-12-18', category: 'exam' },
  { title: '방학', startDate: '2026-12-21', category: 'academic' },
  { title: '개교기념일', startDate: '2026-12-22', category: 'academic' },

  // 2027년 1월
  { title: '복학·재입학원서접수', startDate: '2027-01-04', endDate: '2027-01-06', category: 'registration' },
  { title: '휴학원서접수', startDate: '2027-01-04', endDate: '2027-01-06', category: 'registration' },

  // 2027년 2월
  { title: '수강신청', startDate: '2027-02-10', endDate: '2027-02-12', category: 'registration' },
  { title: '등록기간', startDate: '2027-02-16', endDate: '2027-02-18', category: 'registration' },
  { title: '학위수여식', startDate: '2027-02-22', category: 'academic' },
];

async function main() {
  console.log('MongoDB 연결 중...');
  await mongoose.connect(MONGODB_URI!);
  console.log('연결 완료.');

  // 기존 데이터 확인
  const existingCount = await AcademicEvent.countDocuments();
  if (existingCount > 0) {
    console.log(`기존 학사 일정 ${existingCount}건이 있습니다. 중복 방지를 위해 삭제 후 재삽입합니다.`);
    await AcademicEvent.deleteMany({});
  }

  console.log(`${EVENTS.length}개 일정 삽입 중...`);

  const docs = EVENTS.map((e) => ({
    title: e.title,
    startDate: new Date(e.startDate),
    endDate: e.endDate ? new Date(e.endDate) : undefined,
    category: e.category,
    isHoliday: false,
  }));

  await AcademicEvent.insertMany(docs);

  console.log(`완료! ${EVENTS.length}개 학사 일정이 삽입되었습니다.`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('시드 실패:', err);
  process.exit(1);
});
