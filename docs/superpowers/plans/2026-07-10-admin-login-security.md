# Administrator and Login Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve at least one administrator under concurrent mutations, make all credential-login failures non-enumerating, and replace weaponizable account locks with shared source-scoped throttling.

**Architecture:** Administrator-decreasing operations run in MongoDB transactions that first write one shared guard document, forcing concurrent demotions and deletions to serialize; unsupported transaction topology becomes a typed 503. Credential authentication atomically reserves source and source/email capacity before one admitted real-or-dummy bcrypt comparison, using MongoDB TTL buckets keyed by HMAC(source) and HMAC(source plus email). NextAuth and React remain thin adapters that expose one fixed failure.

**Tech Stack:** TypeScript, Node `node:test` through `tsx`, Next.js App Router, NextAuth 4, Mongoose 9, MongoDB transactions and TTL indexes, bcryptjs, Node `crypto`.

## Global Constraints

- Preserve the existing untracked `AGENTS.md` and all unrelated user files.
- Keep API routes limited to HTTP/session parsing, service calls, and response mapping.
- Never store or log raw passwords, password hashes, raw client addresses, or raw email addresses in throttle documents.
- Keep source/email at 5 failures per 15-minute fixed window anchored to its first attempt and source-wide at 20 failures per independently anchored fixed window.
- Reserve source capacity before pair capacity and decide admission from each returned post-update count, bounding concurrent bcrypt work to 20 and 5 respectively.
- Cap counters at limit plus one and never extend an active throttle window or TTL expiry.
- In production/Vercel trust only a validated, canonical first IP from `x-vercel-forwarded-for`; missing or invalid source data fails closed.
- Already-throttled requests intentionally skip lookup and bcrypt because throttle state represents source activity, not account existence, and cost-12 work would defeat abuse control.
- Use `NEXTAUTH_SECRET` to HMAC throttle identifiers; secret rotation may clear active throttles.
- Do not mutate the configured real database from tests.
- Do not change registration duplicate-email behavior in this change.
- Do not push. Leave reviewed local commits that are immediately pushable after the user decides.

---

### Task 1: Transactional last-administrator invariant

**Files:**
- Create: `src/models/AdminSecurityState.ts`
- Create: `src/services/user-security.error.ts`
- Modify: `src/models/index.ts`
- Modify: `src/services/user.service.ts`
- Modify: `src/services/plan.service.ts`
- Modify: `src/services/course.service.ts`
- Modify: `src/services/graduationRequirement.service.ts`
- Modify: `src/services/feedback.service.ts`
- Modify: `src/services/patchNote.service.ts`
- Modify: `src/app/api/admin/users/[id]/route.ts`
- Modify: `src/app/api/users/me/route.ts`
- Test: `tests/admin-membership-security.test.ts`

**Interfaces:**
- Produces: `UserSecurityError` with code `LAST_ADMIN | SELF_DELETE | USER_NOT_FOUND | TRANSACTIONS_UNAVAILABLE`.
- Produces: `userService.deleteOwnAccount(userId: string): Promise<void>`.
- Preserves: `userService.updateRole(userId, role)` and `userService.adminDeleteUser(targetUserId, adminUserId)` call signatures.
- Extends cascade service deletion functions with `session?: ClientSession`.

- [ ] **Step 1: Write failing administrator-invariant tests**

Add tests that require the role/deletion service source to increment `AdminSecurityState` before counting another administrator, require all cascade calls to receive one session, reject a final administrator demotion/deletion with `LAST_ADMIN`, require `/api/users/me` to call `deleteOwnAccount`, and reject any route call to `deleteWithCascade`.

```typescript
test('all administrator-decreasing mutations serialize on one guard write', async () => {
  const source = await readFile(resolve('src/services/user.service.ts'), 'utf8');
  assert.match(source, /AdminSecurityState\.updateOne\([\s\S]*\$inc:\s*\{\s*revision:\s*1/);
  assert.match(source, /withTransaction/);
  assert.match(source, /role:\s*'admin'/);
  assert.match(source, /\$ne:\s*targetUserId/);
});

test('self-service deletion cannot bypass administrator protection', async () => {
  const route = await readFile(resolve('src/app/api/users/me/route.ts'), 'utf8');
  assert.match(route, /userService\.deleteOwnAccount\(session\.user\.id\)/);
  assert.doesNotMatch(route, /deleteWithCascade/);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npx tsx --test tests/admin-membership-security.test.ts`

