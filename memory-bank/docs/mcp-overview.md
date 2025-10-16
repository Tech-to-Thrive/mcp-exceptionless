# Model Context Protocol (MCP) - Comprehensive Overview

**Analysis Date**: 2025-10-16
**MCP Specification**: 2025-06-18
**Documentation Sources**:
- https://modelcontextprotocol.io
- https://support.claude.com/en/articles/11503834-building-custom-connectors-via-remote-mcp-servers
- https://github.com/modelcontextprotocol/typescript-sdk
- https://github.com/modelcontextprotocol/python-sdk

---

## Table of Contents

1. [What is MCP?](#what-is-mcp)
2. [Architecture](#architecture)
3. [Core Primitives](#core-primitives)
4. [Transport Mechanisms](#transport-mechanisms)
5. [Authentication & Authorization](#authentication--authorization)
6. [Local vs Remote Servers](#local-vs-remote-servers)
7. [SDK Overview](#sdk-overview)
8. [Development & Testing](#development--testing)
9. [Deployment Strategies](#deployment-strategies)
10. [Platform Support](#platform-support)
11. [Implications for Exceptionless MCP](#implications-for-exceptionless-mcp)

---

## What is MCP?

### Definition

**Model Context Protocol (MCP)** is an open-source standardized protocol for connecting AI applications (like Claude) to external systems. It's designed to be the "USB-C port for AI applications" - a universal interface that allows Large Language Models (LLMs) to interact with data sources, tools, and workflows.

### Purpose

MCP solves the problem of fragmented integrations between AI assistants and external services. Instead of building custom integrations for each AI application and data source combination, MCP provides a standardized way for:

- **AI Applications** to discover and use external capabilities
- **Service Providers** to expose their functionality to any MCP-compatible AI
- **Developers** to build once and integrate everywhere

### Key Benefits

**For Developers**:
- Reduces development time and complexity
- Write once, use across all MCP-compatible clients
- Standardized patterns and best practices
- Rich ecosystem of existing servers

**For AI Applications**:
- Access to ecosystem of tools and data sources
- Enhanced capabilities without custom code
- Better user experiences through broader integration

**For End Users**:
- Personalized AI assistants with calendar, email, productivity tools
- AI-driven workflows across multiple services
- Seamless integration without manual setup (in many cases)

### Use Cases

1. **Personal Productivity**
   - AI assistants accessing calendars, email, todo lists
   - File system access for code generation
   - Note-taking and knowledge management integration

2. **Development Tools**
   - Code generation using design specifications
   - Database query assistance
   - API interaction and testing

3. **Enterprise Integration**
   - Chatbots connecting to organizational databases
   - Document management and search
   - Workflow automation across systems

4. **Specialized Workflows**
   - Design and manufacturing coordination
   - Research with academic databases
   - Customer support with CRM integration

---

## Architecture

### Client-Server Model

MCP uses a **client-server architecture** where:

```
┌─────────────────────────────────────────┐
│         MCP Client (AI Application)      │
│         (e.g., Claude, Claude Code)      │
└────────────────┬────────────────────────┘
                 │ MCP Protocol
                 │ (JSON-RPC over transport)
┌────────────────▼────────────────────────┐
│         MCP Server (Integration)         │
│    (e.g., Exceptionless, GitHub, Slack)  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      External Service/Data Source        │
│        (API, Database, Files)            │
└─────────────────────────────────────────┘
```

### Components

#### 1. MCP Client
- **Role**: AI application that wants to access external capabilities
- **Examples**: Claude Desktop, Claude for web, Claude iOS/Android app, VS Code with Claude extension
- **Responsibilities**:
  - Discovers available servers
  - Lists available tools, prompts, and resources
  - Invokes tools on behalf of the LLM
  - Manages connections and authentication

#### 2. MCP Server
- **Role**: Integration layer that exposes external functionality
- **Examples**: GitHub server, file system server, database server, **Exceptionless server** (our project)
- **Responsibilities**:
  - Registers tools, prompts, and resources
  - Handles requests from clients
  - Validates inputs and outputs
  - Interfaces with external services
  - Manages state (if stateful)

#### 3. Transport Layer
- **Role**: Communication mechanism between client and server
- **Options**: stdio, Server-Sent Events (SSE), Streamable HTTP
- **Protocol**: JSON-RPC 2.0

### Communication Flow

**1. Discovery Phase**:
```
Client → Server: list_tools()
Server → Client: [tool1, tool2, tool3]

Client → Server: list_resources()
Server → Client: [resource1, resource2]

Client → Server: list_prompts()
Server → Client: [prompt1, prompt2]
```

**2. Execution Phase**:
```
User → Client: "Check my Exceptionless errors"
Client (LLM) → Server: call_tool(get-events, {filter: "type:error"})
Server → External API: GET /api/v2/events?filter=type:error
External API → Server: [event1, event2, event3]
Server → Client: {content: [...formatted events...]}
Client → User: "You have 3 recent errors: ..."
```

### Message Protocol

MCP uses **JSON-RPC 2.0** for all communication:

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get-events",
    "arguments": {
      "filter": "type:error",
      "limit": 10
    }
  }
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 3 errors: ..."
      }
    ]
  }
}
```

**Error**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid parameters",
    "data": { "field": "filter" }
  }
}
```

---

## Core Primitives

MCP defines three main primitives that servers can expose:

### 1. Tools

**Definition**: Functions that LLMs can call to perform actions or retrieve data with side effects.

**Characteristics**:
- **Model-controlled**: The LLM decides when and how to call them
- **Can have side effects**: Write data, send emails, create issues, etc.
- **Input validation**: Use schemas (e.g., Zod) to validate parameters
- **Structured output**: Return formatted data to the LLM

**Use Cases**:
- Query APIs (e.g., get Exceptionless events)
- Perform calculations
- Write/modify data (e.g., mark stack as fixed)
- Execute system commands
- Interact with external services

**TypeScript Example**:
```typescript
server.registerTool('get-events', {
  title: 'Get Exceptionless Events',
  description: 'Query events with filtering',
  inputSchema: z.object({
    filter: z.string().optional(),
    limit: z.number().min(1).max(100).default(10)
  }),
  outputSchema: z.object({
    events: z.array(z.any()),
    total: z.number()
  })
}, async ({ filter, limit }) => {
  // Call Exceptionless API
  const events = await exceptionlessClient.getEvents({ filter, limit });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(events, null, 2)
    }]
  };
});
```

**Python Example**:
```python
@mcp.tool()
def get_events(filter: str = "", limit: int = 10) -> dict:
    """Query Exceptionless events with filtering"""
    events = exceptionless_client.get_events(filter=filter, limit=limit)
    return {"events": events, "total": len(events)}
```

### 2. Resources

**Definition**: Data sources that LLMs can read without side effects (read-only access).

**Characteristics**:
- **No side effects**: Pure data retrieval
- **Can be static or dynamic**: Pre-defined or computed on demand
- **Context-aware**: Support parameter completion
- **Efficient**: Can return resource links instead of full content

**Use Cases**:
- File contents
- Database records
- API documentation
- Configuration data
- Static reference material

**Differences from Tools**:
| Aspect | Tools | Resources |
|--------|-------|-----------|
| Side effects | Yes (can modify) | No (read-only) |
| Complexity | Can be computationally expensive | Lightweight data access |
| Control | LLM decides when to call | Client can preload/cache |
| Use case | Actions, queries with filtering | Pure data retrieval |

**TypeScript Example**:
```typescript
server.registerResource('event://{id}', {
  title: 'Event Details',
  description: 'Get details of a specific event'
}, async ({ id }) => {
  const event = await exceptionlessClient.getEvent(id);

  return {
    contents: [{
      uri: `event://${id}`,
      mimeType: 'application/json',
      text: JSON.stringify(event, null, 2)
    }]
  };
});
```

**Python Example**:
```python
@mcp.resource("event://{id}")
def get_event_resource(id: str) -> str:
    """Get event details by ID"""
    event = exceptionless_client.get_event(id)
    return json.dumps(event, indent=2)
```

### 3. Prompts

**Definition**: Reusable prompt templates or workflows that guide the LLM.

**Characteristics**:
- **Templated**: Support parameters/variables
- **Workflow guidance**: Multi-step instructions
- **Context injection**: Include relevant data
- **Reusable**: Standardize common tasks

**Use Cases**:
- Guided troubleshooting workflows
- Code review templates
- Report generation
- Analysis frameworks
- Multi-step procedures

**Example**:
```typescript
server.registerPrompt('analyze-error-stack', {
  title: 'Analyze Error Stack',
  description: 'Comprehensive error analysis workflow',
  arguments: [{
    name: 'stackId',
    description: 'Stack ID to analyze',
    required: true
  }]
}, async ({ stackId }) => {
  return {
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `Analyze error stack ${stackId}. Please:
1. Retrieve stack details
2. Get recent occurrences
3. Identify patterns
4. Suggest root cause
5. Recommend fixes`
      }
    }]
  };
});
```

### Comparison Matrix

| Feature | Tools | Resources | Prompts |
|---------|-------|-----------|---------|
| **Purpose** | Actions & queries | Data access | Workflows |
| **Side effects** | Yes | No | N/A (guidance only) |
| **LLM control** | High (decides when) | Medium (can preload) | Low (user initiates) |
| **Validation** | Input schemas | URI patterns | Argument schemas |
| **Output** | Structured data | Raw content | Prompt text |
| **Examples** | API calls, calculations | Files, records | Analysis templates |

---

## Transport Mechanisms

MCP supports multiple transport mechanisms for client-server communication:

### 1. stdio (Standard Input/Output)

**Description**: Communication via standard input and output streams.

**Architecture**:
```
┌─────────────────────────────────────┐
│    MCP Client (e.g., Claude Code)   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  spawn process via npx         │ │
│  │  node mcp-server.js            │ │
│  │                                 │ │
│  │  stdin  ──────────────────►    │ │
│  │                                 │ │
│  │  stdout ◄──────────────────    │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Characteristics**:
- **Local only**: Server runs as subprocess
- **Process lifecycle**: Client manages server process
- **Simplest implementation**: Standard Node.js/Python patterns
- **No network**: Direct process communication
- **Security**: Inherits client's security context

