import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetEventByReferenceSchema = z.object({
  reference_id: z.string().min(1).describe('External reference ID')
});

export const getEventByReferenceTool = {
  name: 'get-event-by-reference',
  description: 'Get event by external reference/correlation ID.',
  inputSchema: GetEventByReferenceSchema,
  handler: async (params: z.infer<typeof GetEventByReferenceSchema>, client: ExceptionlessClient) => {
    try {
      const result = await client.get(ENDPOINTS.EVENT_BY_REF(params.reference_id));
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
