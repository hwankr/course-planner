# Administrator and Login Security Design

## Scope

This change closes three related authentication and authorization gaps:

1. The application must always retain at least one administrator. The invariant applies to role demotion, administrator-driven deletion, and self-service account deletion.
2. Non-throttled credential-login failures must not disclose whether an email is unregistered, belongs to a Google-only account, or has a wrong password. Those categories perform one real-or-dummy cost-12 bcrypt comparison. A throttled request keeps the same public response but intentionally skips lookup and bcrypt because the decision describes source activity, not account existence, and continuing cost-12 work would defeat the abuse control.
3. An unauthenticated attacker must not be able to lock another user's account by sending five bad passwords. Login abuse controls must work across Vercel function instances and process restarts.

The existing untracked `AGENTS.md` file remains outside the change. Registration currently discloses duplicate emails; that separate registration flow is not changed because this scope is specifically credential-login disclosure.

## Considered approaches

### Administrator invariant

- Count administrators and then update the target: small, but two concurrent requests can both observe another administrator and commit a zero-administrator state.
- Make one permanent owner or super-administrator undeletable: concurrency-safe, but introduces a new privileged role and operational ownership policy that the product does not otherwise need.
- Serialize administrator-decreasing mutations through a shared MongoDB guard document inside a transaction: recommended. Every demotion or deletion first increments the same guard revision, then checks for another administrator and performs all related writes with the same session.

A transaction without the shared write is insufficient because two transactions changing different user documents can exhibit write skew. Incrementing the singleton guard forces a write conflict and retry, so the retried operation observes the first committed administrator change.

### Login failure disclosure

- Change only the visible Korean strings: insufficient because NextAuth exposes thrown messages and missing/OAuth accounts skip the expensive bcrypt comparison.
- Return one public failure while retaining early exits internally: removes the obvious text oracle but leaves a timing oracle.
- Centralize credential authentication, atomically reserve throttle capacity before password work, perform exactly one bcrypt comparison using a real or dummy cost-12 hash for every admitted request, and return `null` for every expected failure: recommended. NextAuth then emits the same `CredentialsSignin` response while the client maps every failure to one fixed Korean message.

### Login abuse control

- Keep the current per-account hard lock and raise the threshold: a remote attacker can still deny service to a known account.
- Use the existing in-memory IP limiter: it avoids modifying the user account, but state is not shared across Vercel instances or restarts.
- Replace account fields with MongoDB TTL-backed source buckets and atomic pre-auth reservations: recommended. The source bucket is incremented first and admission is decided from its returned post-update count; an allowed source then reserves the source/email bucket the same way. Missing, OAuth-only, and password-mismatch accounts consume identical reservations, so throttle behavior does not reveal account existence.

The source-wide bucket limits password spraying from one origin. The source/email bucket limits repeated guessing of one account from that origin. This design intentionally does not globally block an email, so a distributed botnet remains a residual risk best addressed later with MFA, risk scoring, or CAPTCHA rather than a weaponizable account lock.

## Components and boundaries

### Administrator membership guard

- `AdminSecurityState` is a backend-only Mongoose model with the singleton ID `admin-membership` and a monotonically increasing `revision`.
- `userService.updateRole`, `userService.adminDeleteUser`, and a safe self-service deletion function are the only exported administrator-decreasing entry points.
- The raw cascade helper becomes private. API routes cannot bypass the invariant by calling it directly.
- Each protected operation ensures the guard exists, starts a MongoDB transaction, increments the guard revision as its first transactional write, then reads the target and checks `User.exists({ _id: { $ne: targetId }, role: 'admin' })` before an administrator is demoted or deleted.
- Cascade deletion methods accept an optional `ClientSession`; plans, custom courses, graduation requirements, feedback, patch-note reads, and the user document are deleted in one transaction.
- A typed `UserSecurityError` carries `LAST_ADMIN`, `SELF_DELETE`, `USER_NOT_FOUND`, and `TRANSACTIONS_UNAVAILABLE` codes. Routes map these codes to stable 409, 400, 404, and 503 responses without parsing error-message text. The exact canonical replica-set/mongos transaction message is always required; a plain `Error` with that message is accepted, while errors carrying MongoDB code metadata must also have code 20 and `IllegalOperation`. Arbitrary database errors remain ordinary 500 failures.

MongoDB transactions require a replica set or sharded cluster. Production must use Atlas or another transaction-capable deployment; local development can use a single-node replica set. Unsupported topology returns typed `TRANSACTIONS_UNAVAILABLE` and HTTP 503 for protected mutations. Tests must not mutate the configured database; transaction structure and serialization behavior are verified with controlled model/session doubles. Live Atlas topology remains an operational verification item rather than a completed claim.

### Credential authentication service

- `authenticationService.authenticateCredentials({ email, password, source })` owns all credential-login business logic and is HTTP-independent.
- It normalizes and bounds email/password input before HMAC, database, or bcrypt work, reserves shared throttle capacity, fetches the user with the password field, and performs exactly one `bcrypt.compare` call for every admitted request.
- Missing users and users without a credential password use a precomputed bcrypt cost-12 dummy hash. The dummy value is not a secret and must never be accepted as an account credential.
- Any missing input, over-limit input, absent user, Google-only user, password mismatch, or throttle state returns `null`.
- A successful credential clears its source/email reservation and refunds one source reservation only when the matching pair window was actually deleted and the original source window timestamp still matches. Replaying completion cannot refund twice; concurrent duplicate completions may conservatively skip a refund. A failed credential leaves both reservations in place.
- Unexpected database or hashing errors are captured internally without passwords and are exposed to the caller as the same generic login failure.

