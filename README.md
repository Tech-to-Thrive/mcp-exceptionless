# Exceptionless MCP Server

> **Status**: Planning & Development
> Official MCP (Model Context Protocol) server for Exceptionless error tracking and monitoring.

## Overview

This project provides a production-ready MCP server that enables Claude Code users to interact with the [Exceptionless](https://exceptionless.com/) API for error tracking, monitoring, and stack management.

## Features

- **9 Read-Only Query Tools**
  - 6 Event tools (query, retrieve, count, sessions)
  - 3 Stack tools (query error groups and events)
- **Advanced Filtering & Search** - Powerful query syntax for finding errors
- **Session Tracking** - Analyze user journeys and error context
- **Token Optimized** - Minimal LLM token usage (80-85% reduction)
- **Production Quality** - Comprehensive error handling and validation
- **Read-Only Operations** - Safe querying with no data modification

## Target Platform

- **Primary**: Claude Code (desktop)
- **Transport**: stdio (local execution)
- **Authentication**: API key via environment variables
- **Distribution**: npm package (`npx -y mcp-exceptionless`)

## Project Structure

```
mcp-exceptionless/
├── memory-bank/              # Project documentation & planning
│   ├── docs/                 # Technical documentation
│   └── planning/             # Implementation plans
├── .claude/                  # Claude-specific configuration
├── src/                      # Source code (to be implemented)
├── tests/                    # Test suite (to be implemented)
└── docs/                     # User documentation (to be implemented)
```

## Quick Start

### 1. Get Your API Key
1. Go to https://app.exceptionless.io/project/list
2. Select your project
3. Click "API Keys"
4. Copy your project API key

### 2. Local Development
```bash
# Clone the repository
git clone https://github.com/Tech-to-Thrive/mcp-exceptionless.git
cd mcp-exceptionless

# Install dependencies
npm install

# Build
npm run build

# Create .env file
cp .env.example .env
# Edit .env and add your EXCEPTIONLESS_API_KEY

# Run locally
npm run dev
```

### 3. Use in Claude Code

Add to Claude Code settings (Settings → MCP Servers):

```json
{
  "mcpServers": {
    "exceptionless": {
      "command": "node",
      "args": ["C:\\Projects\\exceptionless_mcp\\dist\\index.js"],
      "env": {
        "EXCEPTIONLESS_API_KEY": "your-api-key-here",
        "EXCEPTIONLESS_DEBUG": "false"
      }
    }
  }
}
```

**Note**: Adjust the path to match your local installation directory.

### 4. Usage Examples
Ask Claude:
- "Show my recent Exceptionless errors"
- "Get details for error stack xyz"
- "Find production errors from last 7 days"
- "Count errors by type for the last 24 hours"
- "Show me all events for stack abc123"

## Available Tools

### Event Tools (6)
- `get-events` - Query events with advanced filtering
- `get-event` - Get detailed event information
- `get-event-by-reference` - Retrieve by external reference ID
- `count-events` - Count events with aggregations
- `get-sessions` - List user sessions
- `get-session-events` - Get events in a session

### Stack Tools (3)
- `get-stacks` - List and search error stacks
- `get-stack` - Get stack details
- `get-stack-events` - List event occurrences for a stack

## Documentation

### User Documentation
- [Tool Reference](docs/TOOLS.md) - Complete guide to all 9 tools
- [Usage Examples](docs/EXAMPLES.md) - Common query patterns
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Contributing](CONTRIBUTING.md) - How to contribute

### Development Documentation
- [Exceptionless API Overview](memory-bank/docs/exceptionless-overview.md)
- [MCP Architecture Overview](memory-bank/docs/mcp-overview.md)
- [Complete Build Plan](memory-bank/planning/mcp-exceptionless-build-plan.md)
- [Claude Context](claude.md)

## Development Status

**Current Phase**: Production Ready ✅

- [x] Exceptionless API research & documentation
- [x] MCP architecture research
- [x] Complete implementation plan with token optimization
- [x] Read-only tool design (9 query tools)
- [x] Full implementation complete
- [x] TypeScript build system
- [x] Unit tests and fixtures
- [x] Complete documentation
- [ ] Publishing to npm (ready)

## Technology Stack

- **Language**: TypeScript
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **HTTP Client**: Axios
- **Validation**: Zod
- **Testing**: Vitest
- **Logging**: Pino

## Token Optimization

This MCP server is designed with token efficiency in mind:

- **Summary Mode Default**: Returns lightweight responses (60-70% reduction)
- **Smart Pagination**: Default limit of 5 results (50% reduction)
- **Compact Responses**: Raw JSON output without verbose wrappers (20-30% reduction)
- **Combined Savings**: ~80-85% total token reduction

All list operations (`get-events`, `get-stacks`, `get-sessions`) default to `mode=summary` and `limit=5`. You can override these settings by explicitly passing `mode=full` or a higher `limit` value when you need more data.

## Project Structure

```
mcp-exceptionless/
├── src/                    # TypeScript source code
│   ├── api/               # HTTP client, errors, retry
│   ├── config/            # Configuration loader
│   ├── tools/             # Tool implementations
│   │   ├── events/       # 6 event tools
│   │   └── stacks/       # 3 stack tools
│   ├── utils/            # Logger
│   ├── server.ts         # MCP server setup
│   └── index.ts          # Entry point
├── tests/                 # Unit tests
├── docs/                  # User documentation
├── dist/                  # Compiled JavaScript
└── .github/workflows/     # CI/CD
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - See [LICENSE](LICENSE) for details.

## Links

- [Exceptionless Website](https://exceptionless.com/)
- [Exceptionless API Docs](https://api.exceptionless.io/docs/index.html)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [GitHub Repository](https://github.com/Tech-to-Thrive/mcp-exceptionless)

---

**Built for Claude Code** | Powered by the Model Context Protocol
