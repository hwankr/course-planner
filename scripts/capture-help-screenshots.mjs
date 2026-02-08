import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'help');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

function resolveExecutablePath() {
  return CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate)) ?? undefined;
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `Dev server not reachable at ${url}. Start it first (example: npm run dev).`
  );
}

async function disableMotion(page) {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
    `,
  }).catch(() => {});
}

async function stabilize(page) {
  await disableMotion(page);
  await page.waitForTimeout(250);
}

async function prepareCleanState(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.removeItem('guest-profile');
    localStorage.removeItem('guest-graduation');
    localStorage.removeItem('guest-plans');
    localStorage.removeItem('guest-courses');

    sessionStorage.removeItem('guest-session');
    document.cookie = 'guest-mode=;path=/;max-age=0';

    localStorage.setItem(
      'guide-state',
      JSON.stringify({
        state: {
          tourCompleted: true,
          tourDismissed: true,
          seenTips: {
            'tip-custom-course': true,
          },
          currentTourStep: null,
        },
        version: 0,
      })
    );
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
}

async function captureDesktopSet(browser) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 960 },
    locale: 'ko-KR',
  });
  const page = await context.newPage();

  await prepareCleanState(page);

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await stabilize(page);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'home-landing.png'),
  });

  await page.getByRole('button', { name: '비회원으로 체험하기' }).click();
  await page.waitForURL('**/onboarding', { timeout: 20000 });
  await page.getByText('학과 및 입학 정보').waitFor({ timeout: 15000 });
  await stabilize(page);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'onboarding-step1.png'),
  });

  const departmentInput = page.getByPlaceholder('학과를 검색하세요').first();
  await departmentInput.click();
  const firstDepartmentOption = page.locator('div.absolute.z-50 button').first();
  await firstDepartmentOption.waitFor({ state: 'visible', timeout: 10000 });
  await firstDepartmentOption.click();
  await page.getByPlaceholder('예: 2024').fill('2024');
  await page.getByRole('button', { name: '다음' }).click();

  await page.getByText('졸업 요건 설정').waitFor({ timeout: 15000 });
  await stabilize(page);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'onboarding-step2.png'),
  });

  await page.getByRole('button', { name: '완료' }).click();
  await page.waitForURL('**/planner', { timeout: 20000 });
  await page.getByRole('heading', { name: '수강 계획' }).waitFor({ timeout: 15000 });

  await page.getByRole('button', { name: '학기 추가' }).click();
  const addDialog = page.getByRole('heading', { name: '학기 추가' });
  await addDialog.waitFor({ timeout: 10000 });
  await page
    .locator('div.fixed.inset-0')
    .getByRole('button', { name: '추가', exact: true })
    .click();
  await page.getByText('1학년 1학기').first().waitFor({ timeout: 10000 });

  await stabilize(page);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'planner-overview.png'),
  });

  await page.locator('div.cursor-pointer:has-text("1학년 1학기")').first().click();
  await page.getByText('에 추가 중 — + 버튼을 클릭하세요').waitFor({ timeout: 5000 }).catch(() => {});

  try {
    let addCourseButton = page.locator('button[aria-label$="학기에 추가"]').first();
    await addCourseButton.waitFor({ timeout: 5000 });
    await addCourseButton.click();
  } catch {
    try {
      // If curriculum courses are empty for this department, create one custom course first.
      await page.getByRole('button', { name: '+ 추가' }).click();
      const customModal = page.getByRole('heading', { name: '커스텀 과목 추가' });
      await customModal.waitFor({ timeout: 10000 });
      await page.getByPlaceholder('예: 데이터베이스').fill('샘플 커스텀 과목');
      await page
        .locator('div.fixed.inset-0')
        .getByRole('button', { name: '추가', exact: true })
        .click();
      await customModal.waitFor({ state: 'hidden', timeout: 10000 });
      addCourseButton = page.locator('button[aria-label$="학기에 추가"]').first();
      await addCourseButton.waitFor({ timeout: 8000 });
      await addCourseButton.click();
    } catch {
      // Final fallback: seed one course directly into guest plan for a usable screenshot.
      await page.evaluate(() => {
        const raw = localStorage.getItem('guest-plans');
        const parsed = raw ? JSON.parse(raw) : { state: { plan: null }, version: 0 };
        const planId = parsed?.state?.plan?.id || `guest-plan-${Date.now().toString(36)}`;
        localStorage.setItem(
          'guest-plans',
          JSON.stringify({
            state: {
              plan: {
                id: planId,
                semesters: [
                  {
                    year: 1,
                    term: 'spring',
                    courses: [
                      {
                        id: 'seed-course-001',
                        code: 'CUS-DEMO',
                        name: '샘플 커스텀 과목',
                        credits: 3,
                        category: 'major_elective',
                        status: 'planned',
                      },
                    ],
                  },
                ],
              },
            },
            version: 0,
          })
        );
      });
      await page.reload({ waitUntil: 'networkidle' });
    }
  }

  await stabilize(page);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'planner-add-course.png'),
  });

  await page.goto(`${BASE_URL}/help`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: '도움말' }).waitFor({ timeout: 15000 });
  await stabilize(page);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'help-overview.png'),
  });

  await context.close();
}

async function captureMobileSet(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
  });
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await stabilize(page);
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'home-mobile.png'),
  });
  await context.close();
}

async function main() {
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
  await waitForServer(BASE_URL);

  const executablePath = resolveExecutablePath();
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });

  try {
    await captureDesktopSet(browser);
    await captureMobileSet(browser);
    console.log(`Screenshots saved to ${OUTPUT_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