**Pros**:
✅ Simple to implement
✅ No hosting required
✅ Works offline
✅ Low latency (local)
✅ No auth complexity

**Cons**:
❌ Limited to Claude Desktop
❌ Not available on web/mobile
❌ Requires Node.js/Python installed
❌ No multi-user sharing
❌ Each user runs own instance

**Use Cases**:
- Personal development tools
- File system access
- Local database queries
- Desktop-only applications

**Configuration (Claude Code)**:
```json
{
  "mcpServers": {
    "exceptionless": {
      "command": "npx",
      "args": ["-y", "mcp-exceptionless"],
      "env": {
        "EXCEPTIONLESS_API_KEY": "key"
      }
    }
  }
}
```

### 2. SSE (Server-Sent Events)

**Description**: HTTP-based unidirectional streaming from server to client.

**Architecture**:
```
┌─────────────────────────────────────┐
│    MCP Client (Claude Web/Mobile)   │
│                                     │
│  HTTP POST (requests) ────────────► │
│                                     │
│  SSE Stream ◄────────────────────── │
│  (server events)                    │
└─────────────────────────────────────┘
                 │
                 │ HTTPS
                 ▼
┌─────────────────────────────────────┐
│        Remote MCP Server            │
│     (hosted, publicly accessible)   │
└─────────────────────────────────────┘
```

