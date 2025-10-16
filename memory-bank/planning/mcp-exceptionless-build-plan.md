# Exceptionless MCP Server - Complete Build Plan

**Purpose**: Complete self-contained implementation guide for building production-ready Exceptionless MCP server.

**Target**: Claude Code users accessing Exceptionless API via MCP.

**Deployment**: npm package, local stdio transport, API key authentication.

---

## Project Constraints & Requirements

### Hard Requirements
- ✅ stdio transport ONLY (Claude Code, local execution)
- ✅ npm package distribution (npx -y mcp-exceptionless)
- ✅ API key authentication (user provides in Claude Code settings)
- ✅ TypeScript for type safety
- ✅ Production quality (error handling, validation, logging)
- ✅ 18 tools (8 Event + 10 Stack)
- ✅ All tools must work with Exceptionless API v2

### Not Required
- ❌ No remote hosting (SSE/HTTP transports)
- ❌ No OAuth (API key only)
- ❌ No phases (build complete in one go)
- ❌ No timelines (just implementation checklist)
- ❌ No organization/project management tools
- ❌ No webhook tools
- ❌ No user management tools

### Success Criteria
- User can install with one command: `npx -y mcp-exceptionless`
- User configures API key in Claude Code settings
- All 18 tools work reliably
- Error messages are clear and actionable
- Documentation is comprehensive
- Code is production-quality
- **Minimal token usage** - responses are concise yet complete

---

## Token Optimization Strategy

### Critical: Minimize LLM Token Usage

All tools MUST minimize token usage while providing complete information:

**1. Use Summary Mode by Default**
- All list tools (get-events, get-stacks, get-sessions) default to `mode=summary`
- Summary mode returns lightweight objects (key fields only)
- User can override to `mode=full` when needed

**2. Smart Pagination Defaults**
- Default `limit=5` (not 10) for list operations
- This reduces response size by 50%
- User can increase limit up to 100 if needed
- Encourage cursor-based pagination over large page numbers

**3. Compact Response Formatting**
- Return JSON directly (no verbose wrapper messages)
- Only add explanatory text for errors
- Let raw data speak for itself
- Remove unnecessary whitespace in production

**4. Field Selection**
- For detailed queries (get-event, get-stack), return full object
- For lists, rely on API's summary mode to reduce fields
- Don't fetch data that won't be used

**5. Tool Consolidation**
- 18 tools is minimal - each serves distinct purpose
- Don't create redundant tools
- Each tool should be single-purpose and efficient

**6. Avoid Extra API Calls**
- Never make multiple API calls to "enrich" data
- Return raw API response directly
- Let user decide if they need more details (separate tool call)

**7. Error Message Efficiency**
- Error messages: concise, actionable, structured
- No verbose explanations unless helpful
- JSON error format with code, message, suggestion

**Implementation Guidelines**:

```typescript
// ✅ GOOD: Minimal response
return {
  content: [{
    type: 'text',
    text: JSON.stringify(result) // Raw data, no wrapper
  }]
};

// ❌ BAD: Verbose response
return {
  content: [{
    type: 'text',
    text: `I found ${result.length} events:\n\n` +
          JSON.stringify(result, null, 2) + // Extra formatting
          `\n\nThese are your recent events from Exceptionless.`
  }]
};

// ✅ GOOD: Summary mode default
const GetEventsSchema = z.object({
  mode: z.enum(['full', 'summary']).optional().default('summary'),
  limit: z.number().min(1).max(100).optional().default(5)
});

// ✅ GOOD: Concise error
return {
  content: [{
    type: 'text',
    text: JSON.stringify({
      error: 'AUTH_INVALID_KEY',
      message: 'Invalid API key',
      suggestion: 'Check EXCEPTIONLESS_API_KEY'
    })
  }],
  isError: true
};

// ❌ BAD: Verbose error
return {
  content: [{
    type: 'text',
    text: `I'm sorry, but I encountered an error while trying to retrieve your events. ` +
          `The Exceptionless API returned a 401 Unauthorized error, which typically means ` +
          `that your API key is invalid or has expired. Please check your configuration...`
  }],
  isError: true
};
```

**Token Savings**:
- mode=summary: ~60-70% reduction in response size
- limit=5 vs 10: 50% reduction in list size
- No wrapper text: ~20-30% reduction
- Compact JSON: ~10-15% reduction
- **Combined**: ~80-85% total token reduction

---

## Complete Project Structure

```
mcp-exceptionless/
├── src/
│   ├── index.ts                      # Entry point, stdio server setup
│   ├── server.ts                     # MCP server creation and tool registration
│   ├── config/
│   │   ├── index.ts                  # Load config from env/file
│   │   ├── validation.ts             # Validate config with zod
│   │   └── types.ts                  # Config type definitions
│   ├── api/
│   │   ├── client.ts                 # Axios HTTP client wrapper
│   │   ├── auth.ts                   # Bearer token auth middleware
│   │   ├── errors.ts                 # API error handling
│   │   ├── retry.ts                  # Retry logic with exponential backoff
│   │   ├── types.ts                  # API response types (from swagger)
│   │   └── endpoints.ts              # API endpoint URL constants
│   ├── tools/
│   │   ├── index.ts                  # Export all tools
│   │   ├── events/
│   │   │   ├── submit-event.ts       # POST event submission
│   │   │   ├── get-events.ts         # GET events with filtering
│   │   │   ├── get-event.ts          # GET single event by ID
│   │   │   ├── get-event-by-reference.ts  # GET by reference_id
│   │   │   ├── count-events.ts       # GET event counts
│   │   │   ├── delete-events.ts      # DELETE events bulk
│   │   │   ├── get-sessions.ts       # GET sessions list
│   │   │   └── get-session-events.ts # GET events in session
│   │   └── stacks/
│   │       ├── get-stacks.ts         # GET stacks with filtering
│   │       ├── get-stack.ts          # GET single stack by ID
│   │       ├── get-stack-events.ts   # GET events for stack
│   │       ├── mark-stack-fixed.ts   # POST mark as fixed
│   │       ├── mark-stack-critical.ts # POST mark as critical
│   │       ├── mark-stack-snoozed.ts # POST snooze until date
│   │       ├── change-stack-status.ts # POST general status change
│   │       ├── add-stack-link.ts     # POST add external link
│   │       ├── remove-stack-link.ts  # POST remove link
│   │       └── delete-stacks.ts      # DELETE stacks bulk
│   ├── validation/
│   │   ├── schemas.ts                # All zod schemas for tools
│   │   └── index.ts                  # Export validation functions
│   ├── utils/
│   │   ├── errors.ts                 # Error formatting utilities
│   │   ├── logger.ts                 # Structured logging (pino)
│   │   ├── formatting.ts             # Response formatting helpers
│   │   └── types.ts                  # Shared utility types
│   └── types/
│       ├── tools.ts                  # Tool parameter/response types
│       └── mcp.ts                    # MCP-specific types
├── tests/
│   ├── unit/
│   │   ├── config.test.ts            # Config loading tests
│   │   ├── validation.test.ts        # Zod schema tests
│   │   ├── errors.test.ts            # Error formatting tests
│   │   └── formatting.test.ts        # Response formatting tests
│   ├── integration/
│   │   ├── events.test.ts            # Event tool tests (mocked API)
│   │   └── stacks.test.ts            # Stack tool tests (mocked API)
│   ├── fixtures/
│   │   ├── events.json               # Sample event responses
│   │   ├── stacks.json               # Sample stack responses
│   │   └── errors.json               # Sample error responses
│   └── helpers/
│       ├── mock-api.ts               # Axios mocking with nock
│       └── test-utils.ts             # Shared test utilities
├── docs/
│   ├── TOOLS.md                      # Complete tool reference
│   ├── FILTERS.md                    # Filter syntax guide
│   ├── TROUBLESHOOTING.md            # Common issues
│   └── EXAMPLES.md                   # Usage examples
├── .github/
│   └── workflows/
│       ├── test.yml                  # Run tests on push
│       └── publish.yml               # Publish to npm on tag
├── .env.example                      # Environment variable template
├── .gitignore                        # Git ignore rules
├── .eslintrc.json                    # ESLint configuration
├── .prettierrc                       # Prettier configuration
├── package.json                      # npm package configuration
├── tsconfig.json                     # TypeScript configuration
├── vitest.config.ts                  # Vitest test configuration
├── README.md                         # Primary documentation
├── CHANGELOG.md                      # Version history
├── CONTRIBUTING.md                   # Contribution guide
├── CODE_OF_CONDUCT.md                # Contributor covenant
└── LICENSE                           # Apache 2.0
```

---

## Dependencies

### Production Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "axios": "^1.6.0",
  "zod": "^3.22.0",
  "dotenv": "^16.3.0",
  "pino": "^8.16.0"
}
```

