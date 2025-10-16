# Contributing to Exceptionless MCP Server

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful and inclusive. We welcome contributions from everyone.

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Git
- Exceptionless API key for testing

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/mcp-exceptionless.git
cd mcp-exceptionless
```

3. Install dependencies:
```bash
npm install
```

4. Create `.env` file:
```bash
cp .env.example .env
# Add your EXCEPTIONLESS_API_KEY
```

5. Build the project:
```bash
npm run build
```

6. Run in development mode:
```bash
npm run dev
```

## Development Workflow

### Making Changes

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following the code style
3. Build and test:
```bash
npm run build
npm test
```

4. Commit with a clear message:
```bash
git commit -m "feat: add new feature description"
```

### Commit Message Format

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style (formatting, etc)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Example:
```
feat: add pagination support to get-events tool

- Added page parameter to schema
- Updated handler to pass page to API
- Added tests for pagination
```

## Code Style

### TypeScript
- Use TypeScript strict mode
- Define types for all parameters and return values
- Use Zod schemas for validation
- Follow existing code patterns

### Formatting
- Run Prettier before committing:
```bash
npm run format
```

- Run ESLint:
```bash
npm run lint
```

### File Structure
```
src/
├── api/              # API client and utilities
├── config/           # Configuration
├── tools/            # Tool implementations
│   ├── events/      # Event-related tools
│   └── stacks/      # Stack-related tools
├── utils/           # Shared utilities
├── server.ts        # MCP server setup
└── index.ts         # Entry point
```

## Adding New Tools

To add a new read-only tool:

1. Create tool file in appropriate directory:
```typescript
// src/tools/events/your-tool.ts
import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const YourToolSchema = z.object({
  param: z.string().describe('Parameter description')
});

export const yourTool = {
  name: 'your-tool-name',
  description: 'Brief description of what this tool does.',
  inputSchema: YourToolSchema,
  handler: async (params: z.infer<typeof YourToolSchema>, client: ExceptionlessClient) => {
    try {
      const result = await client.get(ENDPOINTS.YOUR_ENDPOINT, params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(error) }],
        isError: true
      };
    }
  }
};
```

2. Register in `src/server.ts`:
```typescript
import { yourTool } from './tools/events/your-tool.js';

const tools = [
  // ... existing tools
  yourTool,
];
```

3. Add documentation to `docs/TOOLS.md`
4. Add examples to `docs/EXAMPLES.md`
5. Add tests to `tests/`

## Testing

### Writing Tests

Use Vitest for testing:

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from '../src/your-module.js';

describe('Your Module', () => {
  it('should do something', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Documentation

### Updating Documentation

- Update `docs/TOOLS.md` for tool changes
- Update `docs/EXAMPLES.md` for new usage patterns
- Update `README.md` for major changes
- Update `CHANGELOG.md` for all changes

### Documentation Style

- Be concise
- Provide examples
- Include parameter types
- Explain error cases

## Pull Request Process

1. Update documentation
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Create pull request with clear description

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring

## Testing
- [ ] Tests pass locally
- [ ] New tests added
- [ ] Manual testing completed

## Documentation
- [ ] README updated
- [ ] Tool docs updated
- [ ] Examples added
```

## Important Constraints

### Read-Only Operations
This is a **read-only** MCP server. Do not add tools that:
- Create, update, or delete data
- Modify stack status
- Change configuration
- Submit events

Only add tools that **query** existing data.

### Token Optimization
All new tools must:
- Default to `mode=summary` for lists
- Default to `limit=5` or less
- Return compact JSON (no verbose wrappers)
- Avoid unnecessary API calls

## Review Process

1. Maintainer reviews PR
2. Feedback addressed
3. Tests must pass
4. Documentation complete
5. PR approved and merged

## Release Process

Releases are handled by maintainers:
1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag: `git tag v1.x.x`
4. Push tag: `git push origin v1.x.x`
5. GitHub Actions publishes to npm

## Questions?

- Check existing issues
- Create new issue for questions
- Be patient and respectful

Thank you for contributing! 🎉