**Characteristics**:
- **Remote**: Server hosted separately
- **HTTP-based**: Uses standard HTTP/HTTPS
- **Streaming**: Real-time updates from server
- **Stateful**: Maintains connection
- **Bidirectional**: POST for requests, SSE for responses

**Pros**:
✅ Works on all Claude platforms (web, mobile, desktop)
✅ Can be shared across users
✅ Centralized deployment
✅ Scalable hosting
✅ No client-side dependencies

**Cons**:
❌ Requires hosting infrastructure
❌ More complex implementation
❌ Network latency
❌ Auth management needed
❌ Connection management

**Use Cases**:
- Multi-user applications
- Cloud-hosted integrations
- Mobile/web access required
- Shared organizational resources

**Example (TypeScript)**:
```typescript
const server = new McpServer({
  name: 'exceptionless-remote',
  version: '1.0.0'
});

// SSE transport
const transport = new SSEServerTransport('/mcp/sse', server);
transport.listen(3000);
```

### 3. Streamable HTTP

**Description**: HTTP-based streaming protocol optimized for MCP.

**Architecture**:
```
┌─────────────────────────────────────┐
│         MCP Client                  │
│                                     │
│  HTTP POST (streaming) ◄──────────► │
│  (request & response streaming)     │
└─────────────────────────────────────┘
                 │
                 │ HTTPS
                 ▼
┌─────────────────────────────────────┐
│        Remote MCP Server            │
│   (stateless or stateful)           │
└─────────────────────────────────────┘
```

**Characteristics**:
- **Stateless option**: Can be stateless for easier scaling
- **Bidirectional streaming**: Both request and response can stream
- **HTTP standard**: Works with standard HTTP infrastructure
- **Flexible**: Supports both stateful and stateless patterns

**Pros**:
✅ Better scalability (especially stateless)
✅ Standard HTTP (works with CDNs, load balancers)
✅ Flexible deployment
✅ All platforms supported
✅ Efficient for large payloads

**Cons**:
❌ More complex than stdio
❌ Requires hosting
❌ Network considerations
❌ Auth required for remote

**Use Cases**:
- High-scale deployments
- CDN-backed services
- Stateless APIs
- Global distribution

**Example (TypeScript)**:
```typescript
const server = new McpServer({
  name: 'exceptionless-http',
  version: '1.0.0'
});

// Streamable HTTP transport
const transport = new StreamableHttpServerTransport(server);
app.use('/mcp', transport.handleRequest);
```

### Transport Comparison

| Feature | stdio | SSE | Streamable HTTP |
|---------|-------|-----|-----------------|
| **Platforms** | Desktop only | All | All |
| **Hosting** | Local | Remote | Remote |
| **Scalability** | Per-user | Medium | High |
| **Latency** | Lowest | Medium | Medium |
| **Setup complexity** | Low | Medium | Medium-High |
| **Auth required** | No | Yes (remote) | Yes (remote) |
| **Stateless option** | No | No | Yes |
| **Best for** | Dev tools | Multi-user | Scale/CDN |

---

## Authentication & Authorization

### Overview

MCP authentication is **optional** - servers can be:
1. **Authless**: No authentication required (e.g., public data)
2. **API Key**: Bearer token authentication
3. **OAuth 2.1**: Full OAuth flow with PKCE

### Authentication Roles

In OAuth scenarios:
- **MCP Server**: Acts as OAuth 2.1 resource server
- **MCP Client**: Acts as OAuth 2.1 client
- **Authorization Server**: Issues access tokens (can be third-party)

### Authless Servers

**When to use**:
- Public data sources
- No sensitive operations
- Local stdio servers (already secured by OS)
- Demo/testing purposes

**Example**: Public API wrappers, calculators, reference data

### API Key / Bearer Token Authentication

**When to use**:
- Simple authentication needed
- Pre-existing API keys
- No user-specific auth required
- **Our Exceptionless use case**

**Flow**:
```
1. User configures API key in client
2. Client includes key in every request:
   Authorization: Bearer {api_key}
3. Server validates key
4. Server proxies to external API with key
```

**Configuration**:
```json
{
  "mcpServers": {
    "exceptionless": {
      "command": "npx",
      "args": ["-y", "mcp-exceptionless"],
      "env": {
        "EXCEPTIONLESS_API_KEY": "your-project-key"
      }
    }
  }
}
```

**Server Implementation**:
```typescript
// Server reads API key from environment
const apiKey = process.env.EXCEPTIONLESS_API_KEY;

// Uses it for all Exceptionless API calls
axios.get('https://api.exceptionless.io/api/v2/events', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

### OAuth 2.1 with PKCE

**When to use**:
- User-specific authentication
- Per-user permissions
- Security-critical operations
- Public remote servers

**Supported Specifications**:
- **3/26 spec**: Early MCP auth spec (March 2026 draft)
- **6/18 spec**: Current MCP auth spec (June 2025-06-18)
- **Dynamic Client Registration (DCR)**: Automatic client registration

**OAuth Flow**:

```
1. Server returns 401 with WWW-Authenticate header:
   WWW-Authenticate: Bearer realm="MCP",
                     as_uri="https://auth.example.com",
                     scope="mcp:events mcp:stacks"

2. Client discovers auth server metadata:
   GET https://auth.example.com/.well-known/oauth-authorization-server

3. (Optional) Dynamic Client Registration:
   POST https://auth.example.com/register
   {
     "client_name": "Claude",
     "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"]
   }

