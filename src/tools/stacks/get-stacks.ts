import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetStacksSchema = z.object({
  project_id: z.string().optional().describe('Project ID to filter stacks (overrides EXCEPTIONLESS_PROJECT_ID if set)'),
  filter: z.string().optional().describe('Filter (e.g. status:open, total_occurrences:>100)'),
  sort: z.string().optional().describe('Sort (e.g. -total_occurrences)'),
  time: z.string().optional(),
  offset: z.string().optional(),
  mode: z.enum(['full', 'summary']).optional().default('summary'),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(5),
  before: z.string().optional(),
  after: z.string().optional()
});

export const getStacksTool = {
  name: 'get-stacks',
  description: 'List and search error stacks (grouped errors) with filtering and sorting.',
  inputSchema: GetStacksSchema,
  handler: async (params: z.infer<typeof GetStacksSchema>, client: ExceptionlessClient) => {
    try {
      // Priority: params.project_id > client.projectId > org-wide
      const projectId = params.project_id || client.projectId;
      const endpoint = projectId
        ? ENDPOINTS.PROJECT_STACKS(projectId)
        : ENDPOINTS.STACKS;

      // Remove project_id from params before sending to API
      const { project_id, ...apiParams } = params;

      const result = await client.get(endpoint, apiParams);
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
