import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetStacksSchema = z.object({
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
      const endpoint = client.projectId
        ? ENDPOINTS.PROJECT_STACKS(client.projectId)
        : ENDPOINTS.STACKS;

      const result = await client.get(endpoint, params);
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
