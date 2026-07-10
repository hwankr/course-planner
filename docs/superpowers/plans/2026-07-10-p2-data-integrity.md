# P2 Data Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every production change. The tasks share contracts across the planner, so execute them sequentially and review the combined diff at the end.

**Goal:** 서버 권위의 과목 분류와 게스트·보조전공 학과 문맥 보존을 구현한다.

**Architecture:** 카탈로그는 선택 학과 ID만 전달하고, `planService`가 사용자 소속을 검증한 뒤 `DepartmentCurriculum`에서 분류를 결정한다. 같은 학과 문맥을 클릭·드래그·커스텀 폼·게스트 계획·미리보기까지 보존하고, 커스텀 과목 조회도 학과별로 제한한다.

**Tech Stack:** Next.js App Router, TypeScript, Mongoose, Zustand, TanStack Query, Node test runner via `tsx --test`.

## Global Constraints

- API Route에는 HTTP 파싱·인증·응답 외 새 비즈니스 로직을 추가하지 않는다.
- 클라이언트 요청의 `category`는 계획 저장 분류의 권위 값으로 사용하지 않는다.
- `departmentId`는 사용자의 주전공 또는 유효한 복수전공·부전공 학과인지 서비스에서 검증한다.
- 공식 학과 과목 분류 키는 `course + department + curriculumYear`이다.
- 기존 게스트 localStorage 호환성을 위해 새 `departmentId` 필드는 optional로 유지한다.
- 기존 미추적 `AGENTS.md`와 무관한 사용자 변경은 수정하거나 stage하지 않는다.
- 실제 커밋·푸시는 하지 않고, 커밋·푸시 가능한 상태와 원격 동기화 여부까지만 검증한다.

---

### Task 1: Server-authoritative plan category

**Files:**
- Create: `tests/plan-course-category-integrity.test.ts`
- Modify: `src/types/index.ts`
- Modify: `src/app/api/plans/[id]/courses/route.ts`
- Modify: `src/hooks/usePlans.ts`
- Modify: `src/services/plan.service.ts`

**Interfaces:**
- Consumes: `User.department`, `User.secondaryDepartment`, `User.majorType`, `User.curriculumYear`, `DepartmentCurriculum.category`.
- Produces: `AddCourseToSemesterInput.departmentId?: string`; 계획 추가 요청 `{ year, term, courseId, departmentId }`.

- [ ] **Step 1: Write failing service tests**

  Add Node tests that call the real `planService.addCourseToSemester` while mocking only Mongoose model boundaries. Cover:

  ```typescript
  assert.equal(savedEntry.category, 'major_required');
  assert.deepEqual(curriculumFilter, {
    course: officialCourseId,
    department: secondaryDepartmentId,
    year: 2026,
  });
  ```

  Pass a forged `category: 'free_elective'` through a runtime cast to prove it cannot win. Add separate cases for an unauthorized department and a custom course whose DB category wins.

- [ ] **Step 2: Verify RED**

  Run: `npx tsx --test tests/plan-course-category-integrity.test.ts`

  Expected: failures showing the client category is stored, the curriculum query lacks `department`, or an unauthorized department is accepted.

- [ ] **Step 3: Implement the authoritative resolver**

  In `plan.service.ts`, load the actor only when a curriculum department is supplied, validate it against the actor's allowed primary/secondary departments, use `user.curriculumYear ?? DEFAULT_CURRICULUM_YEAR`, and resolve an official course through:

  ```typescript
  DepartmentCurriculum.findOne({
    course: course._id,
    department: departmentId,
    year: curriculumYear,
  }).select('category').lean();
  ```

  Custom and department-independent courses use `course.category`. Missing authoritative data throws a domain error.

- [ ] **Step 4: Remove category from the HTTP contract**

  Replace `AddCourseToSemesterInput.category/curriculumYear` with `departmentId`, parse and validate the optional ObjectId in the route, and serialize only `departmentId` from `usePlans.ts`.

- [ ] **Step 5: Verify GREEN**

  Run: `npx tsx --test tests/plan-course-category-integrity.test.ts tests/plan-custom-course-ownership.test.ts`

  Expected: all server category and ownership tests pass.

### Task 2: Preserve department context through member and guest additions

**Files:**
- Create: `tests/guest-department-integrity.test.ts`
- Modify: `src/components/features/CourseCatalog.tsx`
- Modify: `src/app/(dashboard)/planner/page.tsx`
- Modify: `src/stores/planStore.ts`
- Modify: `src/stores/guestPlanStore.ts`
- Modify: `src/hooks/useGraduationPreview.ts`

