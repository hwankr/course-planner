/**
 * Migration: Add `year` field to DepartmentCurriculum
 *
 * 1. Backfill existing documents with year: 2025
 * 2. Drop old unique index { department, course, recommendedSemester }
 * 3. Create new unique index { department, course, recommendedSemester, year }
 *
 * Idempotent: safe to run multiple times.
 *
 * Usage: npx tsx scripts/migrate-curriculum-year.ts
 */

import './env';
import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db/mongoose';

const COLLECTION_NAME = 'departmentcurriculums';
const OLD_INDEX_NAME = 'department_1_course_1_recommendedSemester_1';
const NEW_INDEX_SPEC = { department: 1, course: 1, recommendedSemester: 1, year: 1 } as const;
const NEW_INDEX_NAME = 'department_1_course_1_recommendedSemester_1_year_1';

async function migrate() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error('DB connection not available');

  const collection = db.collection(COLLECTION_NAME);

  // Step 1: Backfill year: 2025 where missing
  console.log('\n📝 Step 1: year 필드 백필 (2025)...');
  const backfillResult = await collection.updateMany(
    { year: { $exists: false } },
    { $set: { year: 2025 } },
  );
  console.log(`  ✅ ${backfillResult.modifiedCount}개 문서에 year: 2025 설정`);

  // Step 2: Drop old index (if exists)
  console.log('\n🗑️  Step 2: 기존 인덱스 삭제...');
  try {
    const indexes = await collection.indexes();
    const oldIndexExists = indexes.some((idx) => idx.name === OLD_INDEX_NAME);

    if (oldIndexExists) {
      await collection.dropIndex(OLD_INDEX_NAME);
      console.log(`  ✅ 기존 인덱스 삭제: ${OLD_INDEX_NAME}`);
    } else {
      console.log(`  ⏭️  기존 인덱스 없음 (이미 삭제됨): ${OLD_INDEX_NAME}`);
    }
  } catch (err) {
    console.log(`  ⏭️  인덱스 삭제 건너뜀:`, (err as Error).message);
  }

  // Step 3: Create new index (if not exists)
  console.log('\n📊 Step 3: 새 인덱스 생성...');
  try {
    const indexes = await collection.indexes();
    const newIndexExists = indexes.some((idx) => idx.name === NEW_INDEX_NAME);

    if (newIndexExists) {
      console.log(`  ⏭️  새 인덱스 이미 존재: ${NEW_INDEX_NAME}`);
    } else {
      await collection.createIndex(NEW_INDEX_SPEC, {
        unique: true,
        name: NEW_INDEX_NAME,
      });
      console.log(`  ✅ 새 인덱스 생성: ${NEW_INDEX_NAME}`);
    }
  } catch (err) {
    console.error(`  ❌ 인덱스 생성 실패:`, (err as Error).message);
    throw err;
  }

  // Verification
  console.log('\n🔍 검증...');
  const withoutYear = await collection.countDocuments({ year: { $exists: false } });
  const total = await collection.countDocuments();
  const finalIndexes = await collection.indexes();
  console.log(`  총 문서: ${total}개`);
  console.log(`  year 필드 없는 문서: ${withoutYear}개`);
  console.log(`  인덱스 목록:`);
  for (const idx of finalIndexes) {
    console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? ' (unique)' : ''}`);
  }

  console.log('\n🎉 마이그레이션 완료!');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('\n❌ 마이그레이션 실패:', err);
  process.exit(1);
});
