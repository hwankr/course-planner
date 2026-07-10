import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/course-planner-test';
process.env.NEXTAUTH_SECRET ||= 'test-nextauth-secret';
process.env.GOOGLE_CLIENT_ID ||= 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET ||= 'test-google-client-secret';

const EXPECTED_DUMMY_PASSWORD_HASH =
  '$2b$12$Pi89zBOq/7QIWXDuIlN/QeyU3dGf6rPhLmPCusA09xZ7QgcKQkA6q';
const EXPECTED_LOGIN_FAILURE_MESSAGE =
  '이메일 또는 비밀번호가 올바르지 않습니다. 잠시 후 다시 시도해주세요.';

interface CredentialInput {
  email: string;
  password: string;
  source: string;
}

interface ThrottleInput {
  email: string;
  source: string;
}

interface CredentialUser {
  _id: { toString(): string };
  email: string;
  password?: string;
  name: string;
  image?: string;
  department?: { toString(): string };
  role: 'student' | 'admin';
  onboardingCompleted: boolean;
  majorType?: 'single' | 'double' | 'minor';
  secondaryDepartment?: { toString(): string };
  curriculumYear?: number;
}

interface AuthenticationDependenciesDouble {
  isBlocked(input: ThrottleInput): Promise<boolean>;
  findByEmailWithPassword(email: string): Promise<CredentialUser | null>;
  comparePassword(plainPassword: string, passwordHash: string): Promise<boolean>;
  recordFailure(input: ThrottleInput): Promise<void>;
  clearPair(input: ThrottleInput): Promise<void>;
}

interface AuthenticationServiceDouble {
  authenticateCredentials(input: CredentialInput): Promise<CredentialUser | null>;
}

interface AuthenticationModuleDouble {
  DUMMY_PASSWORD_HASH: string;
  createAuthenticationService(
    dependencies: AuthenticationDependenciesDouble
  ): AuthenticationServiceDouble;
  authenticationService: AuthenticationServiceDouble;
}

interface AuthenticationHarnessOptions {
  blocked?: boolean;
  compareResult?: boolean;
  findByEmail?: (email: string) => CredentialUser | null;
}

function createUser(
  overrides: Partial<CredentialUser> = {}
): CredentialUser {
  return {
    _id: { toString: () => 'user-1' },
    email: 'student@example.com',
    password: 'real-password-hash',
    name: 'Student',
    role: 'student',
    onboardingCompleted: true,
    majorType: 'single',
    ...overrides,
  };
}

async function loadAuthenticationModule(): Promise<AuthenticationModuleDouble> {
  try {
    return (await import(
      '../src/services/authentication.service'
    )) as unknown as AuthenticationModuleDouble;
  } catch (error) {
    assert.fail(`authentication service is unavailable: ${String(error)}`);
  }
}

async function createHarness(options: AuthenticationHarnessOptions = {}) {
  const { createAuthenticationService } = await loadAuthenticationModule();
  const calls = {
    blocked: [] as ThrottleInput[],
    clear: [] as ThrottleInput[],
    compared: [] as Array<{ plainPassword: string; passwordHash: string }>,
    failures: [] as ThrottleInput[],
    lookups: [] as string[],
  };

  const service = createAuthenticationService({
    isBlocked: async (input) => {
      calls.blocked.push(input);
      return options.blocked ?? false;
    },
    findByEmailWithPassword: async (email) => {
      calls.lookups.push(email);
      return options.findByEmail?.(email) ?? null;
    },
    comparePassword: async (plainPassword, passwordHash) => {
      calls.compared.push({ plainPassword, passwordHash });
      return options.compareResult ?? false;
    },
    recordFailure: async (input) => {
      calls.failures.push(input);
    },
    clearPair: async (input) => {
      calls.clear.push(input);
    },
  });

  return { calls, service };
}

async function loadAuthOptionsModules() {
  const [optionsModule, servicesModule, sourceModule] = await Promise.all([
    import('../src/lib/auth/options'),
    import('../src/services'),
    import('../src/lib/auth/client-source'),
  ]);

  return {
    authOptions: optionsModule.authOptions,
    createCredentialsAuthorize: optionsModule.createCredentialsAuthorize,
    getCredentialClientSource: sourceModule.getCredentialClientSource,
    userService: servicesModule.userService,
  };
}

function getCredentialsProvider(
  authOptions: Awaited<ReturnType<typeof loadAuthOptionsModules>>['authOptions']
) {
  const provider = authOptions.providers.find(
    (candidate) => candidate.type === 'credentials'
  );
  assert.ok(provider && provider.type === 'credentials');
  return provider;
}