`authOptions.authorize` remains an adapter: it extracts the trusted Vercel client address, delegates once to the service, and maps a successful service result to the NextAuth user shape. It contains no account lookup, password comparison, lock mutation, or user-specific error text.

### Distributed login throttle

- `LoginThrottle` stores an opaque HMAC-derived `_id`, failure count, anchored first-attempt window start, and TTL expiry. Raw email addresses and IP addresses are not stored in throttle documents.
- Keys are derived with `NEXTAUTH_SECRET` for two independent scopes: source-wide and source/email.
- The source/email threshold is 5 failures per 15-minute fixed window anchored to its first attempt. The source-wide threshold is 20 failures per independently anchored 15-minute fixed window.
- Atomic aggregation-pipeline updates reset an expired window or increment the current counter in one database operation and return the post-update document. Source admission allows counts 1-20; pair admission allows counts 1-5. This bounds concurrent bcrypt work to 20 per source and 5 per source/email pair.
- Counters cap at limit plus one. Active-window increments, including rejected requests, retain the original `windowStartedAt` and `expiresAt`, so a blocked request cannot extend the window.
- `expiresAt` has a TTL index so stale buckets are removed automatically.
- In production or on Vercel the adapter accepts only the first IP in `x-vercel-forwarded-for`, validates it with `node:net` `isIP`, and canonicalizes it. Missing or invalid trusted source data throws typed `CredentialSourceUnavailableError` and fails authentication closed. Development/tests may use validated `x-forwarded-for` or `x-real-ip` fallbacks and use `local-development` only when all allowed headers are absent.

The old `failedLoginAttempts` and `lockUntil` fields are removed from application schema/types and are no longer read or written. `findAllUsers` uses a positive projection and explicit DTO, so those legacy fields and `password` cannot be serialized even when old documents still contain them.

## Data flow

### Administrator demotion or deletion

1. The API route authenticates the current database-backed administrator session and validates HTTP input.
2. The route calls the relevant user service method.
3. The service ensures the singleton guard exists and begins a transaction.
4. The service increments the shared revision, reads the target, and checks for another administrator when the operation would reduce administrator membership.
5. If no other administrator exists, the transaction aborts with `LAST_ADMIN`.
6. Otherwise, the role update or complete cascade deletion commits atomically.
7. The route returns the service result or maps the typed domain error.

### Credential login

1. NextAuth passes credentials and request headers to `authorize`.
2. The adapter derives a plain client-source string and calls the authentication service.
3. The service atomically reserves the source counter and decides from the returned post-increment count. If allowed, it reserves the source/email counter and decides from that post-increment count.
4. If both reservations are allowed, it performs one user lookup and one bcrypt comparison, selecting the real hash only for a credential account.
5. Every admitted invalid outcome leaves both reservations and returns `null`; a rejected outcome returns `null` before lookup/bcrypt without extending its window. A valid credential clears the matching pair window, refunds the matching source window, and returns a sanitized user.
6. NextAuth returns its standard success or `CredentialsSignin` response.
7. The client converts every unsuccessful result or transport exception to `이메일 또는 비밀번호가 올바르지 않습니다. 잠시 후 다시 시도해주세요.` and never renders `result.error` directly.

## Error handling and security invariants

- At least one user with `role: 'admin'` remains after every service-mediated role change or account deletion, including concurrent requests.
- A route cannot directly invoke an unguarded cascade deletion helper.
- Missing, over-limit, absent-account, Google-only, and wrong-password failures have the same NextAuth error code, HTTP status behavior, client message, user lookup shape, bcrypt cost, and admitted throttle reservations. A previously throttled request keeps the same public response while intentionally skipping lookup/bcrypt because throttle state is source activity rather than account state.
- Throttle decisions depend on attacker-controlled source activity, not on whether the submitted email exists.
- A failed login never writes lock state to a `User` document.
- A correct login from a different client source remains available after an attacker exhausts their own source/email bucket.
- Secrets, raw passwords, password hashes, raw source addresses, and raw throttle keys are not logged.
- Throttle-storage failures fail closed as a generic authentication failure.

## Testing and completion gates

- RED tests prove the current service can demote the final administrator, self-service deletion bypasses protection, and the raw cascade helper is route-callable.
- GREEN tests cover final-admin demotion, administrator deletion, self-deletion, normal promotion/demotion/deletion, typed errors, shared-guard ordering, and serialized concurrent administrator reductions.
- Credential tests cover missing input, absent account, Google-only account, wrong password, throttled source, and successful credentials. Each invalid non-throttled category must call bcrypt exactly once and expose the same public result.
- Throttle tests cover opaque deterministic keys, independent source and pair buckets, atomic anchored fixed-window admission/reset, limit-plus-one caps, anchored expiry, replay-safe success completion, and victim access from another source. Concurrent tests assert that 100 same-pair requests perform at most 5 bcrypt comparisons and 100 distinct-email requests from one source perform at most 20.
- Source-contract tests require the NextAuth adapter to delegate to the authentication service, require the fixed client error mapping, and reject old account-lock reads/writes and raw cascade route calls.
- Full completion requires focused RED/GREEN evidence, `npm test`, `npx tsc --noEmit --pretty false --incremental false`, `npm run lint`, `npm run build`, `npm audit --omit=dev`, `git -c core.whitespace=cr-at-eol diff --check`, a security re-review, and a final scope/status/divergence inspection.
