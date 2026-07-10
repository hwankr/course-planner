import type { Event } from '@sentry/nextjs';

export const CREDENTIAL_AUTH_CALLBACK_PATH =
  '/api/auth/callback/credentials';

function getRequestPath(url: string): string {
  try {
    return new URL(url, 'https://credential-scrubber.invalid').pathname;
  } catch {
    return url.split(/[?#]/, 1)[0];
  }
}

function normalizeRequestPath(path: string): string | undefined {
  let decoded = path;

  // Next routing decodes path segments. Repeat to cover nested encodings.
  while (decoded.includes('%')) {
    let next: string;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      return undefined;
    }
    if (next === decoded) break;
    decoded = next;
  }

  return decoded.length > 1 ? decoded.replace(/\/+$/, '') : decoded;
}

export function isCredentialAuthenticationCallbackUrl(url: unknown): boolean {
  return (
    typeof url === 'string' &&
    normalizeRequestPath(getRequestPath(url)) === CREDENTIAL_AUTH_CALLBACK_PATH
  );
}

export interface CredentialSafeHttpIntegrationOptions {
  disableIncomingRequestSpans: true;
  ignoreIncomingRequestBody: typeof isCredentialAuthenticationCallbackUrl;
}

interface NamedSentryIntegration {
  name: string;
}

export function buildCredentialSafeSentryIntegrations<
  T extends NamedSentryIntegration,
>(
  defaultIntegrations: readonly T[],
  createHttpIntegration: (
    options: CredentialSafeHttpIntegrationOptions
  ) => T
): T[] {
  return [
    ...defaultIntegrations.filter(({ name }) => name !== 'Http'),
    createHttpIntegration({
      // Preserve @sentry/nextjs 10.65's default: Next.js creates incoming spans.
      disableIncomingRequestSpans: true,
      ignoreIncomingRequestBody: isCredentialAuthenticationCallbackUrl,
    }),
  ];
}

export function scrubCredentialAuthenticationEvent<T extends Event>(event: T): T {
  const requestUrl = event.request?.url;
  if (!isCredentialAuthenticationCallbackUrl(requestUrl)) {
    return event;
  }

  const scrubbedEvent: Event = {
    ...event,
    request: {
      url: CREDENTIAL_AUTH_CALLBACK_PATH,
      ...(event.request?.method ? { method: event.request.method } : {}),
    },
  };
  delete scrubbedEvent.user;

  return scrubbedEvent as T;
}