Expected: failures because the guard model, typed error, safe self-delete method, session-aware cascades, and transaction do not exist.

- [ ] **Step 3: Implement the guard model and typed errors**

```typescript
const adminSecurityStateSchema = new Schema(
  {
    _id: { type: String, required: true },
    revision: { type: Number, required: true, default: 0 },
  },
  { versionKey: false, collection: 'admin_security_state' }
);

export class UserSecurityError extends Error {
  constructor(
    public readonly code: 'LAST_ADMIN' | 'SELF_DELETE' | 'USER_NOT_FOUND',
    message: string
  ) {
    super(message);
    this.name = 'UserSecurityError';
  }
}
```

- [ ] **Step 4: Make cascade deletions session-aware**

Use the same optional signature in all five services and pass `{ session }` to the Mongoose delete call:

```typescript
async function deleteAllByUser(userId: string, session?: ClientSession): Promise<number> {
  await connectDB();
  const result = await Plan.deleteMany({ user: userId }, { session });
  return result.deletedCount;
}
```

Use `findOneAndDelete(filter, { session })` for the graduation requirement.

- [ ] **Step 5: Implement serialized transactions and safe public operations**

Use an existing guard document and increment it as the first write in every transaction:

```typescript
const ADMIN_MEMBERSHIP_GUARD_ID = 'admin-membership';

async function withAdminMembershipTransaction<T>(
  operation: (session: ClientSession) => Promise<T>
): Promise<T> {
  const db = await connectDB();
  await ensureAdminMembershipGuard();
  const session = await db.startSession();
  try {
    let value!: T;
    await session.withTransaction(async () => {
      await AdminSecurityState.updateOne(
        { _id: ADMIN_MEMBERSHIP_GUARD_ID },
        { $inc: { revision: 1 } },
        { session }
      );
      value = await operation(session);
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });
    return value;
  } finally {
    await session.endSession();
  }
}
```

Require the exact canonical `Transaction numbers are only allowed on a replica set member or mongos` message around session/transaction execution. Accept a plain `Error` with that exact message; when `code` or `codeName` metadata is present, require the complete code 20/`IllegalOperation` pair before converting to `UserSecurityError('TRANSACTIONS_UNAVAILABLE', ...)`. Preserve every unrelated database error unchanged. PATCH/DELETE admin-user routes and self-delete map that typed code to HTTP 503.

Within the callback, fetch the target using the session. Before reducing an administrator, require an existing different administrator:

```typescript
const anotherAdmin = await User.exists({
  _id: { $ne: targetUserId },
  role: 'admin',
}).session(session);
if (!anotherAdmin) {
  throw new UserSecurityError('LAST_ADMIN', '마지막 관리자는 강등하거나 삭제할 수 없습니다.');
}
```

Keep the raw cascade helper private and call each session-aware deletion sequentially inside the transaction. Export only `deleteOwnAccount`, `adminDeleteUser`, and `updateRole`.

- [ ] **Step 6: Map typed service errors in thin API routes**

```typescript
function userSecurityStatus(error: UserSecurityError): number {
  if (error.code === 'TRANSACTIONS_UNAVAILABLE') return 503;
  if (error.code === 'LAST_ADMIN') return 409;
  if (error.code === 'USER_NOT_FOUND') return 404;
  return 400;
}
```

Update the marker in `/api/users/me` to reference `userService.deleteOwnAccount` and remove string-`includes()` error classification from the admin route.

- [ ] **Step 7: Run focused and existing administrator tests**

Run: `npx tsx --test tests/admin-membership-security.test.ts tests/admin-authorization.test.ts`

Expected: all tests pass with no warnings.

- [ ] **Step 8: Commit the administrator invariant**

```powershell
git add -- 'src/models/AdminSecurityState.ts' 'src/models/index.ts' 'src/services/user-security.error.ts' 'src/services/user.service.ts' 'src/services/plan.service.ts' 'src/services/course.service.ts' 'src/services/graduationRequirement.service.ts' 'src/services/feedback.service.ts' 'src/services/patchNote.service.ts' ':(literal)src/app/api/admin/users/[id]/route.ts' 'src/app/api/users/me/route.ts' 'tests/admin-membership-security.test.ts'
git commit -m "fix: 마지막 관리자 불변식 보장"
```

