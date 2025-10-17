import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read configuration
function getConfiguration() {
  const claudeJsonPath = join(process.env.USERPROFILE || process.env.HOME, '.claude.json');
  const claudeJson = JSON.parse(readFileSync(claudeJsonPath, 'utf-8'));
  const projectPath = __dirname;
  const projectConfig = claudeJson.projects?.[projectPath];
  const apiKey = projectConfig.mcpServers.exceptionless.env.EXCEPTIONLESS_API_KEY;
  const projectId = projectConfig.mcpServers.exceptionless.env.EXCEPTIONLESS_PROJECT_ID;

  console.log('📋 Production Test Configuration');
  console.log(`   API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  if (projectId) {
    console.log(`   Project ID: ${projectId}`);
  } else {
    console.log('   Scope: Organization-wide');
  }
  console.log('\n');

  return { apiKey, projectId };
}

class ProductionTester {
  constructor() {
    this.messageId = 0;
    this.responses = new Map();
    this.testResults = [];
    const config = getConfiguration();
    this.apiKey = config.apiKey;
    this.projectId = config.projectId;
  }

  async startServer() {
    console.log('🚀 Starting MCP Server...\n');

    const env = { ...process.env, EXCEPTIONLESS_API_KEY: this.apiKey };
    if (this.projectId) env.EXCEPTIONLESS_PROJECT_ID = this.projectId;

    this.server = spawn('node', ['dist/index.js'], { env, stdio: ['pipe', 'pipe', 'pipe'] });

    this.server.stderr.on('data', (data) => {
      const stderr = data.toString();
      if (!stderr.includes('"level":50')) {
        console.log('📋 Server:', stderr);
      }
    });

    const rl = createInterface({ input: this.server.stdout, crlfDelay: Infinity });

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
          // Ignore parse errors
        }
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async sendRequest(method, params = {}) {
    const id = ++this.messageId;
    const request = { jsonrpc: '2.0', id, method, params };

    return new Promise((resolve, reject) => {
      this.responses.set(id, resolve);
      this.server.stdin.write(JSON.stringify(request) + '\n');
      setTimeout(() => {
        if (this.responses.has(id)) {
          this.responses.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 15000);
    });
  }

  async initialize() {
    const response = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'production-tester', version: '1.0.0' }
    });
    await this.sendRequest('initialized');
    return response;
  }

  async callTool(name, args = {}) {
    const startTime = Date.now();
    try {
      const response = await this.sendRequest('tools/call', { name, arguments: args });
      const duration = Date.now() - startTime;

      if (response.error) {
        return { tool: name, args, success: false, error: response.error, duration };
      }

      const content = response.result?.content?.[0]?.text;
      let data;
      try {
        data = JSON.parse(content);
      } catch {
        data = content;
      }

      const isError = response.result?.isError === true;

      return {
        tool: name,
        args,
        success: !isError,
        data: isError ? null : data,
        error: isError ? data : null,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return { tool: name, args, success: false, error: error.message, duration };
    }
  }

  async runProductionTests() {
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('         COMPREHENSIVE PRODUCTION TEST SUITE\n');
    console.log('═══════════════════════════════════════════════════════════\n\n');

    // GROUP 1: get-events - Test all parameters
    console.log('━━━ GET-EVENTS: Complete Parameter Testing ━━━\n');

    // Basic queries
    this.testResults.push(await this.callTool('get-events', {})); // Defaults
    this.testResults.push(await this.callTool('get-events', { limit: 10 }));
    this.testResults.push(await this.callTool('get-events', { limit: 1, mode: 'full' }));
    this.testResults.push(await this.callTool('get-events', { limit: 1, mode: 'summary' }));

    // Filtering
    this.testResults.push(await this.callTool('get-events', { filter: 'type:error', limit: 5 }));
    this.testResults.push(await this.callTool('get-events', { filter: 'type:log', limit: 5 }));
    this.testResults.push(await this.callTool('get-events', { filter: 'type:session', limit: 5 }));

    // Time ranges
    this.testResults.push(await this.callTool('get-events', { time: 'last hour', limit: 5 }));
    this.testResults.push(await this.callTool('get-events', { time: 'last 24 hours', limit: 5 }));
    this.testResults.push(await this.callTool('get-events', { time: 'last 7 days', limit: 3 }));

    // Sorting
    this.testResults.push(await this.callTool('get-events', { sort: 'date', limit: 3 }));
    this.testResults.push(await this.callTool('get-events', { sort: '-date', limit: 3 }));

    // Pagination
    this.testResults.push(await this.callTool('get-events', { page: 1, limit: 5 }));
    this.testResults.push(await this.callTool('get-events', { page: 2, limit: 5 }));

    // Combined parameters
    this.testResults.push(await this.callTool('get-events', {
      filter: 'type:error',
      time: 'last 24 hours',
      sort: '-date',
      limit: 10,
      mode: 'summary'
    }));

    // GROUP 2: count-events - Test counting variations
    console.log('\n━━━ COUNT-EVENTS: Counting & Filtering ━━━\n');

    this.testResults.push(await this.callTool('count-events', {})); // Total
    this.testResults.push(await this.callTool('count-events', { filter: 'type:error' }));
    this.testResults.push(await this.callTool('count-events', { filter: 'type:log' }));
    this.testResults.push(await this.callTool('count-events', { time: 'last 24 hours' }));
    this.testResults.push(await this.callTool('count-events', { time: 'last 7 days' }));
    this.testResults.push(await this.callTool('count-events', {
      filter: 'type:error',
      time: 'last 7 days'
    }));

    // GROUP 3: get-stacks - Test stack queries
    console.log('\n━━━ GET-STACKS: Stack Management Testing ━━━\n');

    this.testResults.push(await this.callTool('get-stacks', {})); // Defaults
    this.testResults.push(await this.callTool('get-stacks', { limit: 10, mode: 'full' }));
    this.testResults.push(await this.callTool('get-stacks', { filter: 'status:open', limit: 5 }));
    this.testResults.push(await this.callTool('get-stacks', { filter: 'status:fixed', limit: 5 }));
    this.testResults.push(await this.callTool('get-stacks', { sort: '-total_occurrences', limit: 10 }));
    this.testResults.push(await this.callTool('get-stacks', { sort: '-last_occurrence', limit: 10 }));
    this.testResults.push(await this.callTool('get-stacks', {
      filter: 'status:open',
      sort: '-total_occurrences',
      limit: 5,
      mode: 'summary'
    }));

    // GROUP 4: get-sessions - Test session queries
    console.log('\n━━━ GET-SESSIONS: Session Tracking ━━━\n');

    this.testResults.push(await this.callTool('get-sessions', {}));
    this.testResults.push(await this.callTool('get-sessions', { limit: 10, mode: 'full' }));
    this.testResults.push(await this.callTool('get-sessions', { time: 'last 24 hours', limit: 5 }));
    this.testResults.push(await this.callTool('get-sessions', { sort: '-date', limit: 5 }));

    // GROUP 5: ID-based lookups - Test specific resource retrieval
    console.log('\n━━━ ID-BASED QUERIES: Resource Lookups ━━━\n');

    // Get some real IDs from previous results
    const eventResult = this.testResults.find(r => r.tool === 'get-events' && r.success && r.data);
    let eventId = null;
    if (eventResult && eventResult.data) {
      if (Array.isArray(eventResult.data)) {
        eventId = eventResult.data[0]?.id;
      } else if (eventResult.data.data && Array.isArray(eventResult.data.data)) {
        eventId = eventResult.data.data[0]?.id;
      }
    }

    if (eventId) {
      console.log(`   Using real event ID: ${eventId}\n`);
      this.testResults.push(await this.callTool('get-event', { id: eventId }));
    }

    const stackResult = this.testResults.find(r => r.tool === 'get-stacks' && r.success && r.data);
    let stackId = null;
    if (stackResult && stackResult.data) {
      if (Array.isArray(stackResult.data)) {
        stackId = stackResult.data[0]?.id;
      } else if (stackResult.data.data && Array.isArray(stackResult.data.data)) {
        stackId = stackResult.data.data[0]?.id;
      }
    }

    if (stackId) {
      console.log(`   Using real stack ID: ${stackId}\n`);
      this.testResults.push(await this.callTool('get-stack', { id: stackId }));
      this.testResults.push(await this.callTool('get-stack-events', { stack_id: stackId, limit: 10 }));
    }

    const sessionResult = this.testResults.find(r => r.tool === 'get-sessions' && r.success && r.data);
    let sessionId = null;
    if (sessionResult && sessionResult.data) {
      if (Array.isArray(sessionResult.data)) {
        sessionId = sessionResult.data[0]?.id;
      } else if (sessionResult.data.data && Array.isArray(sessionResult.data.data)) {
        sessionId = sessionResult.data.data[0]?.id;
      }
    }

    if (sessionId) {
      console.log(`   Using real session ID: ${sessionId}\n`);
      this.testResults.push(await this.callTool('get-session-events', { session_id: sessionId, limit: 5 }));
    }

    // Test reference ID lookup
    this.testResults.push(await this.callTool('get-event-by-reference', { reference_id: 'test-reference-id' }));

    // GROUP 6: Edge Cases & Error Handling
    console.log('\n━━━ EDGE CASES: Error Handling & Limits ━━━\n');

    // Empty results
    this.testResults.push(await this.callTool('get-events', { filter: 'type:nonexistent_xyz', limit: 1 }));

    // Pagination limits
    this.testResults.push(await this.callTool('get-events', { limit: 100 })); // Max limit
    this.testResults.push(await this.callTool('get-events', { limit: 1 })); // Min limit

    // Invalid IDs (should return 404)
    this.testResults.push(await this.callTool('get-event', { id: 'invalid-id-12345' }));
    this.testResults.push(await this.callTool('get-stack', { id: 'invalid-stack-id' }));
  }

  generateReport() {
    console.log('\n\n═══════════════════════════════════════════════════════════\n');
    console.log('            PRODUCTION TEST SUMMARY REPORT\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    const total = this.testResults.length;
    const successful = this.testResults.filter(r => r.success).length;
    const failed = total - successful;
    const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / total;

    console.log(`Total Tests:      ${total}`);
    console.log(`✅ Successful:     ${successful} (${(successful/total*100).toFixed(1)}%)`);
    console.log(`❌ Failed:         ${failed} (${(failed/total*100).toFixed(1)}%)`);
    console.log(`⏱️  Avg Duration:   ${avgDuration.toFixed(0)}ms\n`);

    // Group by tool
    const byTool = {};
    this.testResults.forEach(r => {
      if (!byTool[r.tool]) {
        byTool[r.tool] = { total: 0, success: 0, failed: 0, avgDuration: 0 };
      }
      byTool[r.tool].total++;
      if (r.success) {
        byTool[r.tool].success++;
      } else {
        byTool[r.tool].failed++;
      }
      byTool[r.tool].avgDuration = (byTool[r.tool].avgDuration * (byTool[r.tool].total - 1) + r.duration) / byTool[r.tool].total;
    });

    console.log('Results by Tool:\n');
    Object.entries(byTool).forEach(([tool, stats]) => {
      const status = stats.failed === 0 ? '✅' : stats.success > 0 ? '⚠️' : '❌';
      const pct = ((stats.success / stats.total) * 100).toFixed(0);
      console.log(`  ${status} ${tool.padEnd(25)} ${stats.success}/${stats.total} (${pct}%)  ${stats.avgDuration.toFixed(0)}ms avg`);
    });

    // Show failed tests
    const failedTests = this.testResults.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log('\n━━━ Failed Tests ━━━\n');
      failedTests.forEach((test, idx) => {
        console.log(`${idx + 1}. ${test.tool}`);
        console.log(`   Args: ${JSON.stringify(test.args)}`);
        console.log(`   Error: ${JSON.stringify(test.error).substring(0, 120)}`);
        console.log('');
      });
    }

    // Production readiness assessment
    console.log('\n━━━ Production Readiness Assessment ━━━\n');
    const successRate = (successful / total) * 100;
    if (successRate >= 95) {
      console.log('✅ PRODUCTION READY - All tools functioning correctly');
    } else if (successRate >= 85) {
      console.log('⚠️  PRODUCTION READY WITH NOTES - Review failed tests');
    } else {
      console.log('❌ NOT PRODUCTION READY - Multiple tool failures detected');
    }
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   Avg Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log(`   Tools Tested: ${Object.keys(byTool).length}/9`);

    console.log('\n═══════════════════════════════════════════════════════════\n');
  }

  async cleanup() {
    if (this.server) {
      this.server.kill();
    }
  }

  async run() {
    try {
      await this.startServer();
      await this.initialize();
      await this.runProductionTests();
      this.generateReport();
    } catch (error) {
      console.error('💥 Fatal error:', error);
    } finally {
      await this.cleanup();
      process.exit(0);
    }
  }
}

const tester = new ProductionTester();
tester.run();
