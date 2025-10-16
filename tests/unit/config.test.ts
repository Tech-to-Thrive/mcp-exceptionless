import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../../src/config/index.js';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load valid configuration', () => {
    process.env.EXCEPTIONLESS_API_KEY = 'test-key-1234567890123456';

    const config = loadConfig();

    expect(config.apiKey).toBe('test-key-1234567890123456');
    expect(config.apiUrl).toBe('https://api.exceptionless.io');
    expect(config.timeout).toBe(30000);
    expect(config.debug).toBe(false);
  });

  it('should use custom API URL', () => {
    process.env.EXCEPTIONLESS_API_KEY = 'test-key-1234567890123456';
    process.env.EXCEPTIONLESS_API_URL = 'https://custom.api.com';

    const config = loadConfig();

    expect(config.apiUrl).toBe('https://custom.api.com');
  });

  it('should throw error for missing API key', () => {
    delete process.env.EXCEPTIONLESS_API_KEY;

    expect(() => loadConfig()).toThrow('EXCEPTIONLESS_API_KEY is required');
  });

  it('should throw error for short API key', () => {
    process.env.EXCEPTIONLESS_API_KEY = 'short';

    expect(() => loadConfig()).toThrow('appears invalid');
  });
});
