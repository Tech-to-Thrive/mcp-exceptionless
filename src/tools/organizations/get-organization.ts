import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetOrganizationSchema = z.object({
  id: z.string().describe('Organization ID')
});

export const getOrganizationTool = {
  name: 'get-organization',
  description: 'Get detailed information about a specific organization by ID.',
  inputSchema: GetOrganizationSchema,
  handler: async (params: z.infer<typeof GetOrganizationSchema>, client: ExceptionlessClient) => {
    try {
      const result = await client.get(ENDPOINTS.ORGANIZATION_BY_ID(params.id));
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
