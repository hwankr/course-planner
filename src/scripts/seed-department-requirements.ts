/**
 * Seed script: Import department graduation requirements from CSV
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/seed-department-requirements.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/mongoose';
import DepartmentRequirement from '@/models/DepartmentRequirement';

async function seed() {
  await connectDB();

  const csvPath = path.resolve(process.cwd(), 'min.csv');
  let csvContent = fs.readFileSync(csvPath, 'utf-8');
  // BOM (Byte Order Mark) 제거 - 한국어 CSV 파일에서 흔히 발생
  if (csvContent.charCodeAt(0) === 0xFEFF) {
    csvContent = csvContent.slice(1);
  }
  const lines = csvContent.trim().split('\n');

  // Skip header
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

    // Compute available major types
    const availableMajorTypes: string[] = [];
    if (single.majorCredits !== null) availableMajorTypes.push('single');
    if (double.majorCredits !== null) availableMajorTypes.push('double');
    if (minor.majorCredits !== null) availableMajorTypes.push('minor');

    try {
      await DepartmentRequirement.findOneAndUpdate(
        { college, departmentName },
        {
          college,
          departmentName,
          generalCredits,
          single,
          double,
          minor,
          totalCredits,
          availableMajorTypes,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      processed++;
    } catch (err) {
      errors++;
      console.error(`Error for ${college} / ${departmentName}:`, err);
    }
  }

  console.log(`Seed complete: ${processed} processed, ${errors} errors`);
  console.log(`Total records in collection: ${await DepartmentRequirement.countDocuments()}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