4. User authorization (browser redirect):
   GET https://auth.example.com/authorize
     ?client_id={client_id}
     &redirect_uri=https://claude.ai/api/mcp/auth_callback
     &response_type=code
     &scope=mcp:events
     &code_challenge={pkce_challenge}
     &code_challenge_method=S256

5. Token exchange:
   POST https://auth.example.com/token
   {
     "grant_type": "authorization_code",
     "code": "{auth_code}",
     "redirect_uri": "https://claude.ai/api/mcp/auth_callback",
     "code_verifier": "{pkce_verifier}"
   }

6. Server receives access token:
   Authorization: Bearer {access_token}
```

**Security Requirements** (MUST):
- ✅ Use HTTPS for all communication
- ✅ Implement PKCE (Proof Key for Code Exchange)
- ✅ Validate token audience
- ✅ Use Bearer token authorization
- ✅ **NOT** pass through tokens between services
- ✅ Short-lived tokens
- ✅ No tokens in query strings

**OAuth Callback URL** (for Claude):
```
https://claude.ai/api/mcp/auth_callback
```

**Token Handling**:
```typescript
// Client sends token in Authorization header
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

// Server validates and uses token
async function validateToken(token: string) {
  // Verify signature
  // Check expiration
  // Validate audience
  // Extract scopes
}
```

**Token Refresh** (when tokens expire):
```
POST https://auth.example.com/token
{
  "grant_type": "refresh_token",
  "refresh_token": "{refresh_token}",
  "client_id": "{client_id}"
}
```

### Error Responses

**401 Unauthorized**: No or invalid token
```json
{
  "error": {
    "code": -32001,
    "message": "Unauthorized: Invalid or expired token"
  }
}
```

**403 Forbidden**: Valid token, insufficient permissions
```json
{
  "error": {
    "code": -32003,
    "message": "Forbidden: Insufficient permissions for this resource"
  }
}
```

### Authentication Decision Matrix

| Scenario | Recommended Auth |
|----------|------------------|
| Local stdio server | Authless (OS security) |
| Public data API | Authless |
| Pre-existing API keys | Bearer/API Key |
| User-specific data | OAuth 2.1 |
| Multi-tenant remote | OAuth 2.1 + DCR |
| Enterprise remote | OAuth 2.1 |
| **Exceptionless (our case)** | **Bearer/API Key** |

---

## Local vs Remote Servers

### Local Servers (stdio)

**Architecture**:
```
User's Computer
├── Claude Desktop App
│   └── spawns → MCP Server Process
│       └── accesses → External API (network)
```

**Characteristics**:
- Server runs as subprocess
- Managed by Claude Desktop
- Accesses external APIs via network
- Dies when client closes
- One instance per user

**Example Flow**:
```
1. User opens Claude Desktop
2. Claude reads settings.json
3. Claude spawns: npx -y mcp-exceptionless
4. Server starts, loads API key from env
5. Server ready, registers tools
6. User asks: "Show my errors"
7. Claude calls tool: get-events
8. Server makes HTTPS request to Exceptionless API
9. Server returns formatted response
10. Claude shows result to user
```

**Platform Support**:
- ✅ Claude Desktop (macOS, Windows, Linux)
- ❌ Claude web (claude.ai)
- ❌ Claude iOS app
- ❌ Claude Android app

**Advantages**:
- Simple deployment (npm/pip package)
- No hosting costs
- Works offline (if data is local)
- Inherits OS security
- Easy debugging (local logs)
- Fast (no network overhead for communication)

**Disadvantages**:
- Desktop-only
- Requires runtime (Node.js/Python)
- No cross-user sharing
- Each user installs separately
- Updates require user action

**Best For**:
- Development tools
- Personal productivity
- File system access
- Local databases
- Proof of concept

### Remote Servers (SSE / Streamable HTTP)

**Architecture**:
```
Cloud/Server Environment
├── MCP Server (hosted)
│   └── accesses → External API (Exceptionless)
│
Internet (HTTPS)
│
Multiple Clients
├── Claude Desktop
├── Claude Web (claude.ai)
├── Claude iOS App
└── Claude Android App
```

**Characteristics**:
- Server always running (hosted)
- Publicly accessible via HTTPS
- Multiple clients can connect
- Centralized deployment
- Requires auth management

**Example Flow**:
```
1. User opens Claude web
2. User adds connector: https://mcp.example.com/exceptionless
3. OAuth flow (if configured):
   a. Redirect to auth server
   b. User logs in
   c. Redirect back with token
4. Claude connects via SSE/HTTP
5. Server authenticates Claude (validates token)
6. User asks: "Show my errors"
7. Claude sends request over HTTPS to MCP server
8. Server makes HTTPS request to Exceptionless API
9. Server returns formatted response
10. Claude shows result to user
```

**Platform Support**:
- ✅ Claude Desktop
- ✅ Claude web (claude.ai)
- ✅ Claude iOS app (as of July 2025)
- ✅ Claude Android app (as of July 2025)

**Advantages**:
- Works on all platforms
- Centralized deployment
- Shared across users (or can be)
- No client-side dependencies
- Automatic updates
- Better for teams/enterprises

**Disadvantages**:
- Requires hosting (cost)
- More complex setup
- Auth management needed
- Network latency
- Scaling considerations
- Connection management

**Best For**:
- Multi-platform support
- Team/organizational tools
- Cloud integrations
- Mobile access required
- **Better reach for our Exceptionless MCP**

### Deployment Comparison

| Aspect | Local (stdio) | Remote (SSE/HTTP) |
|--------|---------------|-------------------|
| **Platforms** | Desktop only | All (desktop, web, mobile) |
| **Installation** | Per-user (npm) | Once (cloud) |
| **Runtime** | Node/Python required | Server-side only |
| **Hosting** | None | Cloud/VPS/Serverless |
| **Cost** | Free | Hosting cost |
| **Scalability** | Per-user | Unlimited users |
| **Updates** | User updates package | Deploy once |
| **Auth** | API key in env | OAuth or API key |
| **Latency** | Low (local) | Higher (network) |
| **Debugging** | Easy (local logs) | Harder (remote logs) |
| **Best for** | Dev tools, demos | Production, mobile |

### Hybrid Approach

Some projects offer **both**:

```javascript
// Local version (npm package)
"name": "mcp-exceptionless"
"bin": { "mcp-exceptionless": "./dist/index.js" }

