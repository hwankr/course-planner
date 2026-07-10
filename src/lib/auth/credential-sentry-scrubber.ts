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

export function scrubCredentialAuthenticationEvent<T extends Event>(event: T): T {
  const requestUrl = event.request?.url;
  if (
    typeof requestUrl !== 'string' ||
    getRequestPath(requestUrl) !== CREDENTIAL_AUTH_CALLBACK_PATH
  ) {
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
