# Claude Context - Exceptionless MCP Server

This document provides essential context for Claude when working on the Exceptionless MCP server project.

## Project Summary

**Goal**: Build a production-ready MCP server for Exceptionless API integration with Claude Code.

**Key Requirements**:
- Single-shot implementation (no phases)
- stdio transport only (Claude Code target)
- 13 read-only tools (6 Event + 3 Stack + 2 Project + 2 Organization)
- Token optimization (minimize LLM token usage)
- API key authentication
- npm distribution via `npx -y mcp-exceptionless`
- READ-ONLY: No write/mutation operations
- Dynamic project filtering via optional parameters

## Memory Bank References

### Primary Planning Document
**File**: `memory-bank/planning/mcp-exceptionless-build-plan.md`
**Purpose**: Complete self-contained implementation guide - THE BUILD BIBLE
**Contains**:
- Complete project structure
- All 9 read-only tool implementations with full code
- Token optimization strategies (80-85% reduction)
- API client implementation
- Error handling patterns
- Testing strategy
- Documentation requirements
- 100+ item implementation checklist

**Usage**: This is the single source of truth for implementation. Refer to this document for all implementation details. This MCP is READ-ONLY - no write/mutation operations.

### API Documentation
**File**: `memory-bank/docs/exceptionless-overview.md`
**Purpose**: Comprehensive Exceptionless API reference
**Contains**:
- 88 API endpoints across 8 categories
- 40 data schemas with full structure
- Authentication methods
- Filter syntax examples
- Complete endpoint reference

**Usage**: Reference when implementing API calls, understanding data structures, or debugging API interactions.

### MCP Architecture
**File**: `memory-bank/docs/mcp-overview.md`
**Purpose**: MCP protocol and architecture understanding
**Contains**:
- MCP client-server model
- Transport types (stdio, SSE, HTTP)
- Tool, prompt, and resource primitives
- Authentication patterns
- Platform support matrix
- Best practices

**Usage**: Reference when implementing MCP server setup, tool registration, or troubleshooting MCP-specific issues.

## Critical User Directives

1. **No Phases or Timelines**: Build everything in one go, no phased approach
2. **No Hosting**: GitHub-only deployment, users run via npx
3. **Claude Code Primary**: stdio transport, desktop-only target
4. **Token Optimization Priority**: Minimize token usage while providing full data access
5. **Production Quality**: Comprehensive error handling, validation, logging
6. **READ-ONLY ONLY**: No write/mutation operations - only query/read tools

## Token Optimization Principles

All implementations MUST follow these guidelines:

```typescript
// ✅ GOOD: Summary mode default
mode: z.enum(['full', 'summary']).optional().default('summary')

// ✅ GOOD: Reduced pagination
limit: z.number().min(1).max(100).optional().default(5)

// ✅ GOOD: Minimal response
return {
  content: [{
    type: 'text',
    text: JSON.stringify(result) // Raw data only
  }]
};

// ❌ BAD: Verbose response
return {
  content: [{
    type: 'text',
    text: `I found ${results.length} events:\n\n${JSON.stringify(results)}\n\nHere are your events...`
  }]
};
```

## Implementation Workflow

When implementing, follow this order:

1. **Setup** → Project structure, dependencies, configuration
2. **Core** → API client, error handling, retry logic
3. **Event Tools** → All 6 read-only event tools
4. **Stack Tools** → All 3 read-only stack tools
5. **Server** → MCP server setup, tool registration
6. **Testing** → Unit tests, integration tests
7. **Documentation** → README, tool docs, examples
8. **Publishing** → Build, CI/CD, npm publish

## Key Files to Create

### Source Code (`src/`)
- `index.ts` - Entry point with stdio server
- `server.ts` - MCP server creation and tool registration
- `config/index.ts` - Configuration loader
- `api/client.ts` - Axios HTTP client wrapper (GET only for read-only)
- `api/errors.ts` - Error formatting
- `api/retry.ts` - Retry logic with exponential backoff
- `tools/events/*.ts` - 6 read-only event tool implementations
- `tools/stacks/*.ts` - 3 read-only stack tool implementations

