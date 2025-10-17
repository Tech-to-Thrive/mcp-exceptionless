import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetOrganizationsSchema = z.object({
  filter: z.string().optional().describe('Filter query (e.g. name:myorg, plan_id:EX_XL)'),
  sort: z.string().optional().describe('Sort field (e.g. name, -name). Prefix with - for descending'),
  mode: z.enum(['full', 'summary']).optional().default('summary').describe('summary=minimal fields, full=all fields (uses more tokens)'),
  page: z.number().int().min(1).optional().describe('Page number for pagination'),
  limit: z.number().int().min(1).max(100).optional().default(10).describe('Results per page (default: 10, max: 100)'),
  before: z.string().optional().describe('Cursor for pagination (before this ID)'),
  after: z.string().optional().describe('Cursor for pagination (after this ID)')
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
