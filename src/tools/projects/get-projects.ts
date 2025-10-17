import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetProjectsSchema = z.object({
  filter: z.string().optional().describe('Filter (e.g. name:myproject)'),
  sort: z.string().optional().describe('Sort order (e.g. -name)'),
  mode: z.enum(['full', 'summary']).optional().default('summary'),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(10),
  before: z.string().optional(),
  after: z.string().optional()
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
