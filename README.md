# Exceptionless MCP Server

> **Status**: ✅ Production Ready
> Official MCP (Model Context Protocol) server for Exceptionless error tracking and monitoring.

## Overview

A production-ready MCP server that enables Claude Code to interact with the [Exceptionless](https://exceptionless.com/) API for error tracking, monitoring, and project management. This server provides 13 read-only query tools with intelligent filtering, project scoping, and token-optimized responses.

## Features

- **13 Read-Only Query Tools**
  - 6 Event tools (query, retrieve, count, sessions)
  - 3 Stack tools (query error groups and events)
  - 2 Project tools (discover and manage projects)
  - 2 Organization tools (view organization details)
- **Dynamic Project Filtering** - Filter queries by project without server restart
- **Security Boundaries** - Optional project-level access restrictions
- **Advanced Filtering & Search** - Powerful query syntax for finding errors
- **Session Tracking** - Analyze user journeys and error context
- **Token Optimized** - Minimal LLM token usage (~80-85% reduction)
- **Production Quality** - Comprehensive error handling, retry logic, and validation
- **Read-Only Operations** - Safe querying with no data modification
- **Complete Documentation** - All tool parameters fully documented

## Target Platform

- **Primary**: Claude Code (desktop)
- **Transport**: stdio (local execution)
- **Authentication**: API key via environment variables
- **Distribution**: Direct from GitHub or local installation

## Installation

### Option 1: Install Directly from GitHub (Recommended)

Add to your Claude Code configuration (`.claude.json`):

```json
{
  "mcpServers": {
    "exceptionless": {
      "command": "npx",
      "args": ["-y", "github:Tech-to-Thrive/mcp-exceptionless"],
      "env": {
        "EXCEPTIONLESS_API_KEY": "your-organization-api-key-here"
      }
    }
  }
}
```

**Location**: `.claude.json` is in your user home directory:
- **Windows**: `C:\Users\YourUsername\.claude.json`
- **macOS/Linux**: `~/.claude.json`

### Option 2: Install and Run Locally

```bash
# Clone the repository
git clone https://github.com/Tech-to-Thrive/mcp-exceptionless.git
cd mcp-exceptionless

# Install dependencies
npm install

# Build TypeScript
npm run build
```

Then add to `.claude.json`:

```json
{
  "mcpServers": {
    "exceptionless": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-exceptionless/dist/index.js"],
      "env": {
        "EXCEPTIONLESS_API_KEY": "your-organization-api-key-here"
      }
    }
  }
}
```

**Note**: Replace `/absolute/path/to/` with your actual installation path.

## Configuration

### Required Configuration

```json
{
  "EXCEPTIONLESS_API_KEY": "your-api-key"
}
```

### Optional Configuration

```json
{
  "EXCEPTIONLESS_API_KEY": "your-api-key",
  "EXCEPTIONLESS_PROJECT_ID": "project-id-to-restrict-access",
  "EXCEPTIONLESS_API_URL": "https://api.exceptionless.com",
  "EXCEPTIONLESS_TIMEOUT": "30000",
  "EXCEPTIONLESS_DEBUG": "false"
}
```

### Getting Your API Key

**For Organization-Wide Access** (Recommended):
1. Visit https://be.exceptionless.io/
2. Log in to your account
3. Generate an organization-level API token via the API:
   ```bash
   curl -X POST https://api.exceptionless.com/api/v2/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword"}'
   ```
4. Use the returned token as `EXCEPTIONLESS_API_KEY`

**For Project-Specific Access**:
1. Go to https://app.exceptionless.com/project/list
2. Select your project
3. Click "API Keys"
4. Copy your project API key
5. Set both `EXCEPTIONLESS_API_KEY` and `EXCEPTIONLESS_PROJECT_ID`

### Security: Project-Level Access Control

**Optional Security Boundary**: Set `EXCEPTIONLESS_PROJECT_ID` to restrict the MCP server to a single project:

```json
{
  "EXCEPTIONLESS_API_KEY": "your-key",
  "EXCEPTIONLESS_PROJECT_ID": "abc123"
}
```

When set, ALL queries are automatically restricted to that project. This is useful for:
- Limiting AI access to specific projects
- Using project-specific API keys
- Enforcing security boundaries

**Dynamic Filtering**: Even with org-wide access, you can filter individual queries by project:

```javascript
// Query specific project
get-events({ project_id: "abc123", limit: 10 })

// Query all projects (org-wide)
get-events({ limit: 10 })
```

## Available Tools

### Event Tools (6)

- **get-events** - Query events with filtering, sorting, and pagination
- **get-event** - Get detailed event information by ID
- **get-event-by-reference** - Retrieve event by external reference ID
- **count-events** - Count events with optional aggregations
- **get-sessions** - List user activity sessions
- **get-session-events** - Get all events in a session

### Stack Tools (3)

- **get-stacks** - List and search error stacks (grouped errors)
- **get-stack** - Get detailed stack information by ID
- **get-stack-events** - List all event occurrences for a stack

### Project Tools (2)

- **get-projects** - List all available projects (for discovery)
- **get-project** - Get detailed project information by ID

### Organization Tools (2)

- **get-organizations** - List all organizations you have access to
- **get-organization** - Get detailed organization information by ID

## Usage Examples

### Basic Queries

Ask Claude:
```
"Show my recent Exceptionless errors"
"Get details for error stack xyz"
"Find production errors from last 7 days"
"Count errors by type for the last 24 hours"
```

### Project Discovery

```
"List all my Exceptionless projects"
"Show me errors from the production project"
"What projects are available?"
```

### Advanced Filtering

```
"Show critical errors from last hour"
"Find all 404 errors in production"
"Count errors by tag for last week"
"Show open error stacks sorted by occurrence count"
```

### Dynamic Project Filtering

```
"Get errors for project abc123"
"Count events in my web project"
"Show stacks for mobile project sorted by recent activity"
```

## Filter Syntax

All query tools support powerful filtering:

```javascript
// Type filters
filter: "type:error"
filter: "type:log"

// Status filters
filter: "status:open"
filter: "status:fixed"
filter: "is_fixed:false"

// Tag filters
filter: "tag:production"
filter: "tag:api"

// Date comparisons
filter: "date:>now-7d"
filter: "date:<2025-01-01"

// Numeric comparisons
filter: "total_occurrences:>100"

// Combined filters
filter: "type:error AND tag:production AND is_fixed:false"
```

## Token Optimization

This MCP server is designed with token efficiency in mind:

- **Summary Mode Default**: Returns minimal fields (60-70% reduction)
- **Smart Pagination**: Default limit of 5-10 results (50% reduction)
- **Compact Responses**: Raw JSON output without wrappers (20-30% reduction)
- **Explicit Mode Control**: AI knows when to use `full` vs `summary` mode
- **Combined Savings**: ~80-85% total token reduction
- **Complete Documentation**: ~2,042 tokens for all 13 tools (enables first-try success)

All list operations default to `mode=summary` and conservative limits. Override by passing `mode=full` or higher `limit` values when needed.

## Project Structure

```
mcp-exceptionless/
├── src/                      # TypeScript source code
│   ├── api/                  # HTTP client, errors, retry, endpoints
│   ├── config/               # Configuration loader
│   ├── tools/                # Tool implementations
│   │   ├── events/          # 6 event tools
│   │   ├── stacks/          # 3 stack tools
│   │   ├── projects/        # 2 project tools
│   │   └── organizations/   # 2 organization tools
│   ├── utils/               # Logger
│   ├── server.ts            # MCP server setup
│   └── index.ts             # Entry point
├── tests/                    # Unit tests and fixtures
├── docs/                     # User documentation
├── dist/                     # Compiled JavaScript
├── memory-bank/             # Project documentation & planning
└── .github/workflows/        # CI/CD
```

## Development

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode (auto-rebuild)
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Testing

```bash
# Run all tests
npm test

# Run production test suite
node test-production.mjs

# Test dynamic filtering
node test-dynamic-filtering.mjs

# Test new tools
node test-new-tools.mjs
```

**Note**: Test scripts read credentials from `.claude.json` automatically.

## Documentation

### User Documentation
- [Tool Reference](docs/TOOLS.md) - Complete guide to all 13 tools
- [Usage Examples](docs/EXAMPLES.md) - Common query patterns
- [Filter Syntax Guide](docs/FILTERS.md) - Advanced filtering techniques
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

### Development Documentation
- [Claude Context](claude.md) - Complete project context for AI assistants
- [Exceptionless API Overview](memory-bank/docs/exceptionless-overview.md) - Complete API reference
- [MCP Architecture](memory-bank/docs/mcp-overview.md) - MCP protocol details
- [Build Plan](memory-bank/planning/mcp-exceptionless-build-plan.md) - Implementation guide

## Technology Stack

- **Language**: TypeScript (ES Modules)
- **Runtime**: Node.js 18+
- **MCP SDK**: `@modelcontextprotocol/sdk` ^1.0.0
- **HTTP Client**: Axios ^1.6.0
- **Validation**: Zod ^3.22.0
- **Logging**: Pino ^8.16.0
- **Testing**: Vitest ^1.0.0

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Security

This repository contains **no sensitive data**:
- ✅ No API keys (use `.claude.json` or environment variables)
- ✅ No project IDs or organization names
- ✅ No PII (emails, names, etc.)
- ✅ All test data is generic
- ✅ `.claude.json` is gitignored

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.

## Links

- [Exceptionless Website](https://exceptionless.com/)
- [Exceptionless API Docs](https://api.exceptionless.com/docs/index.html)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [GitHub Repository](https://github.com/Tech-to-Thrive/mcp-exceptionless)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Built for Claude Code** | Powered by the Model Context Protocol

**Status**: Production Ready ✅ | **Tools**: 13 Read-Only | **Token Usage**: ~2,042 tokens
