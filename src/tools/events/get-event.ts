import { z } from 'zod';
import { ExceptionlessClient } from '../../api/client.js';
import { ENDPOINTS } from '../../api/endpoints.js';

const GetEventSchema = z.object({
  id: z.string().min(1).describe('Event ID'),
  project_id: z.string().optional().describe('Project ID to scope query (overrides EXCEPTIONLESS_PROJECT_ID if set)')
});

export const getEventTool = {
  name: 'get-event',
  description: 'Get full event details by ID.',
  inputSchema: GetEventSchema,
  handler: async (params: z.infer<typeof GetEventSchema>, client: ExceptionlessClient) => {
    try {
      // Priority: params.project_id > client.projectId > org-wide
      const projectId = params.project_id || client.projectId;
      const endpoint = projectId
        ? ENDPOINTS.PROJECT_EVENT_BY_ID(projectId, params.id)
        : ENDPOINTS.EVENT_BY_ID(params.id);

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