// Remote version (hosted)
"Remote URL": "https://mcp.example.com/exceptionless"
```

**Benefits**:
- Maximum reach (all users can access)
- Choice for power users (local for speed)
- Fallback if hosting is down
- Testing locally before pushing remote

---

## SDK Overview

### TypeScript SDK

**Repository**: https://github.com/modelcontextprotocol/typescript-sdk

**Package**: `@modelcontextprotocol/sdk`

**Installation**:
```bash
npm install @modelcontextprotocol/sdk
```

**Key Features**:
- Type-safe tool/resource registration
- Zod schema validation
- Multiple transport support
- Session management
- Structured output handling

**Basic Server Example**:
```typescript
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';

const server = new McpServer({
  name: 'exceptionless-server',
  version: '1.0.0'
});

// Register tool
server.registerTool('get-events', {
  title: 'Get Exceptionless Events',
  description: 'Query events with optional filtering',
  inputSchema: z.object({
    filter: z.string().optional(),
    limit: z.number().min(1).max(100).default(10)
  }),
  outputSchema: z.object({
    events: z.array(z.any()),
    total: z.number()
  })
}, async ({ filter, limit }) => {
  // Implementation
  const events = await getEvents(filter, limit);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ events, total: events.length }, null, 2)
    }]
  };
});

// Start server
server.connect({ transport: 'stdio' });
```

**Transport Examples**:

```typescript
// stdio (local)
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
const transport = new StdioServerTransport();
await server.connect(transport);

// SSE (remote)
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
const transport = new SSEServerTransport('/mcp/sse', server);
transport.listen(3000);

// Streamable HTTP (remote)
import { StreamableHttpServerTransport } from '@modelcontextprotocol/sdk/server/streamable-http.js';
const transport = new StreamableHttpServerTransport(server);
app.use('/mcp', transport.handleRequest);
```

**Structured Output**:
```typescript
server.registerTool('add', {
  title: 'Add Numbers',
  inputSchema: z.object({
    a: z.number(),
    b: z.number()
  }),
  outputSchema: z.object({
    result: z.number()
  })
}, async ({ a, b }) => {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ result: a + b })
    }],
    structuredContent: { result: a + b } // Typed output
  };
});
```

### Python SDK

**Repository**: https://github.com/modelcontextprotocol/python-sdk

**Package**: `mcp`

**Installation**:
```bash
pip install mcp
```

**Key Features**:
- FastMCP framework for quick setup
- Pydantic model support
- TypedDict and dataclass support
- Multiple transport support
- Decorator-based API

**Basic Server Example**:
```python
from mcp.server.fastmcp import FastMCP
from typing import Dict, List

mcp = FastMCP("exceptionless-server")

@mcp.tool()
def get_events(filter: str = "", limit: int = 10) -> Dict:
    """Query Exceptionless events with optional filtering"""
    events = exceptionless_client.get_events(filter=filter, limit=limit)
    return {
        "events": events,
        "total": len(events)
    }

@mcp.resource("event://{id}")
def get_event(id: str) -> str:
    """Get event details by ID"""
    event = exceptionless_client.get_event(id)
    return json.dumps(event, indent=2)

# Run server
if __name__ == "__main__":
    mcp.run()
```

**Pydantic Models**:
```python
from pydantic import BaseModel

class Event(BaseModel):
    id: str
    type: str
    message: str
    date: str

@mcp.tool()
def get_event_typed(id: str) -> Event:
    """Get event with typed output"""
    event = exceptionless_client.get_event(id)
    return Event(**event)
```

**Transport Support**:
```python
# stdio (local)
mcp.run(transport="stdio")

# SSE (remote)
from mcp.server.sse import SSEServerTransport
transport = SSEServerTransport()
mcp.run(transport=transport, port=3000)
```

### SDK Comparison

| Feature | TypeScript SDK | Python SDK |
|---------|----------------|------------|
| **Type Safety** | TypeScript + Zod | Pydantic / TypedDict |
| **API Style** | Class-based | Decorator-based |
| **Validation** | Zod schemas | Pydantic models |
| **Transports** | stdio, SSE, HTTP | stdio, SSE, HTTP |
| **Async** | Native async/await | Native async/await |
| **Ecosystem** | npm, Node.js | PyPI, Python |
| **Best For** | Node.js developers | Python developers |
| **Learning Curve** | Medium | Lower (FastMCP) |

### Choosing an SDK

**Choose TypeScript if**:
- Building for Node.js ecosystem
- Want strong typing with TypeScript
- Prefer npm distribution
- Team is familiar with JS/TS

**Choose Python if**:
- Building for Python ecosystem
- Want Pydantic models
- Prefer pip distribution
- Team is familiar with Python
- Using Python-based services (Django, FastAPI)

**For Our Exceptionless MCP**:
- **TypeScript** ✅ (per our plan)
- Rationale:
  - npm distribution is standard for MCP
  - Claude Code has great TS/Node support
  - Axios for HTTP (mature, well-tested)
  - Large Node.js ecosystem
  - Our plan already uses TypeScript

---

## Development & Testing

### MCP Inspector

**Purpose**: Interactive testing and debugging tool for MCP servers

**Repository**: https://github.com/modelcontextprotocol/inspector

**Architecture**:
```
┌──────────────────────────────────────┐
│    Web Browser (Developer)           │
│    ┌──────────────────────────────┐  │
│    │  MCP Inspector Client (UI)   │  │
│    │  (React application)         │  │
│    └────────────┬─────────────────┘  │
└─────────────────┼────────────────────┘
                  │ HTTP