**Interfaces:**
- Consumes: `CourseCatalog.activeDepartment`.
- Produces: click DTO, drag data, optimistic course, `GuestPlannedCourse`, and preview calculation entries with `departmentId?: string`.

- [ ] **Step 1: Write failing guest integrity tests**

  Test `calculateGuestProgress` with a 3-credit planned major course carrying the secondary department ID. Verify double-major mode increments only `secondaryMajor.planned`, minor mode increments only `minor.planned`, and primary planned credits remain zero. Add source-contract assertions that click, drag, guest sync, and preview conversion preserve `departmentId`.

- [ ] **Step 2: Verify RED**

  Run: `npx tsx --test tests/guest-department-integrity.test.ts`

  Expected: contract assertions fail because current DTOs and stores omit `departmentId`.

- [ ] **Step 3: Propagate the selected department**

  Add `departmentId?: string` to the click DTO and `CatalogCourseItem` drag data. At drop time prefer `active.data.current.course` and `active.data.current.departmentId` over scanning arbitrary cached course results. Include the field in optimistic updates, member mutation inputs, direct guest store writes, and plan-store synchronization.

- [ ] **Step 4: Preserve department in guest and preview state**

  Add optional `departmentId` to `GuestPlannedCourse` and the UI plan-store course type. Copy it through persisted guest plans and `useGraduationPreview` semester/virtual-course conversion.

- [ ] **Step 5: Verify GREEN**

  Run: `npx tsx --test tests/guest-department-integrity.test.ts`

  Expected: all guest department and track-attribution tests pass.

### Task 3: Save and scope custom courses to the active department

**Files:**
- Modify: `tests/guest-department-integrity.test.ts`
- Modify: `src/components/features/CustomCourseForm.tsx`
- Modify: `src/components/features/CourseCatalog.tsx`
- Modify: `src/hooks/useCourses.ts`
- Modify: `src/services/course.service.ts`

**Interfaces:**
- Consumes: `CustomCourseForm.departmentId` supplied by the catalog.
- Produces: `CreateCourseInput.department` equal to the active primary/secondary department; department-scoped custom-course lists.

- [ ] **Step 1: Write failing custom-course tests**

  Add contract tests proving `CourseCatalog` passes the active department to `CustomCourseForm`, the form uses that prop for `department`, and member/guest custom-course lists include only the current department.

- [ ] **Step 2: Verify RED**

  Run: `npx tsx --test tests/guest-department-integrity.test.ts`

  Expected: failures showing the form re-reads the primary department and custom queries are not department-scoped.

- [ ] **Step 3: Use the active department in the form**

  Add a required target-department prop for department tabs, remove session/guest-profile department selection from `CustomCourseForm`, and pass the selected ID into both course creation and the immediate click-add DTO.

- [ ] **Step 4: Scope custom course queries**

  Add `{ department: filter.departmentId }` to member custom-course conditions. Filter guest custom courses by `effectiveFilter.departmentId`; on the common tab include only department-less guest custom courses.

- [ ] **Step 5: Verify GREEN**

  Run: `npx tsx --test tests/guest-department-integrity.test.ts`

  Expected: active-department creation and filtering tests pass.

### Task 4: Full verification and commit-readiness audit

**Files:**
- Review: all files changed by Tasks 1-3
- Preserve: untracked `AGENTS.md`

**Interfaces:**
- Produces: fresh evidence for tests, lint, TypeScript/build, diff quality, and Git synchronization.

- [ ] **Step 1: Run focused and full tests**

  Run: `npm test`

  Expected: zero failed tests.

- [ ] **Step 2: Run static and production checks**

  Run: `npm run lint`

  Run: `npx tsc --noEmit`

  Run: `npm run build`

  Expected: all commands exit 0 without new warnings attributable to this change.

- [ ] **Step 3: Inspect the complete diff**

  Run: `git diff --check`

  Run: `git diff --stat`

  Run: `git status --short --branch`

  Verify every explicit requirement has direct code and test evidence and `AGENTS.md` remains untouched/untracked.

- [ ] **Step 4: Request independent code review**

  Give a reviewer the objective, design, plan, and complete uncommitted diff. Fix all Critical and Important findings, then rerun affected and full checks.

- [ ] **Step 5: Check remote synchronization**

  Run: `git fetch --all --prune`

  Run: `git rev-list --left-right --count main...origin/main`

  Expected: local branch is not unexpectedly behind and the scoped changes are ready for a single intentional commit without staging `AGENTS.md`.
