import { describe, it, expect } from 'vitest';
import { formatApiError } from '../../src/api/errors.js';
import { AxiosError } from 'axios';

describe('Error Formatting', () => {
  it('should format 401 error', () => {
    const error = {
      response: {
        status: 401,
        data: {},
        headers: {}
      },
      config: {}
    } as AxiosError;

    const formatted = formatApiError(error);

    expect(formatted.code).toBe('AUTH_INVALID_KEY');
    expect(formatted.message).toContain('Invalid API key');
  });

  it('should format 404 error', () => {
    const error = {
      response: {
        status: 404,
        data: { message: 'Not found' },
        headers: {}
      },
      config: { url: '/events/123' }
    } as AxiosError;

    const formatted = formatApiError(error);

    expect(formatted.code).toBe('NOT_FOUND');
    expect(formatted.message).toBe('Not found');
  });

  it('should format network error', () => {
    const error = {
      code: 'ECONNREFUSED',
      message: 'Connection refused'
    } as AxiosError;

    const formatted = formatApiError(error);

    expect(formatted.code).toBe('NETWORK_CONNECTION_REFUSED');
  });
});
