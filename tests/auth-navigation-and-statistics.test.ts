import assert from 'node:assert/strict';
import test from 'node:test';
import { safeCallbackUrl, isPublicPage } from '../src/components/providers/authNavigation';

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/course-planner-test';
process.env.NEXTAUTH_SECRET ||= 'test-nextauth-secret';
process.env.GOOGLE_CLIENT_ID ||= 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET ||= 'test-google-client-secret';

test('callback preserves same-origin root-relative query and fragment', () => {
  assert.equal(safeCallbackUrl('/planner?x=audit-L1&next=%2Fhelp#semester'), '/planner?x=audit-L1&next=%2Fhelp#semester');
  assert.equal(safeCallbackUrl('/profile'), '/profile');
});
test('callback rejects external, protocol-relative, control and backslash destinations', () => {
  for (const value of [null, '', 'https://evil.test', '//evil.test', '/\\evil.test', '/\nevil.test', 'javascript:alert(1)', 'planner', '/login?callbackUrl=/login', '/register', '/a/..//evil.test']) {
    assert.equal(safeCallbackUrl(value), '/planner', String(value));
  }
});
test('public reading routes match complete segments and exclude private routes', () => {
  for (const path of ['/help', '/help/feedback', '/help/graduation-guide', '/calendar', '/statistics', '/patch-notes/a', '/privacy', '/terms']) assert.equal(isPublicPage(path), true, path);
  for (const path of ['/planner', '/profile', '/admin', '/onboarding', '/help-private', '/statistics-private']) assert.equal(isPublicPage(path), false, path);
});
test('statistics semesters are chronological and equal semesters compare equally', async () => {
  const { compareStatisticsSemesters } = await import('../src/services/statistics.service');
  const semesters = [{ year: 2, term: 'fall' }, { year: 1, term: 'fall' }, { year: 2, term: 'spring' }, { year: 1, term: 'spring' }];
  assert.deepEqual(semesters.sort(compareStatisticsSemesters).map(s => `${s.year}-${s.term}`), ['1-spring', '1-fall', '2-spring', '2-fall']);
  assert.equal(compareStatisticsSemesters({ year: 1, term: 'spring' }, { year: 1, term: 'spring' }), 0);
});