┌─────────────────▼────────────────────┐
│    MCP Proxy (MCPP)                  │
│    (Node.js server, bridges)         │
└─────────────────┬────────────────────┘
                  │ stdio/SSE/HTTP
┌─────────────────▼────────────────────┐
│    Your MCP Server                   │
│    (Under development/testing)       │
└──────────────────────────────────────┘
```

**Quick Start**:
```bash
# Run inspector
npx @modelcontextprotocol/inspector

# Or with specific server
npx @modelcontextprotocol/inspector npx -y mcp-exceptionless
```

**Features**:

**1. Interactive UI Mode**:
- Visual interface for testing
- List all tools/resources/prompts
- Call tools with custom parameters
- View responses in real-time
- Test error handling

**2. CLI Mode**:
- Scriptable testing
- CI/CD integration
- Automated testing
- Quick verification

**3. Transport Support**:
- stdio (local servers)
- SSE (remote servers)
- Streamable HTTP (remote servers)

**4. Authentication**:
- Test OAuth flows
- Bearer token testing
- Auth configuration

**Usage Example**:

```bash
# Start inspector with your server
npx @modelcontextprotocol/inspector npx mcp-exceptionless

# Opens browser at http://localhost:5173
# UI shows:
# - Available tools: get-events, get-stacks, mark-stack-fixed, ...
# - Click tool → Fill parameters → Execute → See result
```

**Testing Workflow**:

```
1. Start development server
   └─> npm run dev (or equivalent)

2. Launch inspector
   └─> npx @modelcontextprotocol/inspector

3. Interactive testing
   ├─> List tools
   ├─> Test each tool with sample inputs
   ├─> Verify outputs
   ├─> Test error cases
   └─> Check edge cases

4. Iterate
   └─> Fix bugs, refresh inspector, retest
```

**CLI Testing**:
```bash
# List tools
npx @modelcontextprotocol/inspector list-tools

# Call a tool
npx @modelcontextprotocol/inspector call-tool get-events \
  --arg filter="type:error" \
  --arg limit=5

# Test resource
npx @modelcontextprotocol/inspector get-resource event://abc123
```

**Security**:
- Inspector binds to localhost only (by default)
- No exposure to external networks
- Safe for development

### Testing Best Practices

**Unit Tests**:
```typescript
import { describe, it, expect } from 'vitest';
import { server } from './mcp-server';

describe('get-events tool', () => {
  it('should validate parameters', async () => {
    const result = await server.callTool('get-events', {
      limit: 150 // Invalid: max is 100
    });

    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('limit');
  });

  it('should return events', async () => {
    const result = await server.callTool('get-events', {
      filter: 'type:error',
      limit: 10
    });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
  });
});
```

**Integration Tests** (with MCP Inspector):
```bash
#!/bin/bash
# test-mcp-server.sh

# Start server in background
npm run dev &
SERVER_PID=$!

# Wait for startup
sleep 2

# Run tests via inspector CLI
npx @modelcontextprotocol/inspector call-tool get-events \
  --arg filter="type:error" \
  --arg limit=5

# Capture exit code
TEST_RESULT=$?

# Cleanup
kill $SERVER_PID

exit $TEST_RESULT
```

**Manual Testing Checklist**:
- [ ] All tools discoverable
- [ ] Tools execute without errors
- [ ] Input validation works
- [ ] Output format is correct
- [ ] Error messages are clear
- [ ] Resources are accessible
- [ ] Prompts render correctly
- [ ] Auth works (if applicable)
- [ ] Handles edge cases (empty results, timeouts, etc.)

---

## Deployment Strategies

### 1. Local stdio Deployment (Current Plan)

**Method**: npm package

**Structure**:
```
mcp-exceptionless/
├── package.json          ("bin": { "mcp-exceptionless": "..." })
├── dist/
│   └── index.js         (Entry point)
└── ...
```

**Installation**:
```bash
# Via npx (no install)
npx -y mcp-exceptionless

# Via global install
npm install -g mcp-exceptionless

# Via local install
npm install mcp-exceptionless
```

**Claude Desktop Configuration**:
```json
{
  "mcpServers": {
    "exceptionless": {
      "command": "npx",
      "args": ["-y", "mcp-exceptionless"],
      "env": {
        "EXCEPTIONLESS_API_KEY": "your-key"
      }
    }
  }
}
```

**Advantages**:
✅ Simple deployment (npm publish)
✅ No hosting needed
✅ Easy for users
✅ Works offline

**Limitations**:
❌ Desktop only
❌ No mobile/web support

### 2. Remote SSE/HTTP Deployment

**Hosting Options**:

#### A. Traditional VPS/Cloud
- DigitalOcean, AWS EC2, Google Cloud, Azure
- Full control
- Manual scaling

**Setup**:
```bash
# Deploy to server
git clone https://github.com/your-org/mcp-exceptionless.git
cd mcp-exceptionless
npm install
npm run build

# Run with PM2
pm2 start dist/index.js --name mcp-exceptionless

# Configure nginx reverse proxy
# https://your-domain.com/mcp → localhost:3000
```

#### B. Cloudflare Workers (Recommended by Anthropic)
- Serverless
- Auto-scaling
- Global distribution
- OAuth management included

**Cloudflare AI Playground**: https://playground.ai.cloudflare.com/

**Features**:
- Deploy MCP servers as Workers
- Automatic OAuth handling
- Built-in auth UI
- Scale automatically
- Low latency (edge computing)

**Deployment**:
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy
wrangler deploy
```