### Configuration
- `package.json` - npm package config with bin entry
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Environment variable template

### Testing
- `vitest.config.ts` - Test configuration
- `tests/unit/*.test.ts` - Unit tests
- `tests/integration/*.test.ts` - Integration tests
- `tests/helpers/mock-api.ts` - API mocking utilities

### Documentation
- `docs/TOOLS.md` - Complete tool reference (9 read-only tools)
- `docs/FILTERS.md` - Filter syntax guide
- `docs/TROUBLESHOOTING.md` - Common issues
- `docs/EXAMPLES.md` - Usage examples (read-only queries)

## Quick Reference

### Dependencies
```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "axios": "^1.6.0",
  "zod": "^3.22.0",
  "dotenv": "^16.3.0",
  "pino": "^8.16.0"
}
```

### Environment Variables
```bash
EXCEPTIONLESS_API_KEY=your-api-key                  # Required
EXCEPTIONLESS_PROJECT_ID=your-project-id            # Optional - Security boundary (restricts ALL queries)
EXCEPTIONLESS_API_URL=https://api.exceptionless.io # Optional
EXCEPTIONLESS_TIMEOUT=30000                         # Optional
EXCEPTIONLESS_DEBUG=false                           # Optional
```

**Configuration Location**: `.claude.json` (user's MCP config, NOT system environment variables)

### API Base URL
```
https://api.exceptionless.io/api/v2
```

## Common Patterns

### Tool Registration
```typescript
export function registerToolName(server: McpServer, client: ExceptionlessClient) {
  server.registerTool(
    'tool-name',
    {
      title: 'Tool Title',
      description: 'Tool description with examples',
      inputSchema: z.object({ /* params */ }),
      outputSchema: z.any()
    },
    async (params) => {
      try {
        const result = await client.get('/endpoint', params);
        return {
          content: [{ type: 'text', text: JSON.stringify(result) }]
        };
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: JSON.stringify(error) }],
          isError: true
        };
      }
    }
  );
}
```

### Error Handling
```typescript
export interface McpError {
  code: string;
  message: string;
  suggestion?: string;
  details?: any;
}
```

## Questions to Ask

When uncertain, refer to:
1. **Implementation details** → Build plan (`mcp-exceptionless-build-plan.md`)
2. **API specifics** → API overview (`exceptionless-overview.md`)
3. **MCP patterns** → MCP overview (`mcp-overview.md`)

## Tool List (13 Read-Only Tools)

### Event Tools (6)
1. `get-events` - Query events with filtering, sorting, pagination
2. `get-event` - Get single event by ID
3. `get-event-by-reference` - Get event by external reference ID
4. `count-events` - Count events with optional aggregations
5. `get-sessions` - List user activity sessions
6. `get-session-events` - Get events in a session

### Stack Tools (3)
1. `get-stacks` - List and search error stacks (grouped errors)
2. `get-stack` - Get single stack by ID
3. `get-stack-events` - Get event occurrences for a stack

### Project Tools (2)
1. `get-projects` - List all projects (for discovering available projects)
2. `get-project` - Get detailed project information by ID

### Organization Tools (2)
1. `get-organizations` - List all organizations
2. `get-organization` - Get detailed organization information by ID

## Project Filtering Architecture

**Two Types of Filtering** (Both Optional):

### 1. Security Boundary (Environment Config)
- **Variable**: `EXCEPTIONLESS_PROJECT_ID` in `.claude.json`
- **Purpose**: Restrict AI access to a single project (security measure)
- **Scope**: Server-wide - ALL queries restricted
- **Set By**: End user during MCP setup
- **Use Case**: Limit what the AI can access

### 2. Query Filtering (Tool Parameter)
- **Parameter**: `project_id` on individual tool calls
- **Purpose**: Filter specific queries by project
- **Scope**: Per-query - only that request
- **Set By**: AI/user per-query
- **Use Case**: Dynamic filtering without server restart

### Priority Logic
```typescript
// Priority: params.project_id > EXCEPTIONLESS_PROJECT_ID > org-wide
const projectId = params.project_id || client.projectId;
const endpoint = projectId
  ? `/projects/${projectId}/events`  // Project-scoped
  : `/events`;                        // Organization-wide
```

### Example Usage
```javascript
// Discover available projects
get-projects({ limit: 50 })

// Filter by specific project (dynamic)
get-events({ project_id: 'abc123', limit: 10 })
count-events({ project_id: 'abc123' })
get-stacks({ project_id: 'abc123', filter: 'status:open' })

// Organization-wide (no project_id)
get-events({ limit: 10 })  // All projects
```

## Current Status

- ✅ Planning complete
- ✅ Documentation complete
- ✅ Read-only tool design (no write operations)
- ✅ **Implementation complete** - All 13 tools working
- ✅ **TypeScript build successful** - dist/ compiled
- ✅ **Unit tests written** - config, errors, fixtures
- ✅ **Production ready** - Ready for npm publishing
- ✅ **Dynamic filtering** - Optional project_id parameter on all tools
- ✅ **Enhanced documentation** - Complete parameter descriptions (~2,042 tokens)

## Implementation Summary

### Files Created (39 total)
**Core (6)**: config/index.ts, api/client.ts, api/endpoints.ts, api/errors.ts, api/retry.ts, utils/logger.ts
**Tools (13)**: 6 event tools + 3 stack tools + 2 project tools + 2 organization tools
**Server (2)**: server.ts, index.ts
**Config (4)**: package.json, tsconfig.json, .eslintrc.json, .prettierrc
**Tests (9)**: config.test.ts, errors.test.ts, fixtures (events.json, stacks.json), test-mcp.mjs, test-production.mjs, test-new-tools.mjs, test-dynamic-filtering.mjs, vitest.config.ts
**Docs (4)**: TOOLS.md, EXAMPLES.md, LICENSE, CHANGELOG.md
**CI/CD (2)**: test.yml, publish.yml
**Other (2)**: .env.example, .gitignore (includes .claude.json exclusion)

### Build Output
- ✅ TypeScript compiled to JavaScript in dist/
- ✅ Source maps generated
- ✅ Type declarations generated
- ✅ All imports using .js extensions (ESM)
- ✅ Shebang in index.js for CLI execution

### Ready For
1. **Local Testing**: `npm run dev` with .env file
2. **Claude Code Integration**: Point to dist/index.js
3. **npm Publishing**: Ready for tag and publish
4. **Production Use**: Full error handling, retry logic, logging

## Tool Documentation Standards

### Token Usage
- **Total documentation**: ~2,042 tokens across 13 tools
- **Average per tool**: ~157 tokens
- **Increase from baseline**: +699 tokens (52% more than minimal)

### Documentation Coverage
All parameters have complete descriptions:
- ✅ `project_id` - Dynamic filtering explained
- ✅ `filter` - Query syntax with examples (type:error, tag:prod, date:>now-7d)
- ✅ `sort` - Field names and descending prefix (-field)
- ✅ `time` - Range formats (last hour, last 7 days)
- ✅ `offset` - Timezone offset in minutes
- ✅ `mode` - Token impact (summary vs full)
- ✅ `page`, `limit` - Pagination with defaults
- ✅ `before`, `after` - Cursor pagination

### Rationale
Complete documentation enables AI to use tools effectively without trial-and-error, reducing overall conversation token usage despite higher base cost.

## Security Best Practices

### Sensitive Data Protection
- ✅ **No API keys** in source code (use environment variables)
- ✅ **No project IDs** hardcoded in code
- ✅ **No organization names** in committed files
- ✅ **No user PII** (emails, names) in code/tests
- ✅ **`.claude.json` gitignored** - Prevents credential leaks
- ✅ **`.env.example` has placeholders only** - No real values

### Configuration Sources
- ✅ Test files read from `.claude.json` (user's home directory)
- ✅ Source code uses environment variables
- ✅ Fixture data is generic (`"id": "event1"`, `"message": "Test error"`)

### Git History
- ✅ No API keys committed to git history
- ✅ No sensitive data in any commit
- ✅ Clean history ready for public distribution

---

**Remember**: The implementation is complete and production-ready. This is a READ-ONLY MCP - no data modification allowed.
