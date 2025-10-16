import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetEventsSchema = z.object({
  filter: z.string().optional().describe('Filter (e.g. type:error, tag:production)'),
  sort: z.string().optional().describe('Sort order (e.g. -date)'),
  time: z.string().optional().describe('Time range (e.g. last 7 days)'),
  offset: z.string().optional().describe('Timezone offset (minutes)'),
  mode: z.enum(['full', 'summary']).optional().default('summary'),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(5),
  before: z.string().optional(),
  after: z.string().optional()
});

export const getEventsTool = {
  name: 'get-events',
  description: 'Query events with filtering, sorting, and pagination. Supports filter syntax (type:error, tag:prod, date:>now-7d), time ranges, and mode (summary/full).',
  inputSchema: GetEventsSchema,
  handler: async (params: z.infer<typeof GetEventsSchema>, client: ExceptionlessClient) => {
    try {
      const result = await client.get(ENDPOINTS.EVENTS, params);
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
