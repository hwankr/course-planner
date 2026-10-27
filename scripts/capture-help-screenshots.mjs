/**
 * Capture the six help illustrations from the current application UI.
 * Requires an already running dev server (default http://localhost:3000), the
 * installed Playwright package, and Chromium 1243; this script starts no server.
 * Run: node scripts/capture-help-screenshots.mjs (or npm run help:screenshots).
 * Overrides: BASE_URL, CHROMIUM_EXECUTABLE_PATH, CHROMIUM_LIBRARY_PATH.
 * Linux shared libraries may be supplied with LD_LIBRARY_PATH, or with
 * CHROMIUM_LIBRARY_PATH=/path/to/libroot/usr/lib/x86_64-linux-gnu. The existing
 * Orca audit library directory below is used automatically when available.
 * Optional HELP_REPORT_DIR writes PNG preview copies and capture metadata there.
 * After capture, only the six width/height attributes in help/page.tsx are synced.
 * If a running dev server still serves old optimized images, its image cache may
 * need refreshing separately; this script does not delete the shared dev cache.
 * All API calls are fulfilled in isolated browser contexts; no real session,
 * account, plan, or database is read or changed. Fixture data is embedded below.
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const output = path.join(root, 'public/help');
const reportDir = process.env.HELP_REPORT_DIR;
const chromiumPath = process.env.CHROMIUM_EXECUTABLE_PATH || path.join(os.homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
const auditLibraries = '/tmp/claude-1000/-home-hwankr-projects-course-planner/174ea95b-8627-4036-8621-d9e07776544e/scratchpad/libroot/usr/lib/x86_64-linux-gnu';
const libraryPath = process.env.CHROMIUM_LIBRARY_PATH || (existsSync(auditLibraries) ? auditLibraries : '');
const department = { _id: '507f1f77bcf86cd799439011', name: '컴퓨터공학과', code: 'CSE', college: '디지털융합대학' };

// Exact code/name/credits/category/year/term from the first 32 entries of:
// scripts/data/curriculum-2026/디지털융합대학/디지털융합대학_컴퓨터학부-컴퓨터공학전공.csv
// This snapshot keeps the command self-contained, without importing any seed/DB code.
const curriculum = [
  [1, "spring", "general_required", "U00911", "대학생활과전공설계", 1],
  [1, "spring", "general_required", "U00786", "소프트웨어와인공지능", 3],
  [1, "spring", "general_required", "U00258", "실용영어", 3],
  [1, "spring", "general_required", "U00514", "행렬및행렬식", 3],
  [1, "fall", "general_required", "U00801", "C프로그래밍", 3],
  [1, "fall", "general_required", "U00145", "미분적분학(1)", 3],
  [1, "fall", "general_required", "U00787", "사회공헌과봉사", 1],
  [1, "fall", "general_required", "U00469", "통계학(1)", 3],
  [2, "spring", "major_required", "CEM001", "논리회로", 3],
  [2, "spring", "major_required", "CEM002", "논리회로실험", 1],
  [2, "spring", "major_required", "CEM050", "오픈소스SW의이해", 2],
  [2, "spring", "major_required", "CEM017", "프로그래밍언어", 3],
  [2, "spring", "major_elective", "CEM026", "공학입문설계", 2],
  [2, "spring", "major_elective", "CEM010", "이산수학", 3],
  [2, "fall", "major_required", "CEM005", "마이크로프로세서", 2],
  [2, "fall", "major_required", "CEM006", "마이크로프로세서실험", 1],
  [2, "fall", "major_required", "CEM031", "시스템프로그래밍및보안", 3],
  [2, "fall", "major_required", "CEM012", "자료구조", 3],
  [2, "fall", "major_elective", "CEM024", "자바프로그래밍및실습", 3],
  [2, "fall", "major_elective", "CEM004", "데이터통신", 2],
  [2, "fall", "major_elective", "CEM034", "자료구조실습", 1],
  [3, "spring", "major_required", "CEM036", "IoT와임베디드소프트웨어", 3],
  [3, "spring", "major_required", "CEM008", "알고리즘", 3],
  [3, "spring", "major_required", "CEM049", "오픈소스SW설계", 2],
  [3, "spring", "major_required", "CEM009", "운영체제", 3],
  [3, "spring", "major_elective", "CEM016", "컴퓨터네트워크", 3],
  [3, "spring", "major_elective", "CEM015", "컴퓨터그래픽스", 3],
  [3, "fall", "major_required", "CEM003", "데이터베이스", 3],
  [3, "fall", "major_required", "CEM007", "소프트웨어공학", 3],
  [3, "fall", "major_required", "CEM014", "컴퓨터구조", 3],
  [3, "fall", "major_elective", "CEM038", "데이터분석과머신러닝", 3],
  [3, "fall", "major_elective", "CEM025", "모바일프로그래밍", 3]
];
const courses = curriculum.map(([year, term, category, code, name, credits], index) => ({
  _id: `507f1f77bcf86cd79943${String(index + 100).padStart(3, '0')}`,
  code, name, credits, category, department: department._id,
  recommendedYear: year, recommendedSemester: term, semesters: [term],
  curriculumYear: 2026, prerequisites: [],
}));
const profile = { name: '김영남', departmentId: department._id, departmentName: department.name, departmentCollege: department.college, enrollmentYear: 2025, curriculumYear: 2026, majorType: 'single' };
const requirement = {
  majorType: 'single', requirementYear: 2026,
  totalCredits: 120, generalCredits: 30, primaryMajorCredits: 63, primaryMajorRequiredMin: 24,
  earnedTotalCredits: 36, earnedGeneralCredits: 21, earnedPrimaryMajorCredits: 15, earnedPrimaryMajorRequiredCredits: 6,
};
const plannedCourse = (course, status) => ({ id: course._id, code: course.code, name: course.name, credits: course.credits, category: course.category, departmentId: department._id, status });
const plan = { id: 'help-sample-plan', semesters: [
  { year: 2, term: 'spring', courses: courses.slice(8, 14).map((c, i) => plannedCourse(c, i < 4 ? 'completed' : 'enrolled')) },
  { year: 2, term: 'fall', courses: courses.slice(14, 20).map((c, i) => plannedCourse(c, i === 0 ? 'enrolled' : 'planned')) },
] };
const plans = Array.from({ length: 30 }, (_, i) => ({ anonymousId: `help-plan-${i + 1}`, semesterCount: 4 + i % 4, totalCourses: 24 + i % 12, totalCredits: 62 + (i % 12) * 3 }));
const stats = {
  departmentId: department._id, departmentName: department.name, totalStudents: 128, updatedAt: new Date().toISOString(),
  courseStats: [...courses.slice(8, 14), ...courses.slice(17, 26)].map((c, i) => ({
    courseId: c._id, code: c.code, name: c.name, credits: c.credits, category: c.category,
    studentCount: 112 - i * 4, percentage: Math.round((112 - i * 4) / 128 * 100),
    semesters: [{ year: c.recommendedYear, term: c.recommendedSemester }],
  })),
  semesterDistribution: [
    { year: 1, term: 'spring', avgCourses: 6.2, avgCredits: 17.4 },
    { year: 1, term: 'fall', avgCourses: 6.3, avgCredits: 17.8 },
    { year: 2, term: 'spring', avgCourses: 6.1, avgCredits: 16.9 },
    { year: 2, term: 'fall', avgCourses: 6.4, avgCredits: 18.2 },
  ],
};
const results = { generatedAt: new Date().toISOString(), baseURL, chromiumPath, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, images: [], pageErrors: [], unexpectedAPI: [] };
const browser = await chromium.launch({
  headless: true, executablePath: chromiumPath,
  env: { ...process.env, LD_LIBRARY_PATH: [libraryPath, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':') },
});

async function createPage(mode) {
  const context = await browser.newContext({ viewport: results.viewport, deviceScaleFactor: 2, locale: 'ko-KR', timezoneId: 'Asia/Seoul' });
  // Middleware accepts this isolated context; the API session determines member UI.
  await context.addCookies([{ name: 'guest-mode', value: 'true', url: baseURL }]);
  await context.addInitScript(({ mode, profile, requirement, plan }) => {
    sessionStorage.setItem('guest-session', JSON.stringify({ state: { isGuest: mode !== 'member' }, version: 0 }));
    localStorage.setItem('guest-profile', JSON.stringify({ state: mode === 'onboarding' ? { name: profile.name } : profile, version: 0 }));
    localStorage.setItem('guest-graduation', JSON.stringify({ state: { requirement }, version: 0 }));
    localStorage.setItem('guest-plans', JSON.stringify({ state: { plan }, version: 0 }));
  }, { mode, profile, requirement, plan });
  await context.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url()), pathname = url.pathname;
    const reply = data => route.fulfill({ json: data });
    if (pathname === '/api/auth/session') return reply(mode === 'member' ? {
      user: { id: 'help-member', ...profile, department: department._id, role: 'user', onboardingCompleted: true }, expires: '2099-01-01T00:00:00Z',
    } : {});
    if (pathname === '/api/departments') return reply({ success: true, data: [department] });
    if (pathname === '/api/department-requirements') return reply({ ...requirement, availableMajorTypes: ['single', 'double', 'minor'] });
    if (pathname === '/api/courses') {
      let filtered = courses;
      const search = url.searchParams.get('search')?.toLowerCase();
      if (search) filtered = filtered.filter(c => (c.name + c.code).toLowerCase().includes(search));
      for (const key of ['recommendedYear', 'recommendedSemester', 'category']) {
        if (url.searchParams.has(key)) filtered = filtered.filter(c => String(c[key]) === url.searchParams.get(key));
      }
      return reply({ success: true, data: filtered });
    }
    if (pathname === '/api/users/me') return reply({ success: true, data: { ...profile, id: 'help-member', department } });
    if (pathname === '/api/statistics/department') return reply({ success: true, data: stats });
    if (pathname === '/api/statistics/anonymous-plans') {
      const page = Number(url.searchParams.get('page') || 1), limit = Number(url.searchParams.get('limit') || 9);
      return reply({ success: true, data: { plans: plans.slice((page - 1) * limit, page * limit), total: plans.length, page, limit } });
    }
    if (pathname.endsWith('unread-count')) return reply({ success: true, data: { count: 0 } });
    if (pathname === '/api/notifications') return reply({ success: true, data: { notifications: [], total: 0 } });
    results.unexpectedAPI.push({ method: request.method(), pathname });
    return reply({ success: true, data: [] });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => results.pageErrors.push(error.message));
  return page;
}
async function ready(page, routePath) {
  await page.goto(new URL(routePath, baseURL).href, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  await page.evaluate(() => document.fonts.ready);
}
async function capture(page, name, locator) {
  await locator.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(output, name + '.png');
  const box = await locator.boundingBox();
  const png = name === 'course-catalog'
    ? await page.screenshot({ path: file, fullPage: true, clip: { ...box, y: box.y + await page.evaluate(() => scrollY), width: box.width + 8 }, animations: 'disabled' })
    : await locator.screenshot({ path: file, animations: 'disabled' });
  const dimensions = { name, width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  assert.ok(dimensions.width >= 500 && dimensions.height >= 200, `Incomplete capture: ${name}`);
  results.images.push(dimensions);
  if (reportDir) await fs.copyFile(file, path.join(reportDir, `fix-F4-help-${name}-preview.png`));
  console.log(`Captured ${name}.png ${dimensions.width}x${dimensions.height}`);
}
try {
  await fs.mkdir(output, { recursive: true });
  if (reportDir) await fs.mkdir(reportDir, { recursive: true });
  const onboarding = await createPage('onboarding');
  await ready(onboarding, '/onboarding');
  await onboarding.getByRole('combobox', { name: '학과', exact: true }).click();
  await onboarding.getByRole('option', { name: department.name, exact: true }).click();
  await onboarding.getByRole('spinbutton', { name: '입학연도', exact: true }).fill('2025');
  await onboarding.getByRole('button', { name: '다음', exact: true }).waitFor();
  await onboarding.getByRole('heading', { name: '초기 설정', exact: true }).click();
  await capture(onboarding, 'onboarding-screen', onboarding.locator('main .max-w-2xl'));
  await onboarding.context().close();

  const planner = await createPage('guest');
  await ready(planner, '/planner');
  await planner.getByRole('button', { name: '학기 추가', exact: true }).waitFor();
  await capture(planner, 'requirements-widget', planner.locator('section[aria-labelledby="req-title"]'));
  await capture(planner, 'planner-semesters', planner.getByRole('region', { name: '학기별 계획', exact: true }));
  const catalog = planner.getByRole('complementary', { name: '과목 리스트', exact: true });
  await catalog.getByRole('combobox', { name: '학년', exact: true }).selectOption('3');
  await catalog.getByText('운영체제', { exact: true }).waitFor();
  await capture(planner, 'course-catalog', catalog);
  assert.equal(await planner.getByRole('button', { name: /카드 보기|리스트 보기|카탈로그 접기/ }).count(), 0);
  await planner.context().close();

  const statistics = await createPage('member');
  await ready(statistics, '/statistics');
  await statistics.getByText('논리회로', { exact: true }).waitFor();
  await capture(statistics, 'statistics-ranking', statistics.locator('section[aria-labelledby="popular-title"]'));
  const overview = statistics.locator('section[aria-labelledby="avg-title"]');
  const anonymous = statistics.locator('section[aria-labelledby="anon-title"]');
  await anonymous.getByRole('button', { name: /^계획 1 / }).waitFor();
  await overview.scrollIntoViewIfNeeded();
  const bounds = await statistics.evaluate(() => {
    const first = document.querySelector('section[aria-labelledby="avg-title"]').getBoundingClientRect();
    const last = document.querySelector('section[aria-labelledby="anon-title"]').getBoundingClientRect();
    return { x: first.x + scrollX, y: first.y + scrollY, width: first.width, height: last.bottom - first.top };
  });
  const overviewFile = path.join(output, 'statistics-overview.png');
  const png = await statistics.screenshot({ path: overviewFile, fullPage: true, clip: bounds, animations: 'disabled' });
  const dimensions = { name: 'statistics-overview', width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  assert.ok(dimensions.height >= 800, 'Overview must include both average and anonymous-plan sections');
  results.images.push({ ...dimensions, bounds });
  if (reportDir) await fs.copyFile(overviewFile, path.join(reportDir, 'fix-F4-help-statistics-overview-preview.png'));
  console.log(`Captured statistics-overview.png ${dimensions.width}x${dimensions.height}`);
  await statistics.context().close();
  assert.deepEqual(results.pageErrors, []);
  assert.deepEqual(results.unexpectedAPI, []);
  const helpFile = path.join(root, 'src/app/(dashboard)/help/page.tsx');
  const helpSource = await fs.readFile(helpFile, 'utf8');
  let updatedHelpSource = helpSource;
  for (const { name, width, height } of results.images) {
    const pattern = new RegExp(`(src="/help/${name}\\.png"[\\s\\S]*?width=\\{)\\d+(\\}\\s+height=\\{)\\d+(\\})`);
    assert.ok(pattern.test(updatedHelpSource), `Missing image dimensions: ${name}`);
    updatedHelpSource = updatedHelpSource.replace(pattern, (_, beforeWidth, beforeHeight, afterHeight) => `${beforeWidth}${width}${beforeHeight}${height}${afterHeight}`);
  }
  if (updatedHelpSource !== helpSource) await fs.writeFile(helpFile, updatedHelpSource);
  console.log('PASS: six current-UI screenshots; image dimensions synced; all API requests handled by fixtures.');
} finally {
  await browser.close();
  if (reportDir) await fs.writeFile(path.join(reportDir, 'fix-F4-capture.json'), JSON.stringify(results, null, 2) + '\n');
}