test('the fixed dummy hash is the specified cost-12 bcrypt hash', async () => {
  const { DUMMY_PASSWORD_HASH } = await loadAuthenticationModule();

  assert.equal(DUMMY_PASSWORD_HASH, EXPECTED_DUMMY_PASSWORD_HASH);
  assert.match(DUMMY_PASSWORD_HASH, /^\$2b\$12\$[./A-Za-z0-9]{53}$/);
});

test('missing email and missing password each perform exactly one comparison', async () => {
  const realUser = createUser();
  const { calls, service } = await createHarness({
    findByEmail: (email) =>
      email === realUser.email ? realUser : null,
  });

  assert.equal(
    await service.authenticateCredentials({
      email: '',
      password: 'provided-password',
      source: 'source-a',
    }),
    null
  );
  assert.equal(
    await service.authenticateCredentials({
      email: ' STUDENT@EXAMPLE.COM ',
      password: '',
      source: 'source-b',
    }),
    null
  );

  assert.deepEqual(calls.compared, [
    {
      plainPassword: 'provided-password',
      passwordHash: EXPECTED_DUMMY_PASSWORD_HASH,
    },
    { plainPassword: '', passwordHash: 'real-password-hash' },
  ]);
  assert.deepEqual(calls.failures, [
    { email: '', source: 'source-a' },
    { email: 'student@example.com', source: 'source-b' },
  ]);
  assert.deepEqual(calls.clear, []);
});

test('absent and OAuth-only accounts take the same public failure path', async () => {
  let lookupResult: CredentialUser | null = null;
  const { calls, service } = await createHarness({
    findByEmail: () => lookupResult,
  });

  assert.equal(
    await service.authenticateCredentials({
      email: 'missing@example.com',
      password: 'Wrong123',
      source: 'source-a',
    }),
    null
  );
  lookupResult = createUser({
    email: 'oauth@example.com',
    password: undefined,
  });
  assert.equal(
    await service.authenticateCredentials({
      email: 'oauth@example.com',
      password: 'Wrong123',
      source: 'source-a',
    }),
    null
  );

  assert.deepEqual(
    calls.compared.map(({ passwordHash }) => passwordHash),
    [EXPECTED_DUMMY_PASSWORD_HASH, EXPECTED_DUMMY_PASSWORD_HASH]
  );
  assert.deepEqual(calls.failures, [
    { email: 'missing@example.com', source: 'source-a' },
    { email: 'oauth@example.com', source: 'source-a' },
  ]);
  assert.deepEqual(calls.clear, []);
});

test('a matching dummy comparison never authenticates an absent or OAuth-only account', async () => {
  let lookupResult: CredentialUser | null = null;
  const { calls, service } = await createHarness({
    compareResult: true,
    findByEmail: () => lookupResult,
  });

  assert.equal(
    await service.authenticateCredentials({
      email: 'missing@example.com',
      password: 'anything',
      source: 'source-a',
    }),
    null
  );
  lookupResult = createUser({ password: undefined });
  assert.equal(
    await service.authenticateCredentials({
      email: 'oauth@example.com',
      password: 'anything',
      source: 'source-a',
    }),
    null
  );

  assert.equal(calls.compared.length, 2);
  assert.equal(calls.failures.length, 2);
  assert.deepEqual(calls.clear, []);
});

test('a wrong password compares once with the real hash and records one throttle failure', async () => {
  const user = createUser();
  const { calls, service } = await createHarness({
    findByEmail: () => user,
  });

  assert.equal(
    await service.authenticateCredentials({
      email: ' Student@Example.com ',
      password: 'wrong-password',
      source: 'source-a',
    }),
    null
  );

  assert.deepEqual(calls.blocked, [
    { email: 'student@example.com', source: 'source-a' },
  ]);
  assert.deepEqual(calls.lookups, ['student@example.com']);
  assert.deepEqual(calls.compared, [
    {
      plainPassword: 'wrong-password',
      passwordHash: 'real-password-hash',
    },
  ]);
  assert.deepEqual(calls.failures, [
    { email: 'student@example.com', source: 'source-a' },
  ]);
  assert.deepEqual(calls.clear, []);
});

test('a blocked credential request short-circuits before lookup or comparison', async () => {
  const { calls, service } = await createHarness({ blocked: true });

  assert.equal(
    await service.authenticateCredentials({
      email: 'Student@Example.com',
      password: 'password',
      source: 'blocked-source',
    }),
    null
  );

  assert.deepEqual(calls.blocked, [
    { email: 'student@example.com', source: 'blocked-source' },
  ]);
  assert.deepEqual(calls.lookups, []);
  assert.deepEqual(calls.compared, []);
  assert.deepEqual(calls.failures, []);
  assert.deepEqual(calls.clear, []);
});