**Rationale**:
- `@modelcontextprotocol/sdk`: Official MCP SDK for server creation
- `axios`: HTTP client, interceptors, better error handling than fetch
- `zod`: Runtime validation, excellent DX, type inference
- `dotenv`: Load API key from .env file
- `pino`: Fast structured logging for debugging

### Development Dependencies

```json
{
  "typescript": "^5.3.0",
  "@types/node": "^20.10.0",
  "tsx": "^4.7.0",
  "vitest": "^1.0.0",
  "@vitest/coverage-v8": "^1.0.0",
  "eslint": "^8.55.0",
  "@typescript-eslint/eslint-plugin": "^6.15.0",
  "@typescript-eslint/parser": "^6.15.0",
  "prettier": "^3.1.0",
  "nock": "^13.4.0"
}
```

**Rationale**:
- `typescript`: Type safety, better DX
- `tsx`: Fast TypeScript execution for dev
- `vitest`: Modern, fast testing framework
- `eslint/prettier`: Code quality and formatting
- `nock`: HTTP request mocking for tests

---

## Configuration System

### Environment Variables

```bash
# Required
EXCEPTIONLESS_API_KEY=your-project-api-key

# Optional
EXCEPTIONLESS_API_URL=https://api.exceptionless.io  # Default
EXCEPTIONLESS_TIMEOUT=30000                          # Request timeout (ms)
EXCEPTIONLESS_DEBUG=false                            # Enable debug logging
```

### Configuration Loading (src/config/index.ts)

```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export interface Config {
  apiKey: string;
  apiUrl: string;
  timeout: number;
  debug: boolean;
}

export function loadConfig(): Config {
  const apiKey = process.env.EXCEPTIONLESS_API_KEY;
  const apiUrl = process.env.EXCEPTIONLESS_API_URL || 'https://api.exceptionless.io';
  const timeout = parseInt(process.env.EXCEPTIONLESS_TIMEOUT || '30000');
  const debug = process.env.EXCEPTIONLESS_DEBUG === 'true';

  if (!apiKey) {
    throw new Error(
      'EXCEPTIONLESS_API_KEY is required. Set it in your environment or .env file.\n' +
      'Get your API key from: https://app.exceptionless.io/project/list'
    );
  }

  // Validate API key format (basic check)
  if (apiKey.length < 20) {
    throw new Error('EXCEPTIONLESS_API_KEY appears invalid (too short)');
  }

  // Validate URL
  try {
    new URL(apiUrl);
  } catch {
    throw new Error(`Invalid EXCEPTIONLESS_API_URL: ${apiUrl}`);
  }

  // Validate timeout
  if (timeout <= 0 || timeout > 600000) {
    throw new Error('EXCEPTIONLESS_TIMEOUT must be between 1 and 600000 ms');
  }

  return { apiKey, apiUrl, timeout, debug };
}
```

### Configuration Validation (src/config/validation.ts)

