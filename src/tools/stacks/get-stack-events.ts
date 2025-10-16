import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetStackEventsSchema = z.object({
  stack_id: z.string().min(1).describe('Stack ID'),
  filter: z.string().optional(),
  sort: z.string().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(5),
  mode: z.enum(['full', 'summary']).optional().default('summary')
});

export const getStackEventsTool = {
  name: 'get-stack-events',
  description: 'Get all event occurrences for a stack by stack ID.',
  inputSchema: GetStackEventsSchema,
  handler: async (params: z.infer<typeof GetStackEventsSchema>, client: ExceptionlessClient) => {
    try {
      const { stack_id, ...queryParams } = params;
      const result = await client.get(ENDPOINTS.STACK_EVENTS(stack_id), queryParams);
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
