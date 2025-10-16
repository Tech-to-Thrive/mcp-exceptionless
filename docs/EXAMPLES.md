# Usage Examples

## Basic Queries

### Get Recent Errors
```json
{
  "tool": "get-events",
  "params": {
    "filter": "type:error",
    "time": "last 24 hours",
    "limit": 10
  }
}
```

### Get Production Errors
```json
{
  "tool": "get-events",
  "params": {
    "filter": "type:error AND tag:production",
    "sort": "-date",
    "limit": 5
  }
}
```

### Count Errors by Type
```json
{
  "tool": "count-events",
  "params": {
    "aggregations": "type",
    "time": "last 7 days"
  }
}
```

## Stack Queries

### Get Open Stacks
```json
{
  "tool": "get-stacks",
  "params": {
    "filter": "status:open",
    "sort": "-total_occurrences",
    "limit": 10
  }
}
```

### Get High-Frequency Errors
```json
{
  "tool": "get-stacks",
  "params": {
    "filter": "total_occurrences:>100",
    "sort": "-last_occurrence"
  }
}
```

### Get Stack Details
```json
{
  "tool": "get-stack",
  "params": {
    "id": "stack-id-here"
  }
}
```

## Session Analysis

### List Recent Sessions
```json
{
  "tool": "get-sessions",
  "params": {
    "time": "last 24 hours",
    "limit": 10
  }
}
```

### Get Events in Session
```json
{
  "tool": "get-session-events",
  "params": {
    "session_id": "session-id-here",
    "limit": 20
  }
}
```

## Using Claude Code

In Claude Code, simply ask natural language questions:

- "Show my recent Exceptionless errors"
- "Find all production errors from last week"
- "Get details for stack xyz"
- "Count errors by type for the last 24 hours"
- "Show me high-frequency errors"
