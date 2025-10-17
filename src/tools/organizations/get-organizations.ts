import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetOrganizationsSchema = z.object({
  filter: z.string().optional().describe('Filter (e.g. name:myorg)'),
  sort: z.string().optional().describe('Sort order (e.g. -name)'),
  mode: z.enum(['full', 'summary']).optional().default('summary'),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional().default(10),
  before: z.string().optional(),
  after: z.string().optional()
});

export const getOrganizationsTool = {
  name: 'get-organizations',
  description: 'List all organizations with optional filtering and pagination.',
  inputSchema: GetOrganizationsSchema,
  handler: async (params: z.infer<typeof GetOrganizationsSchema>, client: ExceptionlessClient) => {
    try {
      const result = await client.get(ENDPOINTS.ORGANIZATIONS, params);
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
