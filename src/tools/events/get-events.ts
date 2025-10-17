import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetEventsSchema = z.object({
  project_id: z.string().optional().describe('Project ID to filter events (overrides EXCEPTIONLESS_PROJECT_ID if set)'),
  filter: z.string().optional().describe('Filter query (e.g. type:error, tag:prod, is_fixed:false, date:>now-7d)'),
  sort: z.string().optional().describe('Sort field (e.g. date, -date). Prefix with - for descending'),
  time: z.string().optional().describe('Time range (e.g. last hour, last 7 days, last week)'),
  offset: z.string().optional().describe('Timezone offset in minutes'),
  mode: z.enum(['full', 'summary']).optional().default('summary').describe('summary=minimal fields, full=all fields (uses more tokens)'),
  page: z.number().int().min(1).optional().describe('Page number for pagination'),
  limit: z.number().int().min(1).max(100).optional().default(5).describe('Results per page (default: 5, max: 100)'),
  before: z.string().optional().describe('Cursor for pagination (before this ID)'),
  after: z.string().optional().describe('Cursor for pagination (after this ID)')
});

export const getEventsTool = {
  name: 'get-events',
  description: 'Query events with filtering, sorting, and pagination. Supports filter syntax (type:error, tag:prod, date:>now-7d), time ranges, and mode (summary/full).',
  inputSchema: GetEventsSchema,
  handler: async (params: z.infer<typeof GetEventsSchema>, client: ExceptionlessClient) => {
    try {
      // Priority: params.project_id > client.projectId > org-wide
      const projectId = params.project_id || client.projectId;
      const endpoint = projectId
        ? ENDPOINTS.PROJECT_EVENTS(projectId)
        : ENDPOINTS.EVENTS;

      // Remove project_id from params before sending to API
      const { project_id, ...apiParams } = params;

      const result = await client.get(endpoint, apiParams);
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