### Task 2: Shared source-scoped login throttling

**Files:**
- Create: `src/models/LoginThrottle.ts`
- Create: `src/services/login-throttle.service.ts`
- Create: `src/lib/auth/client-source.ts`
- Modify: `src/models/index.ts`
- Modify: `src/services/index.ts`
- Test: `tests/login-throttle-security.test.ts`

**Interfaces:**
- Produces: `createLoginThrottleKeys({ source, email }, secret)` returning opaque `sourceKey` and `pairKey`.
- Produces: `loginThrottleService.reserveAttempt(input): Promise<LoginThrottleAdmission>` and `completeSuccessfulAttempt(reservation)`.
- Produces: `LoginThrottleReservation` carrying opaque keys plus source/pair window timestamps for safe success cleanup.
- Produces: `getCredentialClientSource(headers)` returning a validated/canonical source or throwing typed `CredentialSourceUnavailableError` in production.

- [ ] **Step 1: Write failing throttle tests**

```typescript
test('throttle keys are deterministic, scoped, and contain no raw identifiers', () => {
  const keys = createLoginThrottleKeys(
    { source: '203.0.113.10', email: 'Student@Example.com' },
    'test-secret'
  );
  assert.notEqual(keys.sourceKey, keys.pairKey);
  assert.doesNotMatch(JSON.stringify(keys), /203\.0\.113\.10|student@example\.com/i);
});

test('a blocked attacker source does not block another source for the same email', async () => {
  assert.equal((await harness.reserveAttempt({ source: 'attacker', email })).allowed, false);
  assert.equal((await harness.reserveAttempt({ source: 'victim', email })).allowed, true);
});
```

Also capture the `findOneAndUpdate` aggregation pipeline and assert it returns the post-update record, atomically resets or increments, caps at limit plus one, and preserves active-window timestamps/expiry. Verify success deletes/refunds only matching window timestamps.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npx tsx --test tests/login-throttle-security.test.ts`

Expected: module-not-found failures for the model, service, and source extractor.

- [ ] **Step 3: Implement the TTL model and opaque keys**

```typescript
const loginThrottleSchema = new Schema({
  _id: { type: String, required: true },
  failures: { type: Number, required: true, default: 0 },
  windowStartedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
}, { versionKey: false });

loginThrottleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

```typescript
const digest = (scope: string, value: string, secret: string) =>
  `${scope}:${createHmac('sha256', secret)
    .update(`v1:${scope}:${value}`)
    .digest('base64url')}`;
```

- [ ] **Step 4: Implement atomic pre-auth anchored fixed-window reservations**

Set `LOGIN_THROTTLE_WINDOW_MS = 15 * 60 * 1000`, pair maximum 5, and source maximum 20. Use one aggregation-pipeline update per key:

```typescript
const expired = {
  $or: [
    { $eq: [{ $type: '$windowStartedAt' }, 'missing'] },
    { $lte: ['$windowStartedAt', cutoff] },
  ],
};

await LoginThrottle.findOneAndUpdate(
  { _id: key },
  [{
    $set: {
      failures: {
        $cond: [
          expired,
          1,
          { $min: [{ $add: [{ $ifNull: ['$failures', 0] }, 1] }, limit + 1] },
        ],
      },
      windowStartedAt: { $cond: [expired, now, '$windowStartedAt'] },
      expiresAt: { $cond: [expired, newExpiry, '$expiresAt'] },
    },
  }],
  { upsert: true, returnDocument: 'after', updatePipeline: true }
);
```

`reserveAttempt` reserves the source first and rejects when its returned count exceeds 20. Only an allowed source reserves the pair, which rejects when its returned count exceeds 5. Pair rejection may retain the source reservation. `completeSuccessfulAttempt` decrements the source only when deletion actually removed the matching pair window and the source `windowStartedAt` still matches, preventing cleanup from touching a new window or refunding twice on replay.

- [ ] **Step 5: Implement trusted-header source extraction**

