# Troubleshooting Guide

Common issues and solutions for the Exceptionless MCP server.

## Installation Issues

### Missing API Key Error
**Error**: `EXCEPTIONLESS_API_KEY is required`

**Solution**: Set your API key in the environment:
```json
{
  "env": {
    "EXCEPTIONLESS_API_KEY": "your-api-key-here"
  }
}
```

Get your API key from: https://app.exceptionless.io/project/list

### Invalid API Key Error
**Error**: `Authentication failed: Invalid API key`

**Solutions**:
1. Verify your API key is correct (copy-paste from Exceptionless)
2. Ensure you're using a **project** API key, not a user API key
3. Check that your project isn't suspended
4. Try regenerating a new API key

### Module Not Found Error
**Error**: `Cannot find module @modelcontextprotocol/sdk`

**Solution**: Rebuild the project:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Connection Issues

### Cannot Connect to API
**Error**: `Cannot connect to Exceptionless API`

**Solutions**:
1. Check your internet connection
2. Verify the API URL is correct (default: https://api.exceptionless.io)
3. Check if you're behind a corporate firewall
4. Try setting a custom API URL if using self-hosted Exceptionless

### Request Timeout
**Error**: `Request timed out`

**Solutions**:
1. Increase timeout in environment:
```json
{
  "env": {
    "EXCEPTIONLESS_TIMEOUT": "60000"
  }
}
```
2. Check your network speed
3. Try during off-peak hours

### Rate Limit Exceeded
**Error**: `Rate limit exceeded`

**Solution**: Wait for the retry-after period (shown in error message). The server will automatically retry with exponential backoff.

## Query Issues

### No Results Returned
**Problem**: Query returns empty results

**Solutions**:
1. Check your filter syntax is correct
2. Verify the time range includes data
3. Try without filters first to confirm data exists
4. Use `mode=full` to see all fields
5. Increase `limit` to see more results

### Filter Not Working
**Problem**: Filter doesn't return expected results

**Solutions**:
1. Check filter syntax:
   - Use colon: `type:error`
   - Use quotes for phrases: `message:"null reference"`
   - Use AND/OR: `type:error AND tag:production`
2. Verify field names are correct (check docs)
3. Test simpler filters first

## Performance Issues

### Slow Response Times
**Problem**: Queries take too long

**Solutions**:
1. Use `mode=summary` (default) instead of `mode=full`
2. Reduce `limit` value (default is 5)
3. Narrow time ranges
4. Use more specific filters
5. Enable debug logging to see API call times:
```json
{
  "env": {
    "EXCEPTIONLESS_DEBUG": "true"
  }
}
```

### High Token Usage
**Problem**: Using too many tokens

**Solutions**:
1. Use `mode=summary` (default)
2. Keep `limit=5` or lower
3. Request specific fields via filters
4. Avoid requesting full event details unless needed

## Build Issues

### TypeScript Compilation Error
**Error**: TypeScript errors during build

**Solution**:
```bash
npm install typescript@latest --save-dev
npm run build
```

### Missing dist/ Directory
**Problem**: dist/ folder doesn't exist

**Solution**:
```bash
npm run build
```

The build creates the dist/ folder with compiled JavaScript.

## Claude Code Integration Issues

### Tool Not Showing Up
**Problem**: Tools don't appear in Claude Code

**Solutions**:
1. Restart Claude Code
2. Check MCP server configuration in settings
3. Verify the path to index.js is correct
4. Check logs for errors: `EXCEPTIONLESS_DEBUG=true`

### Connection Refused
**Problem**: MCP server won't connect

**Solutions**:
1. Verify the command path is absolute
2. Check that Node.js is in PATH
3. Ensure dist/index.js exists
4. Try running manually: `node dist/index.js`

## Debug Mode

Enable detailed logging:

```json
{
  "env": {
    "EXCEPTIONLESS_DEBUG": "true"
  }
}
```

This will show:
- API requests and responses
- Error details
- Timing information

## Getting Help

If you continue to have issues:

1. Check the [GitHub Issues](https://github.com/Tech-to-Thrive/mcp-exceptionless/issues)
2. Search existing issues for similar problems
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment (OS, Node version)
   - Debug logs (with API key redacted)

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `AUTH_INVALID_KEY` | Invalid API key | Check API key |
| `AUTH_FORBIDDEN` | Insufficient permissions | Check API key permissions |
| `NOT_FOUND` | Resource not found | Verify ID is correct |
| `BAD_REQUEST` | Invalid parameters | Check parameter format |
| `RATE_LIMIT` | Too many requests | Wait and retry |
| `ORG_SUSPENDED` | Organization suspended | Check billing |
| `NETWORK_ERROR` | Connection failed | Check internet |
