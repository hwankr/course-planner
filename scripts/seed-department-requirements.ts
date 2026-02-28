/**
 * Seed script: Import department graduation requirements from CSV
 *
 * Run: npx tsx scripts/seed-department-requirements.ts [year]
 * Example: npx tsx scripts/seed-department-requirements.ts 2026
 */

import './env';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db/mongoose';
import DepartmentRequirement from '../src/models/DepartmentRequirement';

async function seed() {
  await connectDB();

  // Accept year as CLI argument, default to 2025
  const year = parseInt(process.argv[2], 10) || 2025;
  console.log(`🚀 졸업요건 임포트 시작 (${year}년)\n`);

  const csvPath = path.resolve(__dirname, 'data', `min-credits-${year}.csv`);
  let csvContent = fs.readFileSync(csvPath, 'utf-8');
  // BOM removal
  if (csvContent.charCodeAt(0) === 0xfeff) {
    csvContent = csvContent.slice(1);
  }
  const lines = csvContent.trim().split('\n');
  const dataLines = lines.slice(1);

  let processed = 0;
  let errors = 0;

  for (const line of dataLines) {
    const cols = line.split(',');

    const parseVal = (val: string): number | null => {
      const trimmed = val.trim();
      if (trimmed === '-' || trimmed === '') return null;
      const num = parseInt(trimmed, 10);
      return isNaN(num) ? null : num;
    };

    const college = cols[0].trim();
    const departmentName = cols[1].trim();
    const generalCredits = parseVal(cols[2]);

    const single = {
      majorRequiredMin: parseVal(cols[3]),
      majorCredits: parseVal(cols[4]),
    };
    const double = {
      majorRequiredMin: parseVal(cols[5]),
      majorCredits: parseVal(cols[6]),
    };
    const minor = {
      majorRequiredMin: parseVal(cols[7]),
      majorCredits: parseVal(cols[8]),
      primaryMajorMin: parseVal(cols[9]),
    };
    const totalCredits = parseInt(cols[10].trim(), 10);

    const availableMajorTypes: string[] = [];
    if (single.majorCredits !== null) availableMajorTypes.push('single');
    if (double.majorCredits !== null) availableMajorTypes.push('double');
    if (minor.majorCredits !== null) availableMajorTypes.push('minor');

    try {
      await DepartmentRequirement.findOneAndUpdate(
        { college, departmentName, year },
        {
          college,
          departmentName,
          year,
          generalCredits,
          single,
          double,
          minor,
          totalCredits,
          availableMajorTypes,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      processed++;
      console.log(`  ✓ ${college} / ${departmentName}`);
    } catch (err) {
      errors++;
      console.error(`  ✗ ${college} / ${departmentName}:`, err);
    }
  }

  console.log(`\n🎉 ${year}년 졸업요건 임포트 완료: ${processed} processed, ${errors} errors`);
  console.log(`Total records: ${await DepartmentRequirement.countDocuments()}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
