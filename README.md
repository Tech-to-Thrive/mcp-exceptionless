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

## Quick Start (Post-Implementation)

### 1. Installation
```bash
npx -y mcp-exceptionless
```

### 2. Configuration
Add to Claude Code settings:
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

### 3. Usage
Ask Claude:
- "Show my recent Exceptionless errors"
- "Get details for error stack xyz"
- "Find production errors from last 7 days"
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

- [Exceptionless API Overview](memory-bank/docs/exceptionless-overview.md)
- [MCP Architecture Overview](memory-bank/docs/mcp-overview.md)
- [Complete Build Plan](memory-bank/planning/mcp-exceptionless-build-plan.md)

## Development Status

**Current Phase**: Planning Complete ✅

- [x] Exceptionless API research & documentation
- [x] MCP architecture research
- [x] Complete implementation plan with token optimization
- [x] Read-only tool design (9 query tools)
- [ ] Implementation (pending)
- [ ] Testing (pending)
- [ ] Documentation (pending)
- [ ] Publishing to npm (pending)

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
