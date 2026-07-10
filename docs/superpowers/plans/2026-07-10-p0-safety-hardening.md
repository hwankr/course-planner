# P0 Safety Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every bugfix. Parallel work is allowed only because the seed and ownership tasks modify disjoint files.

**Goal:** Make seed execution non-destructive and enforce custom-course ownership in the service layer, with regression tests.

**Architecture:** Seed scripts become idempotent synchronizers using stable natural keys. Plan mutation services receive the authenticated actor ID and use it in all custom-course access and deletion filters.

**Tech Stack:** TypeScript, Node test runner via `tsx`, Next.js route handlers, Mongoose.

## Global Constraints

- Preserve the existing untracked `AGENTS.md` file.
- Do not commit, push, or modify unrelated findings.
- API routes remain thin and pass authenticated identity to services.
- Official courses remain available to all users; custom courses are private to `createdBy`.
- No seed path may call `dropCollection()` or collection-wide `deleteMany({})`.

---

### Task 1: Test runner

**Files:**
- Modify: `package.json`

- [ ] Add `"test": "tsx --test"` without adding a dependency.
- [ ] Run the empty test command once and confirm the runner starts successfully.

### Task 2: Non-destructive seed synchronization

**Files:**
- Modify: `scripts/seed.ts`
- Modify: `scripts/seed-academic-events.ts`
- Test: `tests/seed-safety.test.ts`

- [ ] Write tests that require idempotent upsert helpers and reject destructive seed operations.
- [ ] Run the focused test and confirm it fails for the missing behavior.
- [ ] Replace collection drops/deletes and create-only writes with stable-key upserts.
- [ ] Run the focused test and confirm it passes.

### Task 3: Custom-course ownership enforcement

**Files:**
- Modify: `src/services/plan.service.ts`
- Modify: `src/types/index.ts` if the input interface needs the actor ID
- Modify: `src/app/api/plans/[id]/courses/route.ts`
- Modify: `src/app/api/plans/[id]/semesters/route.ts`
- Modify: `src/app/api/plans/[id]/route.ts`
- Test: `tests/plan-custom-course-ownership.test.ts`

- [ ] Write focused regression tests for cross-user add and delete attempts.
- [ ] Run the focused test and confirm it fails for the current unrestricted behavior.
- [ ] Pass `actorId` through route-to-service interfaces and scope custom-course queries/deletes to it.
- [ ] Run the focused test and confirm it passes.

### Task 4: Integration verification

**Files:**
- Modify only if a verification failure is directly caused by Tasks 1-3.

- [ ] Run `npm test`.
- [ ] Run TypeScript with `tsc --noEmit`.
- [ ] Run `npm run lint` and distinguish pre-existing findings from regressions.
- [ ] Run `npm run build`.
- [ ] Review `git diff` for scope, ownership coverage, and destructive seed calls.
