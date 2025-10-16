import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetEventSchema = z.object({
  id: z.string().min(1).describe('Event ID')
});

export const getEventTool = {
  name: 'get-event',
  description: 'Get full event details by ID.',
  inputSchema: GetEventSchema,
  handler: async (params: z.infer<typeof GetEventSchema>, client: ExceptionlessClient) => {
    try {
      const result = await client.get(ENDPOINTS.EVENT_BY_ID(params.id));
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
