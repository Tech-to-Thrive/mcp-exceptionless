import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  apiKey: string;
  apiUrl: string;
  projectId?: string;
  timeout: number;
  debug: boolean;
}

export function loadConfig(): Config {
  const apiKey = process.env.EXCEPTIONLESS_API_KEY;
  const apiUrl = process.env.EXCEPTIONLESS_API_URL || 'https://api.exceptionless.com';
  const projectId = process.env.EXCEPTIONLESS_PROJECT_ID;
  const timeout = parseInt(process.env.EXCEPTIONLESS_TIMEOUT || '30000');
  const debug = process.env.EXCEPTIONLESS_DEBUG === 'true';

  if (!apiKey) {
    throw new Error(
      'EXCEPTIONLESS_API_KEY is required. Set it in your environment or .env file.\n' +
      'Get your API key from: https://app.exceptionless.com/project/list'
    );
  }

  if (apiKey.length < 20) {
    throw new Error('EXCEPTIONLESS_API_KEY appears invalid (too short)');
  }

  try {
    new URL(apiUrl);
  } catch {
    throw new Error(`Invalid EXCEPTIONLESS_API_URL: ${apiUrl}`);
  }

  if (timeout <= 0 || timeout > 600000) {
    throw new Error('EXCEPTIONLESS_TIMEOUT must be between 1 and 600000 ms');
  }

  return { apiKey, apiUrl, projectId, timeout, debug };
}
