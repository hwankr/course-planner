import assert from 'node:assert/strict';
import test from 'node:test';
import { computeCurrentTotals, computeGraduationDelta, resolveMajorTrack } from '../src/lib/graduationDelta';
import type { GraduationRequirementInput, MajorAttributionContext } from '../src/types';

const requirement: GraduationRequirementInput = {
  majorType: 'double', totalCredits: 120, generalCredits: 30,
  primaryMajorCredits: 39, primaryMajorRequiredMin: 24,
  secondaryMajorCredits: 42, secondaryMajorRequiredMin: 24,
  earnedTotalCredits: 0, earnedPrimaryMajorCredits: 0,
  earnedPrimaryMajorRequiredCredits: 0, earnedGeneralCredits: 0,
};
const context: MajorAttributionContext = {
  majorType: 'double', secondaryDepartmentId: 'BUS',
  primaryCourseIds: ['SCM007', 'shared'], secondaryCourseIds: ['BUS004', 'shared'],
};

test('explicit curriculum selection takes precedence; legacy exclusive courses fall back to their track', () => {
  assert.equal(resolveMajorTrack({ id: 'shared', departmentId: 'BUS' }, context), 'secondaryMajor');
  assert.equal(resolveMajorTrack({ id: 'BUS004', departmentId: 'SCM' }, context), 'primaryMajor');
  assert.equal(resolveMajorTrack({ id: 'BUS004' }, context), 'secondaryMajor');
  assert.equal(resolveMajorTrack({ id: 'shared' }, context), 'primaryMajor');
  assert.equal(resolveMajorTrack({ id: 'unknown' }, context), 'primaryMajor');
  assert.equal(resolveMajorTrack({ department: 'BUS' }, context), 'secondaryMajor');
  assert.equal(resolveMajorTrack({ department: 'SCM', id: 'BUS004' }, context), 'primaryMajor');
  assert.equal(resolveMajorTrack({ id: 'BUS004' }, { ...context, majorType: 'minor' }), 'minor');
  assert.equal(resolveMajorTrack({ departmentId: 'BUS' }, { ...context, majorType: 'single' }), 'primaryMajor');
});

test('BUS004 keeps primary earned 5/core 3 and adds secondary earned 3/core 3, total 8', () => {
  for (const departmentId of ['BUS', undefined]) {
    const totals = computeCurrentTotals([{ year: 1, term: 'spring', courses: [
      { id: 'SCM007', credits: 3, category: 'major_required', status: 'completed' },
      { id: 'custom', credits: 2, category: 'major_compulsory', status: 'completed' },
      { id: 'BUS004', departmentId, credits: 3, category: 'major_required', status: 'completed' },
      { id: 'failed', credits: 3, category: 'major_required', status: 'failed' },
    ] }], requirement, context);
    assert.equal(totals.totalEarned, 8);
    assert.equal(totals.primaryMajorEarned, 5);
    assert.equal(totals.primaryMajorRequiredEarned, 3);
    assert.equal(totals.secondaryMajorEarned, 3);
    assert.equal(totals.secondaryMajorRequiredEarned, 3);
  }
});

test('secondary and minor deltas use their own denominators and preserve prior cutoff', () => {
  const req = { ...requirement, earnedTotalCredits: 5, earnedPrimaryMajorCredits: 5,
    earnedPrimaryMajorRequiredCredits: 3, priorCutoffYear: 1, priorCutoffTerm: 'spring' as const };
  const totals = computeCurrentTotals([{ year: 1, term: 'spring', courses: [
    { id: 'SCM007', credits: 3, category: 'major_required', status: 'completed' },
    { id: 'BUS004', credits: 3, category: 'major_required', status: 'enrolled' },
  ] }], req, context);
  assert.equal(totals.totalEarned, 5);
  assert.equal(totals.secondaryMajorPlanned, 3);
  const delta = computeGraduationDelta({ credits: 3, departmentId: 'BUS', category: 'major_required' }, req, totals, context)!;
  assert.equal(delta.categoryKey, 'secondaryMajor');
  assert.deepEqual(delta.after, { credits: 6, percentage: 14 });
  assert.deepEqual(delta.secondRowAfter, { credits: 6, percentage: 25 });
  const minor = computeGraduationDelta({ id: 'BUS004', credits: 3, category: 'major_required' },
    { ...req, majorType: 'minor', minorCredits: 21, minorRequiredMin: 12 }, totals, context)!;
  assert.equal(minor.categoryKey, 'minor');
  assert.deepEqual(minor.after, { credits: 3, percentage: 14 });
});