test('a valid password returns the user and clears only the pair bucket', async () => {
  const user = createUser();
  const { calls, service } = await createHarness({
    compareResult: true,
    findByEmail: () => user,
  });

  const result = await service.authenticateCredentials({
    email: ' STUDENT@EXAMPLE.COM ',
    password: 'correct-password',
    source: 'source-a',
  });

  assert.equal(result, user);
  assert.deepEqual(calls.compared, [
    {
      plainPassword: 'correct-password',
      passwordHash: 'real-password-hash',
    },
  ]);
  assert.deepEqual(calls.failures, []);
  assert.deepEqual(calls.clear, [
    { email: 'student@example.com', source: 'source-a' },
  ]);
});

test('Credentials authorize delegates source and returns null for every expected failure', async () => {
  const {
    authOptions,
    createCredentialsAuthorize,
    getCredentialClientSource,
  } =
    await loadAuthOptionsModules();
  getCredentialsProvider(authOptions);
  const inputs: CredentialInput[] = [];
  const captured: unknown[] = [];
  const authorize = createCredentialsAuthorize({
    authenticateCredentials: async (input) => {
      inputs.push(input);
      return null;
    },
    getClientSource: getCredentialClientSource,
    captureException: (error) => {
      captured.push(error);
    },
  });

  const result = await authorize(
    { email: 'Student@Example.com', password: 'Wrong123' },
    {
      body: {},
      query: {},
      headers: { 'x-forwarded-for': '203.0.113.40, 198.51.100.1' },
      method: 'POST',
    }
  );

  assert.equal(result, null);
  assert.deepEqual(inputs, [
    {
      email: 'Student@Example.com',
      password: 'Wrong123',
      source: '203.0.113.40',
    },
  ]);
  assert.deepEqual(captured, []);
});

test('Credentials authorize maps a successful database user without exposing its hash', async () => {
  const { createCredentialsAuthorize, getCredentialClientSource } =
    await loadAuthOptionsModules();
  const user = createUser({
    image: 'https://example.com/student.png',
    department: { toString: () => 'department-1' },
    secondaryDepartment: { toString: () => 'department-2' },
    curriculumYear: 2026,
  });
  const authorize = createCredentialsAuthorize({
    authenticateCredentials: async () => user as never,
    getClientSource: getCredentialClientSource,
    captureException: () => undefined,
  });

  const result = await authorize(
    { email: user.email, password: 'correct-password' },
    { body: {}, query: {}, headers: {}, method: 'POST' }
  );

  assert.deepEqual(result, {
    id: 'user-1',
    email: 'student@example.com',
    name: 'Student',
    image: 'https://example.com/student.png',
    department: 'department-1',
    role: 'student',
    onboardingCompleted: true,
    majorType: 'single',
    secondaryDepartment: 'department-2',
    curriculumYear: 2026,
  });
  assert.equal(Object.hasOwn(result!, 'password'), false);
});

test('Credentials authorize captures unexpected failures and fails closed', async () => {
  const { createCredentialsAuthorize, getCredentialClientSource } =
    await loadAuthOptionsModules();
  const failure = new Error('database unavailable');
  const captured: unknown[] = [];
  const authorize = createCredentialsAuthorize({
    authenticateCredentials: async () => {
      throw failure;
    },
    getClientSource: getCredentialClientSource,
    captureException: (error) => {
      captured.push(error);
    },
  });

  const result = await authorize(
    { email: 'student@example.com', password: 'secret-password' },
    {
      body: {},
      query: {},
      headers: { 'x-real-ip': '203.0.113.41' },
      method: 'POST',
    }
  );

  assert.equal(result, null);
  assert.deepEqual(captured, [failure]);
});