**Configuration** (wrangler.toml):
```toml
name = "mcp-exceptionless"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[env.production]
route = "mcp.example.com/exceptionless"
```

#### C. Serverless (AWS Lambda, Vercel, Netlify)
- Pay per use
- Auto-scaling
- Zero maintenance

**Vercel Example**:
```javascript
// api/mcp/index.js
import { McpServer } from '@modelcontextprotocol/sdk';

const server = new McpServer({ name: 'exceptionless' });
// ... register tools ...

export default async (req, res) => {
  await server.handleStreamableHttpRequest(req, res);
};
```

**Deploy**:
```bash
vercel --prod
```

#### D. Docker/Kubernetes
- Containerized
- Scalable
- Production-grade

**Dockerfile**:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Deploy**:
```bash
docker build -t mcp-exceptionless .
docker run -p 3000:3000 \
  -e EXCEPTIONLESS_API_KEY=key \
  mcp-exceptionless
```

### 3. Hybrid Deployment

**Offer both local and remote**:

```json
// package.json
{
  "name": "mcp-exceptionless",
  "version": "1.0.0",
  "bin": {
    "mcp-exceptionless": "./dist/index.js"
  },
  "main": "./dist/server.js"
}
```

**Benefits**:
- Users choose deployment method
- Local for development/testing
- Remote for production/mobile
- Maximum flexibility

### Deployment Comparison

| Option | Complexity | Cost | Platforms | Scalability |
|--------|------------|------|-----------|-------------|
| npm (stdio) | Low | Free | Desktop | Per-user |
| VPS/Cloud | Medium | $5-50/mo | All | Manual |
| Cloudflare | Medium | Free-$5/mo | All | Auto |
| Serverless | Low-Med | Pay-per-use | All | Auto |
| Docker/K8s | High | Variable | All | High |

### Recommendation for Exceptionless MCP

**Phase 1**: stdio (npm package)
- Get MVP working
- Easy for early adopters
- Desktop users (developers)

**Phase 2**: Remote deployment
- Cloudflare Workers OR
- Vercel serverless
- Reach mobile/web users
- Broader adoption

---

## Platform Support

### Claude Desktop

**Availability**: All MCP servers (stdio, SSE, HTTP)

**Configuration**: `settings.json`

**Location**:
- macOS: `~/Library/Application Support/Claude/settings.json`
- Windows: `%APPDATA%\Claude\settings.json`

**Example**:
```json
{
  "mcpServers": {
    "exceptionless-local": {
      "command": "npx",
      "args": ["-y", "mcp-exceptionless"],
      "env": { "EXCEPTIONLESS_API_KEY": "key" }
    },
    "exceptionless-remote": {
      "url": "https://mcp.example.com/exceptionless",
      "auth": {
        "type": "oauth",
        "authorization_url": "https://auth.example.com/authorize"
      }
    }
  }
}
```

### Claude for Web (claude.ai)

**Availability**: Remote servers only (SSE, HTTP)

**Configuration**: Via UI in Settings → Connectors

**Features**:
- Add connector by URL
- OAuth flow in browser
- Manage multiple connectors
- Enable/disable per conversation

**Example**:
```
1. Go to claude.ai
2. Settings → Connectors
3. Add Connector
4. Enter URL: https://mcp.example.com/exceptionless
5. (If OAuth) Complete auth flow
6. Connector available in conversations
```

### Claude iOS App

**Availability**: Remote servers only (SSE, HTTP)
**Launch**: July 2025 (as stated in article)

**Configuration**: Via app settings

**Use Case**: Mobile error monitoring, on-the-go incident response

### Claude Android App

**Availability**: Remote servers only (SSE, HTTP)
**Launch**: July 2025 (as stated in article)

**Configuration**: Via app settings

**Use Case**: Mobile error monitoring, on-the-go incident response

### Platform Feature Matrix

| Platform | stdio | SSE | HTTP | OAuth | When Available |
|----------|-------|-----|------|-------|----------------|
| Claude Desktop | ✅ | ✅ | ✅ | ✅ | Now |
| Claude Web | ❌ | ✅ | ✅ | ✅ | Now |
| Claude iOS | ❌ | ✅ | ✅ | ✅ | July 2025 |
| Claude Android | ❌ | ✅ | ✅ | ✅ | July 2025 |

### Other MCP Clients

- **VS Code** (with Claude extension): stdio
- **Cursor** (AI code editor): stdio
- **Custom clients**: Any (via SDK)

---

## Implications for Exceptionless MCP

### Current Plan Review

**Our Original Plan** (from mcp-plan.md):
- **Transport**: stdio only
- **Distribution**: npm package (`npx -y mcp-exceptionless`)
- **Platform**: Claude Desktop only
- **Auth**: API key (Bearer token)

**Assessment**:
✅ Valid for Phase 1 / MVP
✅ Easiest implementation
✅ Quick to market
❌ Limited reach (desktop only)
❌ No mobile users
❌ No web users

### Strategic Recommendations

#### Option 1: Stick with stdio (Original Plan)

**Pros**:
- Fastest to implement
- No hosting complexity
- No OAuth needed
- Proven pattern (many MCP servers use this)

**Cons**:
- Desktop-only limits adoption
- Misses mobile/web opportunity
- Less compelling for Exceptionless promotion

**When to choose**:
- Quick MVP
- Targeting developers only
- Testing market fit

#### Option 2: Remote Server (New Recommendation)

**Pros**:
- ALL Claude platforms (desktop, web, iOS, Android)
- Broader user base
- Better for Exceptionless visibility
- Mobile incident response
- Team sharing possible

**Cons**:
- More complex implementation
- Hosting required (but Cloudflare is cheap/free)
- OAuth recommended (or API key with auth)
- Longer development time

