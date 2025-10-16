import axios, { AxiosInstance, AxiosError } from 'axios';
import { Config } from '../config/index.js';
import { formatApiError } from './errors.js';
import { retryWithBackoff } from './retry.js';
import { logger } from '../utils/logger.js';

export class ExceptionlessClient {
  private client: AxiosInstance;
  private config: Config;

  constructor(config: Config) {
    this.config = config;

    this.client = axios.create({
      baseURL: `${config.apiUrl}/api/v2`,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'mcp-exceptionless/1.0.0'
      }
    });

    this.client.interceptors.request.use(
      (config) => {
        if (this.config.debug) {
          logger.debug({ method: config.method, url: config.url }, 'API Request');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        if (this.config.debug) {
          logger.debug({ status: response.status, url: response.config.url }, 'API Response');
        }
        return response;
      },
      async (error: AxiosError) => {
        if (this.config.debug) {
          logger.error({ error: error.message, url: error.config?.url }, 'API Error');
        }

        if (this.shouldRetry(error)) {
          return retryWithBackoff(() => this.client.request(error.config!), {
            maxRetries: 3,
            baseDelay: 1000
          });
        }

        throw formatApiError(error);
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    if (!error.response) return true;
    if (error.response.status === 429) return true;
    if (error.response.status >= 500) return true;
    return false;
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }
}
