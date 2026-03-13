import { AxiosError } from 'axios';

export interface McpError {
  code: string;
  message: string;
  suggestion?: string;
  details?: any;
}

export function formatApiError(error: AxiosError): McpError {
  if (!error.response) {
    if (error.code === 'ECONNREFUSED') {
      return {
        code: 'NETWORK_CONNECTION_REFUSED',
        message: 'Cannot connect to Exceptionless API',
        suggestion: 'Check your internet connection and verify the API URL'
      };
    }

    if (error.code === 'ETIMEDOUT') {
      return {
        code: 'NETWORK_TIMEOUT',
        message: 'Request timed out',
        suggestion: 'The request took too long. Try again or increase timeout'
      };
    }

    return {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network error occurred',
      suggestion: 'Check your internet connection'
    };
  }

  const status = error.response.status;
  const responseData = error.response.data as any;

  if (status === 400) {
    return {
      code: 'BAD_REQUEST',
      message: responseData?.message || 'Invalid request parameters',
      details: responseData,
      suggestion: 'Check your input parameters'
    };
  }

  if (status === 401) {
    return {
      code: 'AUTH_INVALID_KEY',
      message: 'Authentication failed: Invalid API key',
      suggestion: 'Check your EXCEPTIONLESS_API_KEY. Generate a new key at https://app.exceptionless.com/project/list'
    };
  }

  if (status === 403) {
    return {
      code: 'AUTH_FORBIDDEN',
      message: 'Forbidden: Insufficient permissions',
      suggestion: 'This API key may not have permission for this operation'
    };
  }

  if (status === 404) {
    return {
      code: 'NOT_FOUND',
      message: responseData?.message || 'Resource not found',
      details: { url: error.config?.url }
    };
  }

  if (status === 426) {
    return {
      code: 'ORG_SUSPENDED',
      message: 'Organization suspended',
      suggestion: 'Check your organization billing status at https://app.exceptionless.com/account/manage'
    };
  }

  if (status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    return {
      code: 'RATE_LIMIT',
      message: 'Rate limit exceeded',
      details: { retry_after: retryAfter },
      suggestion: `Too many requests. Wait ${retryAfter || '60'} seconds before retrying`
    };
  }

  if (status >= 500) {
    return {
      code: 'API_ERROR',
      message: 'Exceptionless API error',
      details: { status, message: responseData?.message },
      suggestion: 'This is a server-side issue. Try again in a few moments'
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: responseData?.message || error.message || 'An unknown error occurred',
    details: { status, data: responseData }
  };
}