test('Google sign-in plus JWT and session population remain intact', async (t) => {
  const { authOptions, userService } = await loadAuthOptionsModules();
  const googleProvider = authOptions.providers.find(
    (provider) => provider.id === 'google'
  );
  assert.ok(googleProvider);
  assert.ok(authOptions.callbacks?.signIn);
  assert.ok(authOptions.callbacks?.jwt);
  assert.ok(authOptions.callbacks?.session);

  const oauthCalls: unknown[][] = [];
  t.mock.method(
    userService,
    'findOrCreateOAuthUser',
    async (...args: [string, string, string?]) => {
      oauthCalls.push(args);
      return createUser({ password: undefined }) as never;
    }
  );
  t.mock.method(
    userService,
    'findByEmail',
    async () =>
      createUser({
        password: undefined,
        department: { toString: () => 'department-1' },
      }) as never
  );
  t.mock.method(userService, 'updateLastLogin', async () => undefined);

  const account = {
    provider: 'google',
    providerAccountId: 'google-1',
    type: 'oauth' as const,
  };
  const profileUser = {
    id: 'google-profile-1',
    email: 'student@example.com',
    name: 'Student',
    image: 'https://example.com/student.png',
  };

  assert.equal(
    await authOptions.callbacks.signIn({
      user: profileUser,
      account,
      profile: {},
    }),
    true
  );
  assert.deepEqual(oauthCalls, [
    [
      'student@example.com',
      'Student',
      'https://example.com/student.png',
    ],
  ]);

  const token = await authOptions.callbacks.jwt({
    token: { id: '', email: 'student@example.com' },
    user: profileUser,
    account,
    trigger: 'signIn',
  });
  assert.equal(token.id, 'user-1');
  assert.equal(token.role, 'student');
  assert.equal(token.department, 'department-1');
  assert.equal(token.onboardingCompleted, true);
  assert.equal(token.majorType, 'single');

  const session = await authOptions.callbacks.session({
    session: {
      expires: '2026-07-11T00:00:00.000Z',
      user: {
        email: 'student@example.com',
        name: 'Student',
        image: null,
      },
    },
    token,
  } as never);
  const sessionUser = session.user as
    | {
        id?: string;
        role?: string;
        department?: string;
        onboardingCompleted?: boolean;
      }
    | undefined;
  assert.equal(sessionUser?.id, 'user-1');
  assert.equal(sessionUser?.role, 'student');
  assert.equal(sessionUser?.department, 'department-1');
  assert.equal(sessionUser?.onboardingCompleted, true);
});

test('client credential failures always use one fixed public message', async () => {
  const [messageSource, hook, page] = await Promise.all([
    readFile(
      new URL('../src/lib/auth/login-message.ts', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../src/hooks/useAuth.ts', import.meta.url), 'utf8'),
    readFile(
      new URL('../src/app/(auth)/login/page.tsx', import.meta.url),
      'utf8'
    ),
  ]);

  assert.match(messageSource, /export const LOGIN_FAILURE_MESSAGE/);
  assert.match(messageSource, new RegExp(EXPECTED_LOGIN_FAILURE_MESSAGE));
  assert.match(hook, /LOGIN_FAILURE_MESSAGE/);
  assert.match(hook, /!result\?\.ok\s*\|\|\s*result\.error/);
  assert.doesNotMatch(hook, /throw new Error\(result\.error\)/);
  assert.match(page, /LOGIN_FAILURE_MESSAGE/);
  assert.doesNotMatch(page, /err instanceof Error|err\.message/);
});

test('old User lock state and credential-specific errors are absent', async () => {
  const sources = await Promise.all(
    [
      '../src/models/User.ts',
      '../src/types/index.ts',
      '../src/services/user.service.ts',
      '../src/lib/auth/options.ts',
    ].map((path) => readFile(new URL(path, import.meta.url), 'utf8'))
  );
  const combined = sources.join('\n');

  for (const forbidden of [
    'isAccountLocked',
    'recordFailedLogin',
    'resetFailedLogins',
    'failedLoginAttempts',
    'lockUntil',
    'MAX_LOGIN_ATTEMPTS',
    'LOCK_TIME',
    '이메일과 비밀번호를 입력해주세요.',
    '등록되지 않은 이메일입니다.',
    'Google 계정으로 가입된 사용자입니다.',
    '비밀번호가 일치하지 않습니다.',
    '로그인 시도가 너무 많습니다.',
  ]) {
    assert.doesNotMatch(combined, new RegExp(forbidden));
  }

  assert.doesNotMatch(sources[2], /verifyPassword/);
});

test('authentication code logs no credential material and exports the service', async () => {
  const [authenticationSource, optionsSource, servicesIndex] =
    await Promise.all([
      readFile(
        new URL('../src/services/authentication.service.ts', import.meta.url),
        'utf8'
      ),
      readFile(new URL('../src/lib/auth/options.ts', import.meta.url), 'utf8'),
      readFile(new URL('../src/services/index.ts', import.meta.url), 'utf8'),
    ]);
  const serverAuthentication = `${authenticationSource}\n${optionsSource}`;

  assert.match(authenticationSource, /bcrypt\.compare/);
  assert.match(authenticationSource, /loginThrottleService\.recordFailure/);
  assert.match(authenticationSource, /loginThrottleService\.clearPair/);
  assert.match(optionsSource, /authorize:\s*createCredentialsAuthorize/);
  assert.match(optionsSource, /Sentry\.captureException\(error\)/);
  assert.doesNotMatch(serverAuthentication, /console\.(?:debug|error|info|log|warn)/);
  assert.doesNotMatch(
    serverAuthentication,
    /captureException\([^\n]*(?:email|password|source)/i
  );
  assert.match(servicesIndex, /authenticationService/);
  assert.match(servicesIndex, /createAuthenticationService/);
});
