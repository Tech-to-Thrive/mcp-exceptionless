import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetSessionEventsSchema = z.object({
  session_id: z.string().min(1).describe('Session ID'),
  project_id: z.string().optional().describe('Project ID to scope query (overrides EXCEPTIONLESS_PROJECT_ID if set)'),
  filter: z.string().optional().describe('Filter query (e.g. type:error, type:log)'),
  sort: z.string().optional().describe('Sort field (e.g. date, -date). Prefix with - for descending'),
  page: z.number().int().min(1).optional().describe('Page number for pagination'),
  limit: z.number().int().min(1).max(100).optional().default(5).describe('Results per page (default: 5, max: 100)'),
  before: z.string().optional().describe('Cursor for pagination (before this ID)'),
  after: z.string().optional().describe('Cursor for pagination (after this ID)')
});

export const getSessionEventsTool = {
  name: 'get-session-events',
  description: 'Get all events in a session by session ID.',
  inputSchema: GetSessionEventsSchema,
  handler: async (params: z.infer<typeof GetSessionEventsSchema>, client: ExceptionlessClient) => {
    try {
      // Priority: params.project_id > client.projectId > org-wide
      const projectId = params.project_id || client.projectId;
      const { session_id, project_id, ...queryParams } = params;

      const endpoint = projectId
        ? ENDPOINTS.PROJECT_SESSION_BY_ID(projectId, session_id)
        : ENDPOINTS.SESSION_BY_ID(session_id);

      const result = await client.get(endpoint, queryParams);
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