**When to choose**:
- Production readiness
- Maximum reach
- Long-term support

#### Option 3: Hybrid Approach (Best of Both)

**Implementation**:
```
Phase 1: stdio (2-3 weeks)
├── MVP with npm package
├── Desktop users test
└── Validate functionality

Phase 2: Remote deployment (2-3 weeks)
├── Add SSE/HTTP transport
├── Deploy to Cloudflare Workers
├── OAuth setup (or API key auth)
└── All platforms supported

Phase 3: Maintain both
├── npm package for local use
├── Remote for web/mobile
└── Users choose deployment
```

**Pros**:
- Maximum flexibility
- Fastest path to MVP (stdio first)
- Eventually full platform support
- Risk mitigation (if remote fails, stdio works)

**Cons**:
- More code to maintain
- Two deployment paths
- Testing complexity

### Updated Architecture Recommendation

**Recommended Approach**: **Hybrid (Option 3)**

**Rationale**:
1. Start with stdio for fast MVP (keeps our 3-4 week timeline)
2. Validate with desktop users
3. Gather feedback
4. Add remote deployment for broader reach
5. Both deployment options benefit different users

**Technical Implementation**:

```typescript
// src/index.ts (entry point)
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createServer } from './server.js';

const transport = process.env.MCP_TRANSPORT || 'stdio';

const server = createServer();

if (transport === 'stdio') {
  // Local deployment
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
} else if (transport === 'sse') {
  // Remote deployment
  const port = parseInt(process.env.PORT || '3000');
  const sseTransport = new SSEServerTransport('/mcp', server);
  sseTransport.listen(port);
  console.log(`MCP Server listening on port ${port}`);
}
```

**Deployment**:

```bash
# Local (npm package)
npx -y mcp-exceptionless

# Remote (Cloudflare Worker)
# Automatically detects environment and uses SSE
```

### Updated Tool Strategy

**All 18 tools** still valid (8 Event + 10 Stack)

**No changes needed** - tools work the same regardless of transport

**Additional consideration for remote**:
- Rate limiting (protect hosted server)
- Authentication validation
- CORS headers (if accessed from browser)
- Logging for debugging

### Authentication Strategy Update

**Original Plan**: API key in environment variable

**For stdio**: ✅ Still valid (API key in env)

**For remote**: Two options:

**Option A: API Key with User Input** (Simpler)
```
1. User adds connector in Claude
2. Claude prompts: "Enter Exceptionless API Key"
3. Claude stores encrypted key
4. Sends with each request: Authorization: Bearer {key}
5. Server validates and proxies to Exceptionless
```

**Option B: OAuth 2.1** (More Secure, Complex)
```
1. User adds connector in Claude
2. OAuth flow redirects to Exceptionless login
3. User authorizes access
4. Token issued to Claude
5. Server validates token and accesses Exceptionless API
```

**Recommendation**: Option A (API Key)
- Simpler for users
- Exceptionless already has API keys
- No OAuth provider needed
- Faster implementation

### Updated Timeline

**Phase 1: Local stdio (Weeks 1-3)** - Original plan
- Foundation
- Core tools
- Documentation
- Publish to npm

**Phase 2: Remote deployment (Weeks 4-5)** - New
- Add SSE/HTTP transport
- Deploy to Cloudflare Workers
- Test on Claude web
- Documentation update

**Phase 3: Mobile testing (Week 6)** - New
- Test on iOS (when available)
- Test on Android (when available)
- Optimize for mobile UX

### Cost Analysis

**stdio (npm)**:
- Development: 3-4 weeks
- Hosting: $0
- Maintenance: Low

**Remote (Cloudflare)**:
- Development: +2 weeks
- Hosting: $0-5/month (Free tier covers moderate usage)
- Maintenance: Medium

**Total Updated Timeline**: 5-6 weeks for both deployment options

---

## Summary & Key Takeaways

### What We Learned About MCP

1. **MCP is a standardized protocol** for connecting AI apps to external services
2. **Three primitives**: Tools (actions), Resources (data), Prompts (workflows)
3. **Multiple transports**: stdio (local), SSE/HTTP (remote)
4. **Optional auth**: Authless, Bearer token, or OAuth 2.1
5. **Broad platform support**: Desktop, web, iOS, Android (remote only for last 3)
6. **Rich ecosystem**: SDKs, Inspector, examples, community

### Critical Insights for Our Project

1. **stdio limits us to desktop** - Remote deployment reaches 4x more platforms
2. **Mobile support exists** (July 2025) - We should target this
3. **Cloudflare makes hosting easy** - Low barrier to remote deployment
4. **OAuth is optional** - API key auth is simpler for our use case
5. **Hybrid is viable** - Support both local and remote

### Action Items

1. **Proceed with stdio Phase 1** as planned (3-4 weeks)
2. **Plan for Phase 2 remote deployment** (add 2 weeks)
3. **Design with transport abstraction** (easy to add remote later)
4. **Document both deployment options** in README
5. **Consider Cloudflare Workers** for remote hosting

### Strategic Decision

**Recommended Path**: **Hybrid Deployment (stdio + remote)**

**Justification**:
- Fast MVP with stdio (validate concept)
- Add remote for broader reach
- Maximum platform coverage
- Low hosting cost with Cloudflare
- Better for Exceptionless ecosystem

### Next Steps

1. Continue with stdio implementation (current plan)
2. Design server architecture to support both transports
3. Complete Phase 1 (stdio, npm package)
4. Gather user feedback
5. Implement Phase 2 (remote deployment)
6. Test across all Claude platforms

---

**Last Updated**: 2025-10-16
**Status**: Analysis Complete, Strategy Updated
**Next**: Proceed with Implementation (stdio first, remote second)
