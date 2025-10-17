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
      const endpoint = client.projectId
        ? ENDPOINTS.PROJECT_EVENT_BY_REF(client.projectId, params.reference_id)
        : ENDPOINTS.EVENT_BY_REF(params.reference_id);

      const result = await client.get(endpoint);
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
