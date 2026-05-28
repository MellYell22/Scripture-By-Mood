export const OPENAI_API_KEY_ENV_NAME = 'OPENAI_API_KEY';

export function getOpenAIApiKey(): string | null {
  const rawKey = process.env[OPENAI_API_KEY_ENV_NAME];
  const key = rawKey?.trim();
  return key ? key : null;
}

export function getOpenAIKeyDiagnostics() {
  const rawKey = process.env[OPENAI_API_KEY_ENV_NAME];
  const key = rawKey?.trim() || '';

  return {
    envName: OPENAI_API_KEY_ENV_NAME,
    configured: Boolean(key),
    length: key.length,
    hasSurroundingWhitespace: Boolean(rawKey && rawKey !== key),
    keyType: key.startsWith('sk-proj-')
      ? 'project'
      : key.startsWith('sk-')
        ? 'standard'
        : key
          ? 'unknown'
          : 'missing',
  };
}

export function logOpenAIError(context: string, error: any) {
  const status = error?.status || error?.code || error?.response?.status || 'unknown';
  const type = error?.type || error?.error?.type || 'unknown';
  const code = error?.code || error?.error?.code || 'unknown';

  console.error(`[OpenAI] ${context} failed`, {
    status,
    type,
    code,
    message: redactOpenAIKey(error?.message || 'OpenAI request failed'),
    key: getOpenAIKeyDiagnostics(),
  });
}

export function getPublicOpenAIErrorMessage(error: any): string {
  if (error?.status === 401 || error?.code === 'invalid_api_key') {
    return `${OPENAI_API_KEY_ENV_NAME} is missing or invalid on the server.`;
  }

  return 'OpenAI request failed.';
}

function redactOpenAIKey(message: string): string {
  return message.replace(/sk-[A-Za-z0-9_-]+/g, '[redacted-openai-key]');
}