```typescript
import { z } from 'zod';

export const ConfigSchema = z.object({
  apiKey: z.string().min(20, 'API key must be at least 20 characters'),
  apiUrl: z.string().url('API URL must be valid HTTPS URL'),
  timeout: z.number().min(1).max(600000),
  debug: z.boolean()
});

export function validateConfig(config: unknown) {
  return ConfigSchema.parse(config);
}
```

### Claude Code Configuration

Users configure in Claude Code settings:

**Location**: Settings → MCP Servers

**Configuration**:
```json
{
  "mcpServers": {
    "exceptionless": {
      "command": "npx",
      "args": ["-y", "mcp-exceptionless"],
      "env": {
        "EXCEPTIONLESS_API_KEY": "your-api-key-here",
        "EXCEPTIONLESS_DEBUG": "false"
      }
    }
  }
}
```

---

## API Client Implementation

### HTTP Client (src/api/client.ts)

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import { Config } from '../config';
import { formatApiError } from './errors';
import { retryWithBackoff } from './retry';
import { logger } from '../utils/logger';

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

    // Request interceptor (logging)
    this.client.interceptors.request.use(
      (config) => {
        if (this.config.debug) {
          logger.debug({ method: config.method, url: config.url }, 'API Request');
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor (logging and error handling)
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

        // Retry logic for specific errors
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
    // Retry on network errors
    if (!error.response) return true;

    // Retry on rate limiting
    if (error.response.status === 429) return true;

    // Retry on server errors
    if (error.response.status >= 500) return true;

    return false;
  }

  // GET request
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  // POST request
  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  // DELETE request
  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  // PATCH request
  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }
}
```

### Error Formatting (src/api/errors.ts)

```typescript
import { AxiosError } from 'axios';

export interface McpError {
  code: string;
  message: string;
  suggestion?: string;
  details?: any;
}

export function formatApiError(error: AxiosError): McpError {
  // Network errors
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

  // 400 Bad Request
  if (status === 400) {
    return {
      code: 'BAD_REQUEST',
      message: responseData?.message || 'Invalid request parameters',
      details: responseData,
      suggestion: 'Check your input parameters'
    };
  }

  // 401 Unauthorized
  if (status === 401) {
    return {
      code: 'AUTH_INVALID_KEY',
      message: 'Authentication failed: Invalid API key',
      suggestion: 'Check your EXCEPTIONLESS_API_KEY. Generate a new key at https://app.exceptionless.io/project/list'
    };
  }

  // 403 Forbidden
  if (status === 403) {
    return {
      code: 'AUTH_FORBIDDEN',
      message: 'Forbidden: Insufficient permissions',
      suggestion: 'This API key may not have permission for this operation'
    };
  }

  // 404 Not Found
  if (status === 404) {
    return {
      code: 'NOT_FOUND',
      message: responseData?.message || 'Resource not found',
      details: { url: error.config?.url }
    };
  }

  // 426 Organization Suspended
  if (status === 426) {
    return {
      code: 'ORG_SUSPENDED',
      message: 'Organization suspended',
      suggestion: 'Check your organization billing status at https://app.exceptionless.io/account/manage'
    };
  }

  // 429 Rate Limit
  if (status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    return {
      code: 'RATE_LIMIT',
      message: 'Rate limit exceeded',
      details: { retry_after: retryAfter },
      suggestion: `Too many requests. Wait ${retryAfter || '60'} seconds before retrying`
    };
  }

  // 500+ Server Error
  if (status >= 500) {
    return {
      code: 'API_ERROR',
      message: 'Exceptionless API error',
      details: { status, message: responseData?.message },
      suggestion: 'This is a server-side issue. Try again in a few moments'
    };
  }

  // Unknown error
  return {
    code: 'UNKNOWN_ERROR',
    message: responseData?.message || error.message || 'An unknown error occurred',
    details: { status, data: responseData }
  };
}
```

### Retry Logic (src/api/retry.ts)

```typescript
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;  // milliseconds
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (attempt === options.maxRetries - 1) {
        throw lastError;
      }

      // Exponential backoff: baseDelay * 2^attempt
      const delay = options.baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

### API Endpoints (src/api/endpoints.ts)

```typescript
export const ENDPOINTS = {
  // Events
  EVENTS: '/events',
  EVENT_BY_ID: (id: string) => `/events/${id}`,
  EVENT_BY_REF: (refId: string) => `/events/by-ref/${refId}`,
  EVENT_COUNT: '/events/count',
  SESSIONS: '/events/sessions',
  SESSION_BY_ID: (sessionId: string) => `/events/sessions/${sessionId}`,

  // Stacks
  STACKS: '/stacks',
  STACK_BY_ID: (id: string) => `/stacks/${id}`,
  STACK_EVENTS: (stackId: string) => `/stacks/${stackId}/events`,
  STACK_MARK_FIXED: (ids: string) => `/stacks/${ids}/mark-fixed`,
  STACK_MARK_CRITICAL: (ids: string) => `/stacks/${ids}/mark-critical`,
  STACK_MARK_SNOOZED: (ids: string) => `/stacks/${ids}/mark-snoozed`,
  STACK_CHANGE_STATUS: (ids: string) => `/stacks/${ids}/change-status`,
  STACK_ADD_LINK: (id: string) => `/stacks/${id}/add-link`,
  STACK_REMOVE_LINK: (id: string) => `/stacks/${id}/remove-link`,
  STACK_DELETE: (ids: string) => `/stacks/${ids}`
} as const;
```

---

## Tool Implementations

### Tool Registration Pattern

Every tool follows this pattern:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../api/client';