```typescript
const value = readHeader(headers, 'x-vercel-forwarded-for')
if (productionOrVercel && value === undefined) {
  throw new CredentialSourceUnavailableError();
}
const candidate = firstIp(value);
if (!isIP(candidate)) throw new CredentialSourceUnavailableError();
return canonicalizeIp(candidate);
```

Only non-production development/tests may fall back to validated `x-forwarded-for`/`x-real-ip`, with `local-development` used only when no allowed header is present.

- [ ] **Step 6: Run the focused throttle tests**

Run: `npx tsx --test tests/login-throttle-security.test.ts`

Expected: all key, threshold, reset, non-extension, source-isolation, and header-precedence cases pass.

- [ ] **Step 7: Commit shared throttling**

```powershell
git add src/models/LoginThrottle.ts src/models/index.ts src/services/login-throttle.service.ts src/services/index.ts src/lib/auth/client-source.ts tests/login-throttle-security.test.ts
git commit -m "feat: 로그인 시도 분산 제한 추가"
```

### Task 3: Non-enumerating credential authentication

**Files:**
- Create: `src/services/authentication.service.ts`
- Create: `src/lib/auth/login-message.ts`
- Modify: `src/services/index.ts`
- Modify: `src/lib/auth/options.ts`
- Modify: `src/hooks/useAuth.ts`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/models/User.ts`
- Modify: `src/types/index.ts`
- Modify: `src/services/user.service.ts`
- Test: `tests/credential-authentication-security.test.ts`

**Interfaces:**
- Produces: `createAuthenticationService(dependencies)` for deterministic unit tests without a database.
- Produces: `authenticationService.authenticateCredentials({ email, password, source }): Promise<IUserDocument | null>`.
- Produces: `LOGIN_FAILURE_MESSAGE` with one fixed Korean client message.
- Consumes: `loginThrottleService.reserveAttempt`, `completeSuccessfulAttempt`, and `getCredentialClientSource` from Task 2.

- [ ] **Step 1: Write failing credential and public-error tests**

Test missing input, bounded over-limit input, absent user, Google-only user, wrong password, blocked source, and valid password. For every admitted invalid category, assert one bcrypt call, the dummy hash when no real credential exists, one pre-auth reservation, and a `null` result. Add 100-request concurrency tests proving at most 5 same-pair and 20 distinct-email same-source comparisons.

```typescript
test('absent and OAuth-only accounts take the same public failure path', async (t) => {
  const comparedHashes: string[] = [];
  const reservedEmails: string[] = [];
  const reservation = {
    sourceKey: 'source-key',
    pairKey: 'pair-key',
    sourceWindowStartedAt: new Date(0),
    pairWindowStartedAt: new Date(0),
  };
  let lookupResult: { password?: string } | null = null;
  const service = createAuthenticationService({
    reserveAttempt: async ({ email }) => {
      reservedEmails.push(email);
      return { allowed: true, reservation };
    },
    findByEmailWithPassword: async () => lookupResult,
    comparePassword: async (_plain, hash) => {
      comparedHashes.push(hash);
      return false;
    },
    completeSuccessfulAttempt: async () => undefined,
  });

  assert.equal(await service.authenticateCredentials({
    email: 'missing@example.com', password: 'Wrong123', source: 'source-a',
  }), null);
  lookupResult = {};
  assert.equal(await service.authenticateCredentials({
    email: 'oauth@example.com', password: 'Wrong123', source: 'source-a',
  }), null);

  assert.deepEqual(comparedHashes, [DUMMY_PASSWORD_HASH, DUMMY_PASSWORD_HASH]);
  assert.deepEqual(reservedEmails, ['missing@example.com', 'oauth@example.com']);
});

test('client code never exposes NextAuth result.error', async () => {
  const hook = await readFile(resolve('src/hooks/useAuth.ts'), 'utf8');
  const page = await readFile(resolve('src/app/(auth)/login/page.tsx'), 'utf8');
  assert.doesNotMatch(hook, /new Error\(result\.error\)/);
  assert.match(hook, /LOGIN_FAILURE_MESSAGE/);
  assert.match(page, /LOGIN_FAILURE_MESSAGE/);
});
```

Add a source contract that rejects `isAccountLocked`, `recordFailedLogin`, `resetFailedLogins`, `failedLoginAttempts`, `lockUntil`, and all user-specific credential error strings.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npx tsx --test tests/credential-authentication-security.test.ts`

