import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read configuration from .claude.json
function getConfiguredApiKey() {
  try {
    const claudeJsonPath = join(process.env.USERPROFILE || process.env.HOME, '.claude.json');
    const claudeJson = JSON.parse(readFileSync(claudeJsonPath, 'utf-8'));

    const projectPath = __dirname;
    const projectConfig = claudeJson.projects?.[projectPath];

    if (!projectConfig?.mcpServers?.exceptionless?.env?.EXCEPTIONLESS_API_KEY) {
      throw new Error('Exceptionless API key not found in .claude.json configuration');
    }

    const apiKey = projectConfig.mcpServers.exceptionless.env.EXCEPTIONLESS_API_KEY;
    console.log('📋 Using API key from .claude.json configuration');
    console.log(`   Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}\n`);

    return apiKey;
  } catch (error) {
    console.error('❌ Failed to read configuration:', error.message);
    console.error('   Make sure the MCP server is configured in .claude.json\n');
    throw error;
  }
}

class MCPTester {
  constructor() {
    this.messageId = 0;
    this.responses = new Map();
    this.testResults = [];
    this.apiKey = getConfiguredApiKey();
  }

  async startServer() {
    console.log('🚀 Starting Exceptionless MCP Server with configured settings...\n');

    this.server = spawn('node', ['dist/index.js'], {
      env: {
        ...process.env,
        EXCEPTIONLESS_API_KEY: this.apiKey,
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.server.stderr.on('data', (data) => {
      const stderr = data.toString();
      if (!stderr.includes('"level":50')) { // Ignore error level logs
        console.log('📋 Server log:', stderr);
      }
    });

    const rl = createInterface({
      input: this.server.stdout,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          if (response.id !== undefined) {
            const resolver = this.responses.get(response.id);
            if (resolver) {
              resolver(response);
              this.responses.delete(response.id);
            }
          }
        } catch (e) {
          console.error('❌ Failed to parse response:', line);
        }
      }
    });

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async sendRequest(method, params = {}) {
    const id = ++this.messageId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.responses.set(id, resolve);
      this.server.stdin.write(JSON.stringify(request) + '\n');

      setTimeout(() => {
        if (this.responses.has(id)) {
          this.responses.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  async initialize() {
    console.log('🔧 Initializing MCP connection...\n');
    const response = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'mcp-tester',
        version: '1.0.0'
      }
    });
    console.log('✅ Initialized:', JSON.stringify(response.result, null, 2), '\n');

    await this.sendRequest('initialized');
    return response;
  }

  async listTools() {
    console.log('📋 Listing available tools...\n');
    const response = await this.sendRequest('tools/list');
    const tools = response.result.tools;
    console.log(`✅ Found ${tools.length} tools:\n`);
    tools.forEach(tool => {
      console.log(`  • ${tool.name}: ${tool.description}`);
    });
    console.log('\n');
    return tools;
  }

  async callTool(name, args = {}) {
    console.log(`🔧 Testing: ${name}`);
    console.log(`   Args: ${JSON.stringify(args)}`);

    const startTime = Date.now();
    try {
      const response = await this.sendRequest('tools/call', {
        name,
        arguments: args
      });
      const duration = Date.now() - startTime;

      if (response.error) {
        console.log(`   ❌ Error: ${response.error.message}\n`);
        return {
          tool: name,
          args,
          success: false,
          error: response.error,
          duration
        };
      }

      const content = response.result?.content?.[0]?.text;
      let data;
      try {
        data = JSON.parse(content);
      } catch {
        data = content;
      }

      const isError = response.result?.isError === true;

      if (isError) {
        console.log(`   ❌ Tool returned error: ${data.message || 'Unknown error'}`);
        console.log(`   Duration: ${duration}ms\n`);
        return {
          tool: name,
          args,
          success: false,
          error: data,
          duration
        };
      }

      console.log(`   ✅ Success (${duration}ms)`);
      console.log(`   Response: ${JSON.stringify(data).substring(0, 200)}${JSON.stringify(data).length > 200 ? '...' : ''}\n`);

      return {
        tool: name,
        args,
        success: true,
        data,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`   ❌ Exception: ${error.message}\n`);
      return {
        tool: name,
        args,
        success: false,
        error: error.message,
        duration
      };
    }
  }

  async runTests() {
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('           EXCEPTIONLESS MCP SERVER TEST SUITE\n');
    console.log('═══════════════════════════════════════════════════════════\n\n');

    // Test 1: get-events (basic)
    console.log('━━━ TEST GROUP 1: EVENT QUERY TOOLS ━━━\n');
    this.testResults.push(await this.callTool('get-events', { limit: 3, mode: 'summary' }));

    // Test 2: get-events with filter
    this.testResults.push(await this.callTool('get-events', {
      filter: 'type:error',
      limit: 5,
      mode: 'full'
    }));

    // Test 3: get-events with time range
    this.testResults.push(await this.callTool('get-events', {
      time: 'last 24 hours',
      limit: 10,
      mode: 'summary'
    }));

    // Test 4: get-events with sort
    this.testResults.push(await this.callTool('get-events', {
      sort: '-date',
      limit: 5
    }));

    // Test 5: count-events
    console.log('━━━ TEST GROUP 2: EVENT COUNTING ━━━\n');
    this.testResults.push(await this.callTool('count-events', {}));

    // Test 6: count-events with aggregations
    this.testResults.push(await this.callTool('count-events', {
      aggregations: 'date:1h,type'
    }));

    // Test 7: count-events with filter
    this.testResults.push(await this.callTool('count-events', {
      filter: 'type:error',
      time: 'last 7 days'
    }));

    // Test 8: get-sessions
    console.log('━━━ TEST GROUP 3: SESSION TOOLS ━━━\n');
    this.testResults.push(await this.callTool('get-sessions', { limit: 5 }));

    // Test 9: get-sessions with filter
    this.testResults.push(await this.callTool('get-sessions', {
      filter: 'type:session',
      mode: 'full',
      limit: 3
    }));

    // Test 10: get-stacks
    console.log('━━━ TEST GROUP 4: STACK TOOLS ━━━\n');
    this.testResults.push(await this.callTool('get-stacks', { limit: 5, mode: 'summary' }));

    // Test 11: get-stacks with filter
    this.testResults.push(await this.callTool('get-stacks', {
      filter: 'status:open',
      sort: '-total_occurrences',
      limit: 10
    }));

    // Test 12: get-stacks with mode full
    this.testResults.push(await this.callTool('get-stacks', {
      mode: 'full',
      limit: 3
    }));

    // Now get real data to test ID-based tools
    console.log('━━━ TEST GROUP 5: ID-BASED QUERIES ━━━\n');

    // Get an event ID to test with
    const eventsResult = this.testResults.find(r => r.tool === 'get-events' && r.success && r.data);
    if (eventsResult && eventsResult.data) {
      let eventId;
      if (Array.isArray(eventsResult.data)) {
        eventId = eventsResult.data[0]?.id;
      } else if (eventsResult.data.data && Array.isArray(eventsResult.data.data)) {
        eventId = eventsResult.data.data[0]?.id;
      }

      if (eventId) {
        console.log(`   Using event ID: ${eventId}\n`);
        this.testResults.push(await this.callTool('get-event', { id: eventId }));
      } else {
        console.log('   ⚠️  No event ID found, skipping get-event test\n');
        this.testResults.push({
          tool: 'get-event',
          args: {},
          success: false,
          error: 'No event ID available',
          duration: 0
        });
      }
    }

    // Get a stack ID to test with
    const stacksResult = this.testResults.find(r => r.tool === 'get-stacks' && r.success && r.data);
    if (stacksResult && stacksResult.data) {
      let stackId;
      if (Array.isArray(stacksResult.data)) {
        stackId = stacksResult.data[0]?.id;
      } else if (stacksResult.data.data && Array.isArray(stacksResult.data.data)) {
        stackId = stacksResult.data.data[0]?.id;
      }

      if (stackId) {
        console.log(`   Using stack ID: ${stackId}\n`);
        this.testResults.push(await this.callTool('get-stack', { id: stackId }));
        this.testResults.push(await this.callTool('get-stack-events', {
          stack_id: stackId,
          limit: 5
        }));
      } else {
        console.log('   ⚠️  No stack ID found, skipping get-stack tests\n');
        this.testResults.push({
          tool: 'get-stack',
          args: {},
          success: false,
          error: 'No stack ID available',
          duration: 0
        });
        this.testResults.push({
          tool: 'get-stack-events',
          args: {},
          success: false,
          error: 'No stack ID available',
          duration: 0
        });
      }
    }

    // Test 13: get-event-by-reference (will likely fail without valid reference)
    this.testResults.push(await this.callTool('get-event-by-reference', {
      reference_id: 'test-ref-123'
    }));

    // Get a session ID if available
    const sessionsResult = this.testResults.find(r => r.tool === 'get-sessions' && r.success && r.data);
    if (sessionsResult && sessionsResult.data) {
      let sessionId;
      if (Array.isArray(sessionsResult.data)) {
        sessionId = sessionsResult.data[0]?.id;
      } else if (sessionsResult.data.data && Array.isArray(sessionsResult.data.data)) {
        sessionId = sessionsResult.data.data[0]?.id;
      }

      if (sessionId) {
        console.log(`   Using session ID: ${sessionId}\n`);
        this.testResults.push(await this.callTool('get-session-events', {
          session_id: sessionId,
          limit: 5
        }));
      } else {
        console.log('   ⚠️  No session ID found, skipping get-session-events test\n');
        this.testResults.push({
          tool: 'get-session-events',
          args: {},
          success: false,
          error: 'No session ID available',
          duration: 0
        });
      }
    }

    // Edge cases and error handling
    console.log('━━━ TEST GROUP 6: ERROR HANDLING & EDGE CASES ━━━\n');

    // Invalid ID
    this.testResults.push(await this.callTool('get-event', { id: 'invalid-id-123' }));

    // Invalid filter syntax
    this.testResults.push(await this.callTool('get-events', {
      filter: 'invalid:::syntax',
      limit: 1
    }));

    // Extreme pagination
    this.testResults.push(await this.callTool('get-events', {
      limit: 100,
      page: 1
    }));

    // Empty results scenario
    this.testResults.push(await this.callTool('get-events', {
      filter: 'type:nonexistent_type_xyz',
      limit: 1
    }));
  }

  generateReport() {
    console.log('\n\n═══════════════════════════════════════════════════════════\n');
    console.log('                    TEST SUMMARY REPORT\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    const total = this.testResults.length;
    const successful = this.testResults.filter(r => r.success).length;
    const failed = total - successful;
    const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / total;

    console.log(`Total Tests:     ${total}`);
    console.log(`✅ Successful:    ${successful} (${(successful/total*100).toFixed(1)}%)`);
    console.log(`❌ Failed:        ${failed} (${(failed/total*100).toFixed(1)}%)`);
    console.log(`⏱️  Avg Duration:  ${avgDuration.toFixed(0)}ms\n`);

    // Group by tool
    const byTool = {};
    this.testResults.forEach(r => {
      if (!byTool[r.tool]) {
        byTool[r.tool] = { total: 0, success: 0, failed: 0 };
      }
      byTool[r.tool].total++;
      if (r.success) {
        byTool[r.tool].success++;
      } else {
        byTool[r.tool].failed++;
      }
    });

    console.log('Results by Tool:\n');
    Object.entries(byTool).forEach(([tool, stats]) => {
      const status = stats.failed === 0 ? '✅' : stats.success > 0 ? '⚠️' : '❌';
      console.log(`  ${status} ${tool.padEnd(25)} ${stats.success}/${stats.total} passed`);
    });

    console.log('\n');

    // List failed tests with details
    const failedTests = this.testResults.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log('Failed Tests Details:\n');
      failedTests.forEach((test, idx) => {
        console.log(`  ${idx + 1}. ${test.tool}`);
        console.log(`     Args: ${JSON.stringify(test.args)}`);
        console.log(`     Error: ${JSON.stringify(test.error).substring(0, 150)}`);
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════════════════════\n');
  }

  async cleanup() {
    console.log('🧹 Cleaning up...\n');
    if (this.server) {
      this.server.kill();
    }
  }

  async run() {
    try {
      await this.startServer();
      await this.initialize();
      await this.listTools();
      await this.runTests();
      this.generateReport();
    } catch (error) {
      console.error('💥 Fatal error:', error);
    } finally {
      await this.cleanup();
      process.exit(0);
    }
  }
}

const tester = new MCPTester();
tester.run();
