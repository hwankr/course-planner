/**
 * Migration script: Multi-Major Graduation Requirements
 *
 * Renames fields in GraduationRequirement collection and sets majorType defaults.
 * MUST be run BEFORE deploying new schema code.
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/migrate-multi-major.ts
 */

import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/mongoose';

async function migrate() {
  console.log('Starting multi-major migration...');

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  // 1. GraduationRequirement collection: Rename fields
  const gradReqCollection = db.collection('graduationrequirements');

  // Check if migration already applied (idempotent)
  const alreadyMigrated = await gradReqCollection.countDocuments({ primaryMajorCredits: { $exists: true } });
  const needsMigration = await gradReqCollection.countDocuments({ majorCredits: { $exists: true } });

  console.log(`GraduationRequirement: ${alreadyMigrated} already migrated, ${needsMigration} need migration`);

  if (needsMigration > 0) {
    // Rename fields
    await gradReqCollection.updateMany(
      { majorCredits: { $exists: true } },
      { $rename: { 'majorCredits': 'primaryMajorCredits' } }
    );
    await gradReqCollection.updateMany(
      { majorRequiredMin: { $exists: true } },
      { $rename: { 'majorRequiredMin': 'primaryMajorRequiredMin' } }
    );
    await gradReqCollection.updateMany(
      { earnedMajorCredits: { $exists: true } },
      { $rename: { 'earnedMajorCredits': 'earnedPrimaryMajorCredits' } }
    );
    await gradReqCollection.updateMany(
      { earnedMajorRequiredCredits: { $exists: true } },
      { $rename: { 'earnedMajorRequiredCredits': 'earnedPrimaryMajorRequiredCredits' } }
    );
    console.log('Field renames complete.');
  }

  // Set majorType: 'single' on all GraduationRequirement docs without majorType
  const gradReqNoType = await gradReqCollection.countDocuments({ majorType: { $exists: false } });
  if (gradReqNoType > 0) {
    await gradReqCollection.updateMany(
      { majorType: { $exists: false } },
      { $set: { majorType: 'single' } }
    );
    console.log(`Set majorType: 'single' on ${gradReqNoType} GraduationRequirement docs.`);
  }

  // 2. User collection: Set majorType defaults
  const userCollection = db.collection('users');
  const userNoType = await userCollection.countDocuments({ majorType: { $exists: false } });
  if (userNoType > 0) {
    await userCollection.updateMany(
      { majorType: { $exists: false } },
      { $set: { majorType: 'single' } }
    );
    console.log(`Set majorType: 'single' on ${userNoType} User docs.`);
  }

  // 3. Verification
  console.log('\n--- Verification ---');
  const oldFields = await gradReqCollection.countDocuments({ majorCredits: { $exists: true } });
  const newFields = await gradReqCollection.countDocuments({ primaryMajorCredits: { $exists: true } });
  const withType = await gradReqCollection.countDocuments({ majorType: { $exists: true } });
  console.log(`Old field (majorCredits) remaining: ${oldFields}`);
  console.log(`New field (primaryMajorCredits) present: ${newFields}`);
  console.log(`Has majorType: ${withType}`);

  const userWithType = await userCollection.countDocuments({ majorType: { $exists: true } });
  console.log(`Users with majorType: ${userWithType}`);

  console.log('\nMigration complete!');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