Expected: failures because authentication is still inline, public errors differ, timing paths differ, and user-level lock fields exist.

- [ ] **Step 3: Implement one-comparison authentication**

Use the generated cost-12 dummy hash and require a real stored password before accepting a matching result:

```typescript
const DUMMY_PASSWORD_HASH = '$2b$12$Pi89zBOq/7QIWXDuIlN/QeyU3dGf6rPhLmPCusA09xZ7QgcKQkA6q';

export function createAuthenticationService(deps: AuthenticationDependencies) {
  return { async authenticateCredentials(input: CredentialAuthenticationInput) {
  const emailInput = normalizeBoundedCredential(input.email, 320, normalizeEmail);
  const passwordInput = normalizeBoundedCredential(input.password, 1024);
  const email = emailInput.value;
  const admission = await deps.reserveAttempt({ source: input.source, email });
  if (!admission.allowed) return null;

  const user = await deps.findByEmailWithPassword(email);
  const passwordMatches = await deps.comparePassword(
    passwordInput.value,
    user?.password ?? DUMMY_PASSWORD_HASH
  );

  if (!email || !passwordInput.value || !emailInput.withinLimit ||
      !passwordInput.withinLimit || !user?.password || !passwordMatches) {
    return null;
  }

  await deps.completeSuccessfulAttempt(admission.reservation);
  return user;
  }};
}
```

Instantiate the exported production singleton with `userService.findByEmailWithPassword`, `bcrypt.compare`, and the two reservation lifecycle methods from `loginThrottleService`.

- [ ] **Step 4: Reduce NextAuth and client code to adapters**

`authorize(credentials, request)` derives the trusted source, delegates, catches unexpected exceptions, reports only a sanitized category/fingerprint to Sentry, and returns `null` for every failure. It never passes the original error, message, cause, request, user, email, password, or source address to diagnostics.

```typescript
const user = await authenticationService.authenticateCredentials({
  email: credentials?.email ?? '',
  password: credentials?.password ?? '',
  source: getCredentialClientSource(request.headers),
});
if (!user) return null;
```

Wrap `signIn` in `useAuth.login` and throw only the constant message for `result.error`, a non-OK result, or a transport exception. The page catch also uses the constant rather than an arbitrary exception message.

- [ ] **Step 5: Remove global account-lock state**

Remove `failedLoginAttempts` and `lockUntil` from `IUser`, the Mongoose schema, and all user-service lock helpers/exports. Keep password hashing and credential lookup unchanged.

- [ ] **Step 6: Run all focused security tests**

Run: `npx tsx --test tests/credential-authentication-security.test.ts tests/login-throttle-security.test.ts tests/admin-membership-security.test.ts tests/admin-authorization.test.ts`

Expected: all tests pass with identical public credential failures, bounded concurrent bcrypt work, trusted production source handling, and no user-level lock state.

- [ ] **Step 7: Commit non-enumerating authentication**

```powershell
git add -- 'src/services/authentication.service.ts' 'src/services/index.ts' 'src/lib/auth/login-message.ts' 'src/lib/auth/options.ts' 'src/hooks/useAuth.ts' ':(literal)src/app/(auth)/login/page.tsx' 'src/models/User.ts' 'src/types/index.ts' 'src/services/user.service.ts' 'tests/credential-authentication-security.test.ts'
git commit -m "fix: 로그인 계정 노출과 잠금 공격 차단"
```

### Task 4: Final whole-branch security review fixes

**Files:**
- Modify: `src/services/login-throttle.service.ts`
- Modify: `src/services/authentication.service.ts`
- Modify: `src/lib/auth/client-source.ts`
- Modify: `src/lib/auth/options.ts`
- Modify: `src/services/user-security.error.ts`
- Modify: `src/services/user.service.ts`
- Modify: `src/app/api/admin/users/[id]/route.ts`
- Modify: `src/app/api/users/me/route.ts`
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Test: `tests/final-security-hardening.test.ts`
- Test: `tests/login-throttle-security.test.ts`
- Test: `tests/credential-authentication-security.test.ts`
- Test: `tests/admin-membership-security.test.ts`

