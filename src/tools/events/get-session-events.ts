import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetSessionEventsSchema = z.object({
  session_id: z.string().min(1).describe('Session ID'),
  filter: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(5),
  before: z.string().optional(),
  after: z.string().optional()
});

export const getSessionEventsTool = {
  name: 'get-session-events',
  description: 'Get all events in a session by session ID.',
  inputSchema: GetSessionEventsSchema,
  handler: async (params: z.infer<typeof GetSessionEventsSchema>, client: ExceptionlessClient) => {
    try {
      const { session_id, ...queryParams } = params;
      const result = await client.get(ENDPOINTS.SESSION_BY_ID(session_id), queryParams);
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
