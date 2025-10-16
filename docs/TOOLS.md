# Tool Reference

Complete reference for all 9 read-only tools in the Exceptionless MCP server.

## Event Tools (6)

### get-events
Query events with filtering, sorting, and pagination.

**Parameters**:
- `filter` (optional): Filter query (e.g. "type:error", "tag:production")
- `sort` (optional): Sort order (e.g. "-date")
- `time` (optional): Time range (e.g. "last 7 days")
- `mode` (optional): "summary" or "full" (default: summary)
- `limit` (optional): Results per page (default: 5, max: 100)
- `page`, `before`, `after`: Pagination options

**Example**:
```json
{
  "filter": "type:error AND tag:production",
  "time": "last 7 days",
  "limit": 10
}
```

### get-event
Get full event details by ID.

**Parameters**:
- `id` (required): Event ID

### get-event-by-reference
Get event by external reference/correlation ID.

**Parameters**:
- `reference_id` (required): External reference ID

### count-events
Count events with optional aggregations.

**Parameters**:
- `filter` (optional): Filter query
- `time` (optional): Time range
- `aggregations` (optional): Comma-separated (e.g. "date:1h,type")

### get-sessions
List user activity sessions.

**Parameters**:
- `filter`, `sort`, `time`, `mode`, `limit`, `page`: Same as get-events

### get-session-events
Get all events in a session.

**Parameters**:
- `session_id` (required): Session ID
- `filter`, `sort`, `limit`, `page`: Optional filtering/pagination

## Stack Tools (3)

### get-stacks
List and search error stacks (grouped errors).

**Parameters**:
- `filter` (optional): Filter (e.g. "status:open", "total_occurrences:>100")
- `sort` (optional): Sort (e.g. "-total_occurrences")
- `mode` (optional): "summary" or "full" (default: summary)
- `limit` (optional): Results per page (default: 5, max: 100)
- Other pagination options

### get-stack
Get full stack details by ID.

**Parameters**:
- `id` (required): Stack ID

### get-stack-events
Get all event occurrences for a stack.

**Parameters**:
- `stack_id` (required): Stack ID
- `filter`, `sort`, `limit`, `mode`: Optional filtering/pagination

## Filter Syntax

Common filter patterns:

- `type:error` - Filter by type
- `tag:production` - Filter by tag
- `date:>now-7d` - Date range
- `status:open` - Stack status
- `total_occurrences:>100` - Numeric comparison
- `type:error AND tag:api` - Combine filters
- `(type:error OR type:log) AND tag:prod` - Complex queries

## Response Format

All tools return JSON. Use `mode=summary` (default) for minimal data or `mode=full` for complete details.
