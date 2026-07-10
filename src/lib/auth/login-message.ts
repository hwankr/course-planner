export const LOGIN_FAILURE_MESSAGE =
  '이메일 또는 비밀번호가 올바르지 않습니다. 잠시 후 다시 시도해주세요.';

export interface CredentialSignInResult {
  ok?: boolean;
  error?: string | null;
}

export function isCredentialSignInSuccessful(
  result: CredentialSignInResult | undefined
): boolean {
  return result?.ok === true && !result.error;
}

export async function handleCredentialSignIn(
  attempt: () => Promise<CredentialSignInResult | undefined>
): Promise<void> {
  let result: CredentialSignInResult | undefined;

  try {
    result = await attempt();
  } catch {
    throw new Error(LOGIN_FAILURE_MESSAGE);
  }

  if (!isCredentialSignInSuccessful(result)) {
    throw new Error(LOGIN_FAILURE_MESSAGE);
  }
}
