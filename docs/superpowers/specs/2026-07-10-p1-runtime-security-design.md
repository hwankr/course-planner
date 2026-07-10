# P1 Runtime Security and Resilience Design

## Scope

This change addresses the three P1 findings approved after the project-wide review:

1. A demoted or deleted administrator must lose administrator API access immediately, even while an old JWT cookie is still valid.
2. Anonymous plan detail links must survive cache expiry, process restarts, and requests handled by another server instance.
3. Patchable production dependency vulnerabilities must be removed without accepting `npm audit fix --force` downgrades.

The existing untracked `AGENTS.md` file remains outside the change. Lower-priority UX, graduation-progress, login-enumeration, and migration findings remain out of scope.

## Considered approaches

### Administrator authorization

- Refresh every JWT claim on every authenticated request: centralized, but adds a database read to all sessions and still makes authorization correctness depend on callback behavior.
- Add a token-version field: efficient after validation, but requires a schema migration and still needs a database or shared cache lookup to detect revocation.
- Revalidate privileged requests through one shared guard: recommended. Every API branch that grants administrator behavior asks the database whether the current session user still exists with `role: 'admin'`.

The implementation adds a service-level `isActiveAdmin(userId)` query and an auth helper that accepts the current NextAuth session. API routes keep HTTP response handling while the database-backed authorization decision remains outside the route.

### Anonymous plan identifiers

- Keep random UUID mappings in process memory: rejected because restart and multi-instance failures are the root defect.
- Store mappings in Redis or MongoDB: valid, but introduces infrastructure and lifecycle management for data that can be derived safely.
- Derive an opaque HMAC identifier from department and plan IDs: recommended. The identifier is stable across instances sharing `NEXTAUTH_SECRET`, does not expose the MongoDB ObjectId, and is bound to the requested department.

Listing creates `HMAC-SHA-256(secret, departmentId + planId)` identifiers. Detail lookup queries only candidate plans belonging to the requested department and matches their derived identifier. The detail path no longer depends on a prior list request or the in-memory cache.

### Dependency remediation

- Run `npm audit fix --force`: rejected because the audit proposes a breaking NextAuth downgrade.
- Upgrade every package to its latest major version: rejected because it expands compatibility risk beyond the security finding.
- Apply targeted compatible patches and remove unused Axios: recommended. Direct vulnerable packages move to patched versions and the lockfile is refreshed; remaining advisories without a compatible fix are documented rather than hidden.

## Components and data flow

### Administrator guard

- `adminAuthService.isActiveAdmin(userId)` validates the ID and queries `User.exists({ _id: userId, role: 'admin' })`.
- `isActiveAdminSession(session)` extracts the authenticated user ID and delegates to the service.
- Every API route that currently trusts `session.user.role` for privileged access or privileged output uses the shared helper instead.
- Anonymous and normal student branches keep their current behavior.

### Anonymous plans

- `createAnonymousPlanId(planId, departmentId, secret)` returns a versioned base64url HMAC digest.
- `resolveAnonymousPlanId(candidates, anonymousId, departmentId, secret)` performs constant-time comparisons and returns only a candidate from the requested department set.
- Department plan list cache stores summaries only; it no longer stores an ID-to-ObjectId map.
- Detail cache keys include the department ID as defense in depth.

### Dependencies

- Remove unused `axios`.
- Upgrade Next.js and `eslint-config-next` together to `16.2.10`.
- Upgrade React and React DOM together to `19.2.7`.
- Upgrade Mongoose to `9.7.4`, jsPDF to `4.2.1`, Sentry to `10.65.0`, NextAuth to `4.24.14`, and the MongoDB adapter to `3.11.2`.
- Accept only lockfile changes produced by npm; do not use `--force` or legacy peer-dependency bypasses.

## Error handling and security invariants

- Missing, malformed, deleted, or non-admin session users are denied privileged behavior.
- A stale JWT role is never sufficient for administrator API authorization.
- Malformed or cross-department anonymous IDs resolve to `null` and return the existing 404 response.
- Rotating `NEXTAUTH_SECRET` intentionally invalidates existing anonymous links, matching session-secret rotation semantics.
- No anonymous ID lookup depends on a cache being warm.
- Production audit completion requires zero critical vulnerabilities and no patchable direct high-severity vulnerability.

## Testing and completion gates

- RED tests prove stale administrator sessions currently pass source-level role checks and that active-admin lookup behavior does not yet exist.
- RED tests prove the current random UUID mapping cannot be recreated after state loss.
- GREEN tests cover active, demoted, deleted, malformed, tampered, and cross-department authorization/identifier cases.
- Source-contract tests enumerate every API route with administrator role branching and require use of the shared guard.
- Dependency audit before the change is the RED baseline; the post-update audit is the GREEN evidence.
- Completion requires all tests, TypeScript, full ESLint, a production build, `npm audit --omit=dev`, and a final diff/scope review.
