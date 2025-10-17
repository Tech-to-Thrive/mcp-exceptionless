import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const CountEventsSchema = z.object({
  project_id: z.string().optional().describe('Project ID to filter events (overrides EXCEPTIONLESS_PROJECT_ID if set)'),
  filter: z.string().optional(),
  time: z.string().optional(),
  offset: z.string().optional(),
  aggregations: z.string().optional().describe('Comma-separated (e.g. date:1h,type)')
});

export const countEventsTool = {
  name: 'count-events',
  description: 'Count events with optional aggregations (date:1h, type, tag, etc).',
  inputSchema: CountEventsSchema,
  handler: async (params: z.infer<typeof CountEventsSchema>, client: ExceptionlessClient) => {
    try {
      // Priority: params.project_id > client.projectId > org-wide
      const projectId = params.project_id || client.projectId;
      const endpoint = projectId
        ? ENDPOINTS.PROJECT_EVENT_COUNT(projectId)
        : ENDPOINTS.EVENT_COUNT;

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
