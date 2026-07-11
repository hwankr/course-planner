import { isIP } from 'node:net';

export interface CredentialHeaderReader {
  get(name: string): string | null;
}

export type CredentialHeaderRecord = Readonly<
  Record<string, string | readonly string[] | null | undefined>
>;

export type CredentialClientHeaders =
  | CredentialHeaderReader
  | CredentialHeaderRecord
  | undefined;

export interface CredentialClientSourceRuntime {
  production?: boolean;
  vercel?: boolean;
}

export class CredentialSourceUnavailableError extends Error {
  readonly code = 'SOURCE_UNAVAILABLE' as const;

  constructor() {
    super('Credential client source is unavailable.');
    this.name = 'CredentialSourceUnavailableError';
  }
}

function isHeaderReader(
  headers: CredentialClientHeaders
): headers is CredentialHeaderReader {
  return typeof (headers as CredentialHeaderReader | undefined)?.get === 'function';
}

function readHeader(
  headers: CredentialClientHeaders,
  name: string
): string | undefined {
  if (!headers) return undefined;

  if (isHeaderReader(headers)) {
    return headers.get(name) ?? undefined;
  }

  const entry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === name
  );
  const value = entry?.[1];
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : undefined;
}

export function getCredentialClientSource(
  headers: CredentialClientHeaders,
  runtime: CredentialClientSourceRuntime = {}
): string {
  const requiresTrustedVercelSource =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    runtime.production === true ||
    runtime.vercel === true;
  const value = requiresTrustedVercelSource
    ? readHeader(headers, 'x-vercel-forwarded-for')
    : readHeader(headers, 'x-vercel-forwarded-for') ??
      readHeader(headers, 'x-forwarded-for') ??
      readHeader(headers, 'x-real-ip');

  if (value === undefined) {
    if (!requiresTrustedVercelSource) return 'local-development';
    throw new CredentialSourceUnavailableError();
  }

  const candidate = value.split(',')[0].trim();
  const version = isIP(candidate);
  if (version === 4) return candidate;

  if (version === 6) {
    const hostname = new URL(`http://[${candidate}]/`).hostname;
    return hostname.slice(1, -1);
  }

  throw new CredentialSourceUnavailableError();
}
