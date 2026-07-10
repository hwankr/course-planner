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
  headers: CredentialClientHeaders
): string {
  const value =
    readHeader(headers, 'x-vercel-forwarded-for') ??
    readHeader(headers, 'x-forwarded-for') ??
    readHeader(headers, 'x-real-ip') ??
    'unknown';

  return value.split(',')[0].trim().slice(0, 128) || 'unknown';
}
