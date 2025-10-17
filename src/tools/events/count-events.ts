import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const CountEventsSchema = z.object({
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
      const endpoint = client.projectId
        ? ENDPOINTS.PROJECT_EVENT_COUNT(client.projectId)
        : ENDPOINTS.EVENT_COUNT;

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
