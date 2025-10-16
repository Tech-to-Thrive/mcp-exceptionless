import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetStackSchema = z.object({
  id: z.string().min(1).describe('Stack ID')
});

export const getStackTool = {
  name: 'get-stack',
  description: 'Get full stack details by ID.',
  inputSchema: GetStackSchema,
  handler: async (params: z.infer<typeof GetStackSchema>, client: ExceptionlessClient) => {
    try {
      const result = await client.get(ENDPOINTS.STACK_BY_ID(params.id));
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
