import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetSessionsSchema = z.object({
  filter: z.string().optional(),
  sort: z.string().optional(),
  time: z.string().optional(),
  offset: z.string().optional(),
  mode: z.enum(['full', 'summary']).optional().default('summary'),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(5),
  before: z.string().optional(),
  after: z.string().optional()
});

export const getSessionsTool = {
  name: 'get-sessions',
  description: 'List user activity sessions with filtering and pagination.',
  inputSchema: GetSessionsSchema,
  handler: async (params: z.infer<typeof GetSessionsSchema>, client: ExceptionlessClient) => {
    try {
      const result = await client.get(ENDPOINTS.SESSIONS, params);
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
