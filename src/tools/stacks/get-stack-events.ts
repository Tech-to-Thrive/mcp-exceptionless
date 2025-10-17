import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetStackEventsSchema = z.object({
  stack_id: z.string().min(1).describe('Stack ID'),
  project_id: z.string().optional().describe('Project ID to scope query (overrides EXCEPTIONLESS_PROJECT_ID if set)'),
  filter: z.string().optional().describe('Filter query (e.g. date:>now-7d, is_fixed:false)'),
  sort: z.string().optional().describe('Sort field (e.g. date, -date). Prefix with - for descending'),
  page: z.number().int().min(1).optional().describe('Page number for pagination'),
  limit: z.number().int().min(1).max(100).optional().default(5).describe('Results per page (default: 5, max: 100)'),
  mode: z.enum(['full', 'summary']).optional().default('summary').describe('summary=minimal fields, full=all fields (uses more tokens)')
});

export const getStackEventsTool = {
  name: 'get-stack-events',
  description: 'Get all event occurrences for a stack by stack ID.',
  inputSchema: GetStackEventsSchema,
  handler: async (params: z.infer<typeof GetStackEventsSchema>, client: ExceptionlessClient) => {
    try {
      // Priority: params.project_id > client.projectId > org-wide
      const projectId = params.project_id || client.projectId;
      const { stack_id, project_id, ...queryParams } = params;

      const endpoint = projectId
        ? ENDPOINTS.PROJECT_STACK_EVENTS(projectId, stack_id)
        : ENDPOINTS.STACK_EVENTS(stack_id);

      const result = await client.get(endpoint, queryParams);
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
