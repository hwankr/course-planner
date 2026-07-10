# P1 Runtime Security and Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every behavior change and superpowers:verification-before-completion before declaring the work ready.

**Goal:** Revalidate administrator privileges against current database state, make anonymous plan links independent of process memory, and patch compatible production dependency vulnerabilities.

**Architecture:** A service-backed shared auth helper replaces direct trust in JWT role claims for privileged API behavior. Anonymous plan IDs become department-bound HMAC digests that are resolved from current database candidates. Dependency upgrades are targeted to compatible patched releases and verified through npm audit and a full Next.js build.

**Tech Stack:** TypeScript, Node test runner via `tsx`, Next.js App Router, NextAuth v4, Mongoose, Node `crypto`, npm audit.

## Global Constraints

- Preserve the existing untracked `AGENTS.md` file.
- Do not commit or push; leave one reviewed, commit-ready P1 change set.
- Keep API routes limited to HTTP/session handling and calls into shared auth or service functions.
- Do not use `npm audit fix --force`, `--legacy-peer-deps`, or a NextAuth downgrade.
- Use `NEXTAUTH_SECRET` as the shared HMAC key; no new deployment secret is required.
- Malformed and cross-department anonymous IDs must return the existing not-found behavior.

---

### Task 1: Database-backed administrator authorization

**Files:**
- Create: `src/services/admin-auth.service.ts`
- Create: `src/lib/auth/admin-session.ts`
- Modify: API route files that contain `session.user.role` administrator branches
- Test: `tests/admin-authorization.test.ts`

**Interfaces:**
- Produces: `adminAuthService.isActiveAdmin(userId: string): Promise<boolean>`
- Produces: `isActiveAdminSession(session: Session | null): Promise<boolean>`

- [ ] Write tests requiring `isActiveAdmin` to accept only an existing database user with role `admin`.
- [ ] Write a source-contract test enumerating every API route with privileged role branching and requiring the shared helper.
- [ ] Run `npx tsx --test tests/admin-authorization.test.ts`; expect failures because the service/helper do not exist and routes trust JWT claims.
- [ ] Implement the service and helper, validating malformed IDs before querying MongoDB.
- [ ] Replace privileged role branches with the shared helper while preserving each route's current response and public/student behavior.
- [ ] Re-run the focused test; expect all administrator authorization cases to pass.

### Task 2: Restart-safe anonymous plan IDs

**Files:**
- Create: `src/lib/security/anonymous-plan-id.ts`
- Modify: `src/services/statistics.service.ts`
- Test: `tests/anonymous-plan-id.test.ts`

**Interfaces:**
- Produces: `createAnonymousPlanId(planId: string, departmentId: string, secret: string): string`
- Produces: `resolveAnonymousPlanId(planIds: readonly string[], anonymousId: string, departmentId: string, secret: string): string | null`

- [ ] Write tests for determinism across independent calls, tamper rejection, department binding, malformed input, and candidate resolution without cache state.
- [ ] Add a source-contract test rejecting `randomUUID`, `idMapping`, and detail dependence on `dept-plans` cache state.
- [ ] Run `npx tsx --test tests/anonymous-plan-id.test.ts`; expect failures for the missing HMAC implementation and current cache mapping.
- [ ] Implement versioned HMAC generation and constant-time candidate matching.
- [ ] Replace random list IDs and cache mapping with HMAC IDs; resolve detail from current department users/plans and scope detail cache keys by department.
- [ ] Re-run the focused test; expect all anonymous-ID cases to pass.

### Task 3: Compatible production dependency remediation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: npm registry advisory metadata through `npm audit --omit=dev`.
- Produces: a lockfile with patched direct dependencies and no unused Axios dependency.

- [ ] Record the baseline production audit: 30 findings, including 1 critical and 10 high.
- [ ] Confirm Axios has no source usage, then remove it.
- [ ] Install exact compatible patches for Next.js/ESLint config, React/React DOM, Mongoose, jsPDF, Sentry, NextAuth, and the MongoDB adapter without force flags.
- [ ] Run `npm audit --omit=dev`; expect zero critical findings and no patchable direct high-severity dependency finding.
- [ ] Run focused tests after lockfile changes to detect runtime/type compatibility regressions.

### Task 4: Full verification and commit-readiness audit

**Files:**
- Modify only files whose failures are directly caused by Tasks 1-3.

- [ ] Run `npm test`; expect zero failures.
- [ ] Run `npx tsc --noEmit --pretty false`; expect exit code 0.
- [ ] Run `npm run lint`; fix P1-caused errors and report any unrelated baseline separately.
- [ ] Run `npm run build`; expect a successful Next.js production build.
- [ ] Run `npm audit --omit=dev`; record remaining unfixable advisories explicitly.
- [ ] Run a CRLF-aware staged-equivalent diff check and inspect every changed/untracked task file.
- [ ] Confirm `main` has not diverged from `origin/main` and `AGENTS.md` remains excluded.
