import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetProjectSchema = z.object({
  id: z.string().describe('Project ID')
});

export const getProjectTool = {
  name: 'get-project',
  description: 'Get detailed information about a specific project by ID.',
  inputSchema: GetProjectSchema,
  handler: async (params: z.infer<typeof GetProjectSchema>, client: ExceptionlessClient) => {
    try {
      const result = await client.get(ENDPOINTS.PROJECT_BY_ID(params.id));
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