export function registerToolName(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'tool-name',
    {
      title: 'Human-Readable Title',
      description: 'Detailed description with usage info and examples',
      inputSchema: z.object({
        // parameter schemas
      }),
      outputSchema: z.any() // or specific schema
    },
    async (params) => {
      try {
        // 1. Validate params (zod does automatically)
        // 2. Call API
        const result = await client.get('/endpoint', params);

        // 3. Format response
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        // 4. Handle errors
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: true,
              ...error
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );
}
```

### Event Tools

#### 1. submit-event (src/tools/events/submit-event.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const SubmitEventSchema = z.object({
  event_data: z.union([
    z.string().min(1, 'event_data cannot be empty'),
    z.record(z.any())
  ]).describe('Event data as JSON string or object'),
  type: z.enum(['error', 'log', 'usage', 'custom']).optional().describe('Event type'),
  user_agent: z.string().optional().describe('User agent string')
});

export function registerSubmitEvent(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'submit-event',
    {
      title: 'Submit Event',
      description: `Submit an error, log, or usage event to Exceptionless.

Supports:
- JSON objects (single event)
- Plain text (converted to log event)
- Multi-line text (splits into multiple log events)

Event Types:
- error: Exception/error tracking
- log: Log messages
- usage: Feature usage tracking
- custom: Custom event types

Examples:
{
  "event_data": {
    "type": "error",
    "@simple_error": {
      "message": "Null reference exception",
      "type": "System.NullReferenceException",
      "stack_trace": "at MyApp.Startup..."
    }
  }
}

{
  "event_data": {
    "type": "log",
    "message": "User login successful",
    "@user": {
      "identity": "user123",
      "name": "John Doe"
    }
  }
}`,
      inputSchema: SubmitEventSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        const { event_data, type, user_agent } = params;

        // Prepare request body
        let body: any;
        if (typeof event_data === 'string') {
          // Plain text
          body = event_data;
        } else {
          // JSON object
          body = event_data;
          if (type && !body.type) {
            body.type = type;
          }
        }

        // Headers
        const headers: Record<string, string> = {};
        if (user_agent) {
          headers['User-Agent'] = user_agent;
        }

        // Submit event
        const result = await client.post(ENDPOINTS.EVENTS, body);

        return {
          content: [{
            type: 'text',
            text: `Event submitted successfully.\n\nResponse: ${JSON.stringify(result, null, 2)}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to submit event.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 2. get-events (src/tools/events/get-events.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const GetEventsSchema = z.object({
  filter: z.string().optional().describe('Filter query (e.g., "type:error", "tag:production")'),
  sort: z.string().optional().describe('Sort order (e.g., "-date" for newest first)'),
  time: z.string().optional().describe('Time range (e.g., "last 7 days")'),
  offset: z.string().optional().describe('Timezone offset in minutes'),
  mode: z.enum(['full', 'summary']).optional().describe('Response detail level'),
  page: z.number().int().min(1).optional().describe('Page number (≥1)'),
  limit: z.number().int().min(1).max(100).optional().default(10).describe('Results per page (1-100, default 10)'),
  before: z.string().optional().describe('Cursor for pagination'),
  after: z.string().optional().describe('Cursor for pagination')
});

export function registerGetEvents(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'get-events',
    {
      title: 'Get Events',
      description: `Query events with advanced filtering and pagination.

Filter Examples:
- type:error                          # Only errors
- tag:production                      # Production environment
- date:>now-7d                        # Last 7 days
- type:error AND tag:api              # Errors in API
- is_first_occurrence:true            # New errors only
- (type:error OR type:log) AND tag:prod  # Compound query

Sort Examples:
- -date                               # Most recent first (default)
- value                               # Lowest value first

Time Ranges:
- last 7 days
- last 24 hours
- last 30 days

Mode:
- full: Complete event details
- summary: Lightweight response`,
      inputSchema: GetEventsSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        const result = await client.get(ENDPOINTS.EVENTS, params);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to retrieve events.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 3. get-event (src/tools/events/get-event.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const GetEventSchema = z.object({
  id: z.string().min(1, 'Event ID is required').describe('Event ID')
});

export function registerGetEvent(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'get-event',
    {
      title: 'Get Event by ID',
      description: 'Get detailed information about a specific event including all custom data, stack trace, user info, and environment details.',
      inputSchema: GetEventSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        const result = await client.get(ENDPOINTS.EVENT_BY_ID(params.id));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to retrieve event.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 4. get-event-by-reference (src/tools/events/get-event-by-reference.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const GetEventByReferenceSchema = z.object({
  reference_id: z.string().min(1, 'Reference ID is required').describe('External reference ID')
});

export function registerGetEventByReference(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'get-event-by-reference',
    {
      title: 'Get Event by Reference ID',
      description: 'Retrieve an event using your own correlation ID. Useful for linking Exceptionless events with external systems (support tickets, transaction IDs, etc.).',
      inputSchema: GetEventByReferenceSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        const result = await client.get(ENDPOINTS.EVENT_BY_REF(params.reference_id));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to retrieve event by reference.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 5. count-events (src/tools/events/count-events.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const CountEventsSchema = z.object({
  filter: z.string().optional().describe('Filter query'),
  time: z.string().optional().describe('Time range'),
  offset: z.string().optional().describe('Timezone offset in minutes'),
  aggregations: z.string().optional().describe('Aggregation fields (comma-separated, e.g., "date:1h,type")')
});

export function registerCountEvents(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'count-events',
    {
      title: 'Count Events',
      description: `Count events with optional aggregations for analytics.

Aggregation Examples:
- date:1h                          # Hourly breakdown
- date:1d                          # Daily breakdown
- type                             # Count by event type
- date:1d,type                     # Daily breakdown per type
- tag                              # Count by tags

Returns:
{
  "total": 1234,
  "aggregations": {
    "date": {
      "2025-10-16T10:00:00Z": 45,
      "2025-10-16T11:00:00Z": 67
    },
    "type": {
      "error": 890,
      "log": 344
    }
  }
}`,
      inputSchema: CountEventsSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        const result = await client.get(ENDPOINTS.EVENT_COUNT, params);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to count events.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 6. delete-events (src/tools/events/delete-events.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const DeleteEventsSchema = z.object({
  ids: z.string()
    .min(1, 'At least one ID required')
    .regex(/^[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*$/, 'Invalid ID format. Use comma-separated IDs (e.g., "id1,id2,id3")')
    .describe('Comma-delimited event IDs')
});

export function registerDeleteEvents(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'delete-events',
    {
      title: 'Delete Events',
      description: `Permanently delete events. Use with caution - this is irreversible.

Example: "id1,id2,id3"`,
      inputSchema: DeleteEventsSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        await client.delete(`/events/${params.ids}`);

        return {
          content: [{
            type: 'text',
            text: `Successfully deleted event(s): ${params.ids}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to delete events.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 7. get-sessions (src/tools/events/get-sessions.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const GetSessionsSchema = z.object({
  filter: z.string().optional(),
  sort: z.string().optional(),
  time: z.string().optional(),
  offset: z.string().optional(),
  mode: z.enum(['full', 'summary']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(10),
  before: z.string().optional(),
  after: z.string().optional()
});

export function registerGetSessions(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'get-sessions',
    {
      title: 'Get Sessions',
      description: 'List user activity sessions. Sessions group events by user activity period for analyzing user journeys and correlating errors.',
      inputSchema: GetSessionsSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        const result = await client.get(ENDPOINTS.SESSIONS, params);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to retrieve sessions.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 8. get-session-events (src/tools/events/get-session-events.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const GetSessionEventsSchema = z.object({
  session_id: z.string().min(1, 'Session ID is required').describe('Session ID'),
  filter: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(10),
  before: z.string().optional(),
  after: z.string().optional()
});

export function registerGetSessionEvents(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'get-session-events',
    {
      title: 'Get Session Events',
      description: 'Retrieve all events that occurred during a user session. Useful for understanding the sequence of events leading to an error.',
      inputSchema: GetSessionEventsSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        const { session_id, ...queryParams } = params;
        const result = await client.get(ENDPOINTS.SESSION_BY_ID(session_id), queryParams);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to retrieve session events.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

### Stack Tools

#### 1. get-stacks (src/tools/stacks/get-stacks.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const GetStacksSchema = z.object({
  filter: z.string().optional().describe('Filter query'),
  sort: z.string().optional().describe('Sort order'),
  time: z.string().optional().describe('Time range'),
  offset: z.string().optional().describe('Timezone offset'),
  mode: z.enum(['full', 'summary']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(10),
  before: z.string().optional(),
  after: z.string().optional()
});

export function registerGetStacks(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'get-stacks',
    {
      title: 'Get Stacks',
      description: `List and search error stacks (grouped errors). Stacks are groups of similar errors.

Filter Examples:
- status:open                      # Open/unresolved errors
- status:(open OR regressed)       # Open or regressed
- occurrences_are_critical:true    # Critical errors only
- total_occurrences:>100           # High-frequency errors
- date:>now-7d                     # Recent activity

Sort Examples:
- -total_occurrences               # Most frequent first
- -last_occurrence                 # Most recent activity`,
      inputSchema: GetStacksSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        const result = await client.get(ENDPOINTS.STACKS, params);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to retrieve stacks.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 2. get-stack (src/tools/stacks/get-stack.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const GetStackSchema = z.object({
  id: z.string().min(1, 'Stack ID is required').describe('Stack ID')
});

export function registerGetStack(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'get-stack',
    {
      title: 'Get Stack',
      description: 'Retrieve complete details about an error stack including occurrence count, status, fix version, references, and metadata.',
      inputSchema: GetStackSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        const result = await client.get(ENDPOINTS.STACK_BY_ID(params.id));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to retrieve stack.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 3. get-stack-events (src/tools/stacks/get-stack-events.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const GetStackEventsSchema = z.object({
  stack_id: z.string().min(1, 'Stack ID is required').describe('Stack ID'),
  filter: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(10),
  mode: z.enum(['full', 'summary']).optional()
});

export function registerGetStackEvents(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'get-stack-events',
    {
      title: 'Get Stack Events',
      description: 'List all event occurrences for a specific error stack. Useful for examining individual instances, finding patterns, or identifying affected users.',
      inputSchema: GetStackEventsSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        const { stack_id, ...queryParams } = params;
        const result = await client.get(ENDPOINTS.STACK_EVENTS(stack_id), queryParams);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to retrieve stack events.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 4. mark-stack-fixed (src/tools/stacks/mark-stack-fixed.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const MarkStackFixedSchema = z.object({
  ids: z.string()
    .min(1, 'At least one ID required')
    .regex(/^[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*$/, 'Invalid ID format')
    .describe('Comma-delimited stack IDs'),
  version: z.string().optional().describe('Version where fixed (e.g., "2.1.5")')
});

export function registerMarkStackFixed(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'mark-stack-fixed',
    {
      title: 'Mark Stack as Fixed',
      description: `Mark error stack(s) as fixed. If the error occurs again, it will be marked as "regressed".

Example: { "ids": "stack1,stack2", "version": "2.1.5" }`,
      inputSchema: MarkStackFixedSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        const queryParams: any = {};
        if (params.version) {
          queryParams.version = params.version;
        }

        await client.post(ENDPOINTS.STACK_MARK_FIXED(params.ids), null, queryParams);

        return {
          content: [{
            type: 'text',
            text: `Successfully marked stack(s) as fixed: ${params.ids}${params.version ? ` (version: ${params.version})` : ''}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to mark stack as fixed.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 5. mark-stack-critical (src/tools/stacks/mark-stack-critical.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const MarkStackCriticalSchema = z.object({
  ids: z.string()
    .min(1, 'At least one ID required')
    .regex(/^[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*$/, 'Invalid ID format')
    .describe('Comma-delimited stack IDs'),
  critical: z.boolean().optional().default(true).describe('True to mark critical, false to unmark')
});

export function registerMarkStackCritical(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'mark-stack-critical',
    {
      title: 'Mark Stack as Critical',
      description: 'Flag error stacks as critical (high priority) or remove critical flag.',
      inputSchema: MarkStackCriticalSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        if (params.critical) {
          await client.post(ENDPOINTS.STACK_MARK_CRITICAL(params.ids));
        } else {
          await client.delete(ENDPOINTS.STACK_MARK_CRITICAL(params.ids));
        }

        return {
          content: [{
            type: 'text',
            text: `Successfully ${params.critical ? 'marked' : 'unmarked'} stack(s) as critical: ${params.ids}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to mark stack as critical.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 6. mark-stack-snoozed (src/tools/stacks/mark-stack-snoozed.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const MarkStackSnoozedSchema = z.object({
  ids: z.string()
    .min(1, 'At least one ID required')
    .regex(/^[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*$/, 'Invalid ID format')
    .describe('Comma-delimited stack IDs'),
  snooze_until_utc: z.string()
    .min(1, 'Snooze date is required')
    .describe('ISO datetime when to resume (e.g., "2025-10-20T00:00:00Z")')
});

export function registerMarkStackSnoozed(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'mark-stack-snoozed',
    {
      title: 'Mark Stack as Snoozed',
      description: `Temporarily snooze error stacks until a specified date/time.

Example: { "ids": "stack1", "snooze_until_utc": "2025-10-20T00:00:00Z" }`,
      inputSchema: MarkStackSnoozedSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        await client.post(
          ENDPOINTS.STACK_MARK_SNOOZED(params.ids),
          null,
          { snoozeUntilUtc: params.snooze_until_utc }
        );

        return {
          content: [{
            type: 'text',
            text: `Successfully snoozed stack(s) until ${params.snooze_until_utc}: ${params.ids}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to snooze stack.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 7. change-stack-status (src/tools/stacks/change-stack-status.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const ChangeStackStatusSchema = z.object({
  ids: z.string()
    .min(1, 'At least one ID required')
    .regex(/^[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*$/, 'Invalid ID format')
    .describe('Comma-delimited stack IDs'),
  status: z.enum(['open', 'fixed', 'regressed', 'snoozed', 'ignored', 'discarded'])
    .describe('New status for the stack(s)')
});

export function registerChangeStackStatus(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'change-stack-status',
    {
      title: 'Change Stack Status',
      description: `Change the status of error stack(s).

Status Values:
- open: Active, unresolved error
- fixed: Resolved error
- regressed: Fixed error that recurred
- snoozed: Temporarily hidden
- ignored: Permanently hidden
- discarded: Filtered/excluded`,
      inputSchema: ChangeStackStatusSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        await client.post(
          ENDPOINTS.STACK_CHANGE_STATUS(params.ids),
          null,
          { status: params.status }
        );

        return {
          content: [{
            type: 'text',
            text: `Successfully changed status to "${params.status}" for stack(s): ${params.ids}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to change stack status.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 8. add-stack-link (src/tools/stacks/add-stack-link.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const AddStackLinkSchema = z.object({
  id: z.string().min(1, 'Stack ID is required').describe('Stack ID'),
  link: z.string().url('Link must be valid URL').describe('URL to external resource (JIRA, GitHub, etc.)')
});

export function registerAddStackLink(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'add-stack-link',
    {
      title: 'Add Stack Link',
      description: `Add reference link to external system (JIRA ticket, GitHub issue, documentation).

Example: { "id": "stack123", "link": "https://github.com/myorg/myapp/issues/456" }`,
      inputSchema: AddStackLinkSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        await client.post(ENDPOINTS.STACK_ADD_LINK(params.id), null, { link: params.link });

        return {
          content: [{
            type: 'text',
            text: `Successfully added link to stack ${params.id}: ${params.link}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to add link to stack.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 9. remove-stack-link (src/tools/stacks/remove-stack-link.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const RemoveStackLinkSchema = z.object({
  id: z.string().min(1, 'Stack ID is required').describe('Stack ID'),
  link: z.string().url('Link must be valid URL').describe('URL to remove')
});

export function registerRemoveStackLink(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'remove-stack-link',
    {
      title: 'Remove Stack Link',
      description: 'Remove a previously added reference link.',
      inputSchema: RemoveStackLinkSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        await client.post(ENDPOINTS.STACK_REMOVE_LINK(params.id), null, { link: params.link });

        return {
          content: [{
            type: 'text',
            text: `Successfully removed link from stack ${params.id}: ${params.link}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to remove link from stack.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

#### 10. delete-stacks (src/tools/stacks/delete-stacks.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

const DeleteStacksSchema = z.object({
  ids: z.string()
    .min(1, 'At least one ID required')
    .regex(/^[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*$/, 'Invalid ID format')
    .describe('Comma-delimited stack IDs')
});

export function registerDeleteStacks(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'delete-stacks',
    {
      title: 'Delete Stacks',
      description: 'Permanently delete error stack(s). Use with caution - this removes the stack and all associated events.',
      inputSchema: DeleteStacksSchema,
      outputSchema: z.any()
    },
    async (params) => {
      try {
        await client.delete(ENDPOINTS.STACK_DELETE(params.ids));

        return {
          content: [{
            type: 'text',
            text: `Successfully deleted stack(s): ${params.ids}`
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Failed to delete stacks.\n\nError: ${JSON.stringify(error, null, 2)}`
          }],
          isError: true
        };
      }
    }
  );
}
```

---

## Server Setup

### MCP Server (src/server.ts)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { ExceptionlessClient } from './api/client';
import { Config } from './config';

// Import all tool registrations
import { registerSubmitEvent } from './tools/events/submit-event';
import { registerGetEvents } from './tools/events/get-events';
import { registerGetEvent } from './tools/events/get-event';
import { registerGetEventByReference } from './tools/events/get-event-by-reference';
import { registerCountEvents } from './tools/events/count-events';
import { registerDeleteEvents } from './tools/events/delete-events';
import { registerGetSessions } from './tools/events/get-sessions';
import { registerGetSessionEvents } from './tools/events/get-session-events';

import { registerGetStacks } from './tools/stacks/get-stacks';
import { registerGetStack } from './tools/stacks/get-stack';
import { registerGetStackEvents } from './tools/stacks/get-stack-events';
import { registerMarkStackFixed } from './tools/stacks/mark-stack-fixed';
import { registerMarkStackCritical } from './tools/stacks/mark-stack-critical';
import { registerMarkStackSnoozed } from './tools/stacks/mark-stack-snoozed';
import { registerChangeStackStatus } from './tools/stacks/change-stack-status';
import { registerAddStackLink } from './tools/stacks/add-stack-link';
import { registerRemoveStackLink } from './tools/stacks/remove-stack-link';
import { registerDeleteStacks } from './tools/stacks/delete-stacks';

export function createServer(config: Config): McpServer {
  const server = new McpServer({
    name: 'mcp-exceptionless',
    version: '1.0.0'
  });

  const client = new ExceptionlessClient(config);

  // Register all event tools
  registerSubmitEvent(server, client);
  registerGetEvents(server, client);
  registerGetEvent(server, client);
  registerGetEventByReference(server, client);
  registerCountEvents(server, client);
  registerDeleteEvents(server, client);
  registerGetSessions(server, client);
  registerGetSessionEvents(server, client);

  // Register all stack tools
  registerGetStacks(server, client);
  registerGetStack(server, client);
  registerGetStackEvents(server, client);
  registerMarkStackFixed(server, client);
  registerMarkStackCritical(server, client);
  registerMarkStackSnoozed(server, client);
  registerChangeStackStatus(server, client);
  registerAddStackLink(server, client);
  registerRemoveStackLink(server, client);
  registerDeleteStacks(server, client);

  return server;
}
```

### Entry Point (src/index.ts)

```typescript
#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config';
import { createServer } from './server';
import { logger } from './utils/logger';

async function main() {
  try {
    // Load configuration
    const config = loadConfig();

    // Create MCP server
    const server = createServer(config);

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    // Log startup (to stderr so it doesn't interfere with stdio)
    if (config.debug) {
      logger.info('Exceptionless MCP Server started');
      logger.info(`API URL: ${config.apiUrl}`);
    }
  } catch (error) {
    console.error('Failed to start Exceptionless MCP Server:', error);
    process.exit(1);
  }
}

main();
```

---

## Logging (src/utils/logger.ts)

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.EXCEPTIONLESS_DEBUG === 'true' ? 'debug' : 'error',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});
```

---

## Testing

### Test Configuration (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    }
  }
});
```

### Mock API (tests/helpers/mock-api.ts)

```typescript
import nock from 'nock';

export function mockExceptionlessAPI(baseURL: string) {
  return nock(baseURL)
    .defaultReplyHeaders({
      'Content-Type': 'application/json'
    });
}

export function mockGetEvents(baseURL: string, response: any) {
  return mockExceptionlessAPI(baseURL)
    .get('/api/v2/events')
    .query(true)
    .reply(200, response);
}

export function mockGetStack(baseURL: string, id: string, response: any) {
  return mockExceptionlessAPI(baseURL)
    .get(`/api/v2/stacks/${id}`)
    .reply(200, response);
}

export function mockMarkStackFixed(baseURL: string, ids: string) {
  return mockExceptionlessAPI(baseURL)
    .post(`/api/v2/stacks/${ids}/mark-fixed`)
    .query(true)
    .reply(202);
}

export function mockApiError(baseURL: string, status: number, message: string) {
  return mockExceptionlessAPI(baseURL)
    .get(/.*/)
    .reply(status, { message });
}
```

### Sample Unit Test (tests/unit/validation.test.ts)

```typescript
import { describe, it, expect } from 'vitest';
import { GetEventsSchema } from '../../src/validation/schemas';

describe('Validation Schemas', () => {
  describe('GetEventsSchema', () => {
    it('should validate valid parameters', () => {
      const result = GetEventsSchema.safeParse({
        filter: 'type:error',
        limit: 10,
        page: 1
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid limit', () => {
      const result = GetEventsSchema.safeParse({
        limit: 150 // Max is 100
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('limit');
      }
    });

    it('should use default limit', () => {
      const result = GetEventsSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject negative page', () => {
      const result = GetEventsSchema.safeParse({
        page: 0
      });

      expect(result.success).toBe(false);
    });
  });
});
```

### Sample Integration Test (tests/integration/events.test.ts)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mockGetEvents, mockApiError } from '../helpers/mock-api';
import { ExceptionlessClient } from '../../src/api/client';

describe('Event Tools', () => {
  const baseURL = 'https://api.exceptionless.io';
  let client: ExceptionlessClient;

  beforeAll(() => {
    client = new ExceptionlessClient({
      apiKey: 'test-key',
      apiUrl: baseURL,
      timeout: 30000,
      debug: false
    });
  });

  afterAll(() => {
    // Clean up nock
    nock.cleanAll();
  });

  describe('get-events', () => {
    it('should retrieve events successfully', async () => {
      const mockResponse = [
        { id: 'event1', type: 'error', message: 'Test error' }
      ];

      mockGetEvents(baseURL, mockResponse);

      const result = await client.get('/events');

      expect(result).toEqual(mockResponse);
    });

    it('should handle 401 error', async () => {
      mockApiError(baseURL, 401, 'Invalid API key');

      await expect(client.get('/events')).rejects.toThrow();
    });
  });
});
```

---

## Documentation

### README.md Structure

```markdown
# Exceptionless MCP Server

Official MCP server for Exceptionless error tracking and monitoring.

## Features

- 8 Event tools (submit, query, retrieve, count, sessions)
- 10 Stack tools (manage error groups, mark fixed, track regressions)
- Advanced filtering and search
- Session tracking
- Production-ready error handling

## Quick Start

### 1. Install

```bash
npx -y mcp-exceptionless
```

### 2. Get API Key

1. Go to https://app.exceptionless.io/project/list
2. Select your project
3. Click "API Keys"
4. Copy your project API key

### 3. Configure Claude Code

Add to Claude Code settings (Settings → MCP Servers):

```json
{
  "mcpServers": {
    "exceptionless": {
      "command": "npx",
      "args": ["-y", "mcp-exceptionless"],
      "env": {
        "EXCEPTIONLESS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 4. Use in Claude Code

Ask Claude:
- "Show my recent Exceptionless errors"
- "Mark stack xyz as fixed in version 2.1.0"
- "Find critical production errors from last 7 days"

## Tools

### Events (8 tools)
- submit-event
- get-events
- get-event
- get-event-by-reference
- count-events
- delete-events
- get-sessions
- get-session-events

### Stacks (10 tools)
- get-stacks
- get-stack
- get-stack-events
- mark-stack-fixed
- mark-stack-critical
- mark-stack-snoozed
- change-stack-status
- add-stack-link
- remove-stack-link
- delete-stacks

## Documentation

- [Tool Reference](docs/TOOLS.md)
- [Filter Syntax](docs/FILTERS.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Examples](docs/EXAMPLES.md)

## License

Apache 2.0
```

---

## Build & Publish

### package.json

```json
{
  "name": "mcp-exceptionless",
  "version": "1.0.0",
  "description": "MCP server for Exceptionless error tracking",
  "main": "dist/index.js",
  "bin": {
    "mcp-exceptionless": "./dist/index.js"
  },
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write 'src/**/*.ts'",
    "prepublishOnly": "npm run build",
    "prepare": "npm run build"
  },
  "keywords": ["mcp", "exceptionless", "error-tracking", "monitoring", "claude", "claude-code"],
  "author": "Your Name",
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/Tech-to-Thrive/mcp-exceptionless.git"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    ".env.example"
  ],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### GitHub Actions (.github/workflows/test.yml)

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

### GitHub Actions (.github/workflows/publish.yml)

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Complete Implementation Checklist

### Project Setup
- [ ] Initialize git repository (done)
- [ ] Create project structure (all directories)
- [ ] Initialize npm package (`npm init`)
- [ ] Install dependencies (production + dev)
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Configure ESLint (.eslintrc.json)
- [ ] Configure Prettier (.prettierrc)
- [ ] Configure Vitest (vitest.config.ts)
- [ ] Create .gitignore (done)
- [ ] Create .env.example

### Core Infrastructure
- [ ] Implement config loader (src/config/index.ts)
- [ ] Implement config validation (src/config/validation.ts)
- [ ] Implement API client (src/api/client.ts)
- [ ] Implement error formatting (src/api/errors.ts)
- [ ] Implement retry logic (src/api/retry.ts)
- [ ] Implement logger (src/utils/logger.ts)
- [ ] Define API endpoints (src/api/endpoints.ts)
- [ ] Define API types (src/api/types.ts)

### Event Tools (8 tools)
- [ ] Implement submit-event
- [ ] Implement get-events
- [ ] Implement get-event
- [ ] Implement get-event-by-reference
- [ ] Implement count-events
- [ ] Implement delete-events
- [ ] Implement get-sessions
- [ ] Implement get-session-events

### Stack Tools (10 tools)
- [ ] Implement get-stacks
- [ ] Implement get-stack
- [ ] Implement get-stack-events
- [ ] Implement mark-stack-fixed
- [ ] Implement mark-stack-critical
- [ ] Implement mark-stack-snoozed
- [ ] Implement change-stack-status
- [ ] Implement add-stack-link
- [ ] Implement remove-stack-link
- [ ] Implement delete-stacks

### Server Setup
- [ ] Implement server creator (src/server.ts)
- [ ] Implement entry point (src/index.ts)
- [ ] Add shebang to index.ts (#!/usr/bin/env node)
- [ ] Test stdio connection
- [ ] Test tool registration

### Testing
- [ ] Write config tests
- [ ] Write validation tests (zod schemas)
- [ ] Write error formatting tests
- [ ] Write mock API helpers
- [ ] Write event tool tests (all 8)
- [ ] Write stack tool tests (all 10)
- [ ] Create test fixtures (sample responses)
- [ ] Run tests and ensure >80% coverage

### Documentation
- [ ] Write README.md (comprehensive)
- [ ] Write docs/TOOLS.md (all 18 tools documented)
- [ ] Write docs/FILTERS.md (filter syntax guide)
- [ ] Write docs/TROUBLESHOOTING.md (common issues)
- [ ] Write docs/EXAMPLES.md (usage examples)
- [ ] Write CONTRIBUTING.md
- [ ] Write CODE_OF_CONDUCT.md
- [ ] Write CHANGELOG.md
- [ ] Create LICENSE file (Apache 2.0)

### Build & CI/CD
- [ ] Configure package.json (bin, scripts, files)
- [ ] Test build process (`npm run build`)
- [ ] Create GitHub Actions (test.yml)
- [ ] Create GitHub Actions (publish.yml)
- [ ] Test with MCP Inspector
- [ ] Test with Claude Code (real usage)

### Publishing
- [ ] Verify package.json metadata
- [ ] Test npx command locally
- [ ] Create git tag v1.0.0
- [ ] Push to GitHub
- [ ] Publish to npm
- [ ] Verify npx installation works
- [ ] Test in Claude Code (production)

### Post-Launch
- [ ] Monitor GitHub issues
- [ ] Gather user feedback
- [ ] Fix any reported bugs
- [ ] Update documentation as needed

---

## End of Build Plan

This document contains EVERYTHING needed to build the Exceptionless MCP server from scratch with no additional context. Follow the checklist linearly, implement each component as specified, and the result will be a production-ready MCP server for Claude Code.
