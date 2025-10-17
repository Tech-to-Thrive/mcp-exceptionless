import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetProjectsSchema = z.object({
  filter: z.string().optional().describe('Filter query (e.g. name:myproject, organization_id:abc123)'),
  sort: z.string().optional().describe('Sort field (e.g. name, -name). Prefix with - for descending'),
  mode: z.enum(['full', 'summary']).optional().default('summary').describe('summary=minimal fields, full=all fields (uses more tokens)'),
  page: z.number().int().min(1).optional().describe('Page number for pagination'),
  limit: z.number().int().min(1).max(100).optional().default(10).describe('Results per page (default: 10, max: 100)'),
  before: z.string().optional().describe('Cursor for pagination (before this ID)'),
  after: z.string().optional().describe('Cursor for pagination (after this ID)')
});

export const getProjectsTool = {
  name: 'get-projects',
  description: 'List all projects with optional filtering and pagination. Use this to discover available projects for filtering queries.',
  inputSchema: GetProjectsSchema,
  handler: async (params: z.infer<typeof GetProjectsSchema>, client: ExceptionlessClient) => {
    try {
      const result = await client.get(ENDPOINTS.PROJECTS, params);
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
