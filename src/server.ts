import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Config } from './config/index.js';
import { ExceptionlessClient } from './api/client.js';

// Event tools
import { getEventsTool } from './tools/events/get-events.js';
import { getEventTool } from './tools/events/get-event.js';
import { getEventByReferenceTool } from './tools/events/get-event-by-reference.js';
import { countEventsTool } from './tools/events/count-events.js';
import { getSessionsTool } from './tools/events/get-sessions.js';
import { getSessionEventsTool } from './tools/events/get-session-events.js';

// Stack tools
import { getStacksTool } from './tools/stacks/get-stacks.js';
import { getStackTool } from './tools/stacks/get-stack.js';
import { getStackEventsTool } from './tools/stacks/get-stack-events.js';

const tools = [
  getEventsTool,
  getEventTool,
  getEventByReferenceTool,
  countEventsTool,
  getSessionsTool,
  getSessionEventsTool,
  getStacksTool,
  getStackTool,
  getStackEventsTool,
];

export function createServer(config: Config) {
  const server = new Server(
    {
      name: 'mcp-exceptionless',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const client = new ExceptionlessClient(config);

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(tool.inputSchema.shape).map(([key, value]: [string, any]) => [
            key,
            {
              type: value._def.typeName === 'ZodString' ? 'string' :
                    value._def.typeName === 'ZodNumber' ? 'number' :
                    value._def.typeName === 'ZodEnum' ? 'string' : 'string',
              description: value._def.description || '',
              ...(value._def.typeName === 'ZodEnum' && { enum: value._def.values }),
            },
          ])
        ),
        required: Object.entries(tool.inputSchema.shape)
          .filter(([, value]: [string, any]) => !value.isOptional())
          .map(([key]) => key),
      },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find((t) => t.name === request.params.name);
    if (!tool) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }

    const validatedParams = tool.inputSchema.parse(request.params.arguments);
    return await tool.handler(validatedParams as any, client);
  });

  return server;
}

export async function runServer(config: Config) {
  const server = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