**Interfaces:**
- Replaces check-then-record throttle methods with atomic `reserveAttempt` and window-bound `completeSuccessfulAttempt`.
- Adds `CredentialSourceUnavailableError` and `UserSecurityError('TRANSACTIONS_UNAVAILABLE')`.
- Makes `findAllUsers` return an allowlisted DTO selected with a positive projection.

- [ ] **Step 1: Write and run focused RED tests**

Cover 100-request same-pair and distinct-email bursts, counter caps/anchored windows, safe success refund, trusted production source behavior, bounded credentials, narrow transaction classification, HTTP 503 contracts, malformed JSON, safe user DTOs, sanitized Sentry categories, and consistent CRLF adapters.

Run: `npx tsx --test tests/final-security-hardening.test.ts`

Expected: each newly required behavior fails against the pre-review implementation.

- [ ] **Step 2: Implement the reservation and adapter contracts**

Reserve source then pair using returned post-update counts, keep rejected activity capped at limit plus one without changing the active timestamps, and complete success only against matching window timestamps. Bound normalized credentials at 320/1024 characters before dependencies. In production/Vercel accept only canonical validated `x-vercel-forwarded-for`; use typed fail-closed behavior when unavailable.

- [ ] **Step 3: Implement topology, route, DTO, and diagnostic cleanup**

Convert only recognized unsupported-transaction failures to `TRANSACTIONS_UNAVAILABLE`, map them to 503 in all protected routes, handle malformed role-PATCH JSON as 400, use a positive user-list projection plus explicit DTO, and report only a safe Sentry category/tag/fingerprint.

- [ ] **Step 4: Update operational documentation and formatting**

Document Atlas/replica-set requirements, a local single-node replica-set URI/setup, explicit 503 behavior, trusted Vercel source requirements, and the fact that live Atlas topology remains unverified. Normalize `src/hooks/useAuth.ts` and `src/lib/auth/options.ts` to tracked CRLF without broad repository churn.

- [ ] **Step 5: Run focused GREEN tests**

Run: `npx tsx --test tests/admin-membership-security.test.ts tests/admin-authorization.test.ts tests/login-throttle-security.test.ts tests/credential-authentication-security.test.ts tests/final-security-hardening.test.ts`

Expected: all security tests pass, including exact 5/20 comparison bounds and narrow topology error behavior.

### Task 5: Full verification and security re-review

**Files:**
- Modify only task files whose verification failures are directly caused by Tasks 1-3.

**Interfaces:**
- Consumes every explicit invariant and completion gate in the design document.
- Produces a reviewed local branch with no task-related unstaged changes and no push performed.

- [ ] **Step 1: Run the complete automated test suite**

Run: `npm test`

Expected: zero failed, cancelled, skipped, or todo tests.

- [ ] **Step 2: Run static verification**

Run: `npx tsc --noEmit --pretty false --incremental false`

Expected: exit code 0.

Run: `npm run lint`

Expected: exit code 0 with no errors or warnings introduced by this change.

- [ ] **Step 3: Run a production build**

Run: `npm run build`

Expected: Next.js production build exits 0 and generates all routes.

- [ ] **Step 4: Re-run the dependency audit**

Run: `npm audit --omit=dev`

Expected: no critical or high findings. Record the existing four moderate transitive findings separately; do not run `npm audit fix --force` or accept a framework downgrade.

- [ ] **Step 5: Perform an independent security re-review**

Review the final diff for OWASP authentication failures, authorization bypasses, transaction write skew, raw identifier storage, timing discrepancies, unhandled source fallback, logging of secrets, and API/service separation. Fix every task-caused critical, high, or medium issue and repeat affected verification.

- [ ] **Step 6: Prove Git scope and push readiness**

Run: `git -c core.whitespace=cr-at-eol diff --check origin/main...HEAD`, `git status --short --branch`, `git diff origin/main...HEAD --stat`, `git log --oneline origin/main..HEAD`, and `git rev-list --left-right --count main...origin/main`.

Expected: the feature worktree is clean, the original checkout's untracked `AGENTS.md` remains untouched, every task file is committed, and no push has occurred.
