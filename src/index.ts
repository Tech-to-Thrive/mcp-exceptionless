#!/usr/bin/env node
import { loadConfig } from './config/index.js';
import { runServer } from './server.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    const config = loadConfig();

    if (config.debug) {
      logger.info('Exceptionless MCP Server starting...');
      logger.info(`API URL: ${config.apiUrl}`);
    }

    await runServer(config);
  } catch (error) {
    logger.error({ error }, 'Failed to start Exceptionless MCP Server');
    console.error('Failed to start Exceptionless MCP Server:', error);
    process.exit(1);
  }
}

main();
