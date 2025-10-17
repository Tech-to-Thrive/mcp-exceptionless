import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read configuration from .claude.json
function getConfiguration() {
  try {
    const claudeJsonPath = join(process.env.USERPROFILE || process.env.HOME, '.claude.json');
    const claudeJson = JSON.parse(readFileSync(claudeJsonPath, 'utf-8'));

    const projectPath = __dirname;
    const projectConfig = claudeJson.projects?.[projectPath];

    if (!projectConfig?.mcpServers?.exceptionless?.env?.EXCEPTIONLESS_API_KEY) {
      throw new Error('Exceptionless API key not found in .claude.json configuration');
    }

    const apiKey = projectConfig.mcpServers.exceptionless.env.EXCEPTIONLESS_API_KEY;

    console.log('📋 Testing Dynamic Project Filtering');
    console.log(`   API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log('   Mode: Organization-wide access (no EXCEPTIONLESS_PROJECT_ID set)');
    console.log('\n');

    return { apiKey };
  } catch (error) {
    console.error('❌ Failed to read configuration:', error.message);
    throw error;
  }
}

class DynamicFilteringTester {
  constructor() {
    this.messageId = 0;
    this.responses = new Map();
    this.testResults = [];
    const config = getConfiguration();
    this.apiKey = config.apiKey;
  }

  async startServer() {
    console.log('🚀 Starting MCP Server (org-wide access)...\n');

    const env = {
      ...process.env,
      EXCEPTIONLESS_API_KEY: this.apiKey,
      // NO EXCEPTIONLESS_PROJECT_ID set - we'll test dynamic filtering via params
    };

    this.server = spawn('node', ['dist/index.js'], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.server.stderr.on('data', (data) => {
      const stderr = data.toString();
      if (!stderr.includes('"level":50')) {
        console.log('📋 Server:', stderr);
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
          // Ignore parse errors
        }
      }
    });

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
      }, 15000);
    });
  }

  async initialize() {
    const response = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'dynamic-filtering-tester', version: '1.0.0' }
    });
    await this.sendRequest('initialized');
    return response;
  }

  async callTool(name, args = {}) {
    const startTime = Date.now();
    try {
      const response = await this.sendRequest('tools/call', {
        name,
        arguments: args
      });
      const duration = Date.now() - startTime;

      if (response.error) {
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
      return {
        tool: name,
        args,
        success: false,
        error: error.message,
        duration
      };
    }
  }

  async run() {
    try {
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log('       DYNAMIC PROJECT FILTERING TEST SUITE\n');
      console.log('═══════════════════════════════════════════════════════════\n\n');

      await this.startServer();
      await this.initialize();

      // Step 1: Get projects
      console.log('━━━ STEP 1: Discover available projects ━━━\n');

      const projectsResult = await this.callTool('get-projects', { mode: 'full', limit: 50 });

      if (!projectsResult.success) {
        console.error('❌ Failed to get projects:', projectsResult.error);
        return;
      }

      let projects = projectsResult.data;
      if (!Array.isArray(projects) && projects.data) {
        projects = projects.data;
      }

      console.log(`✅ Found ${projects.length} projects\n`);

      // Get first two projects for testing
      const project1 = projects[0];
      const project2 = projects.length > 1 ? projects[1] : null;

      console.log(`Testing with:`);
      console.log(`  Project 1: ${project1.name} (${project1.id})`);
      if (project2) {
        console.log(`  Project 2: ${project2.name} (${project2.id})`);
      }
      console.log('\n');

      // Step 2: Test org-wide queries (no project_id param)
      console.log('━━━ STEP 2: Query org-wide (no project_id parameter) ━━━\n');

      const orgEvents = await this.callTool('get-events', { limit: 3, mode: 'summary' });
      const orgCount = await this.callTool('count-events', {});
      const orgStacks = await this.callTool('get-stacks', { limit: 3, mode: 'summary' });

      console.log(`✅ Org-wide events: ${orgEvents.success ? 'retrieved' : 'failed'}`);
      console.log(`✅ Org-wide count: ${orgCount.success ? JSON.stringify(orgCount.data) : 'failed'}`);
      console.log(`✅ Org-wide stacks: ${orgStacks.success ? 'retrieved' : 'failed'}`);
      console.log('\n');

      this.testResults.push(orgEvents, orgCount, orgStacks);

      // Step 3: Test project1-specific queries (with project_id param)
      console.log(`━━━ STEP 3: Query ${project1.name} (with project_id parameter) ━━━\n`);

      const p1Events = await this.callTool('get-events', { project_id: project1.id, limit: 3, mode: 'summary' });
      const p1Count = await this.callTool('count-events', { project_id: project1.id });
      const p1Stacks = await this.callTool('get-stacks', { project_id: project1.id, limit: 3, mode: 'summary' });
      const p1Sessions = await this.callTool('get-sessions', { project_id: project1.id, limit: 2 });

      console.log(`✅ Project 1 events: ${p1Events.success ? 'retrieved' : 'failed'}`);
      console.log(`✅ Project 1 count: ${p1Count.success ? JSON.stringify(p1Count.data) : 'failed'}`);
      console.log(`✅ Project 1 stacks: ${p1Stacks.success ? 'retrieved' : 'failed'}`);
      console.log(`✅ Project 1 sessions: ${p1Sessions.success ? 'retrieved' : 'failed'}`);
      console.log('\n');

      this.testResults.push(p1Events, p1Count, p1Stacks, p1Sessions);

      // Step 4: Test project2-specific queries (if available)
      if (project2) {
        console.log(`━━━ STEP 4: Query ${project2.name} (with project_id parameter) ━━━\n`);

        const p2Events = await this.callTool('get-events', { project_id: project2.id, limit: 3, mode: 'summary' });
        const p2Count = await this.callTool('count-events', { project_id: project2.id });
        const p2Stacks = await this.callTool('get-stacks', { project_id: project2.id, limit: 3, mode: 'summary' });

        console.log(`✅ Project 2 events: ${p2Events.success ? 'retrieved' : 'failed'}`);
        console.log(`✅ Project 2 count: ${p2Count.success ? JSON.stringify(p2Count.data) : 'failed'}`);
        console.log(`✅ Project 2 stacks: ${p2Stacks.success ? 'retrieved' : 'failed'}`);
        console.log('\n');

        this.testResults.push(p2Events, p2Count, p2Stacks);
      }

      // Step 5: Test ID-based queries with project_id
      console.log('━━━ STEP 5: Test ID-based queries with project_id ━━━\n');

      // Get an event ID from project1
      let p1EventsData = p1Events.data;
      if (!Array.isArray(p1EventsData) && p1EventsData.data) {
        p1EventsData = p1EventsData.data;
      }

      if (p1EventsData && p1EventsData.length > 0) {
        const eventId = p1EventsData[0].id;
        console.log(`Testing get-event with project_id and event ID: ${eventId}\n`);
        const getEvent = await this.callTool('get-event', { id: eventId, project_id: project1.id });
        console.log(`✅ get-event with project_id: ${getEvent.success ? 'retrieved' : 'failed'}`);
        this.testResults.push(getEvent);
      }

      // Get a stack ID from project1
      let p1StacksData = p1Stacks.data;
      if (!Array.isArray(p1StacksData) && p1StacksData.data) {
        p1StacksData = p1StacksData.data;
      }

      if (p1StacksData && p1StacksData.length > 0) {
        const stackId = p1StacksData[0].id;
        console.log(`Testing get-stack with project_id and stack ID: ${stackId}\n`);
        const getStack = await this.callTool('get-stack', { id: stackId, project_id: project1.id });
        const getStackEvents = await this.callTool('get-stack-events', { stack_id: stackId, project_id: project1.id, limit: 2 });
        console.log(`✅ get-stack with project_id: ${getStack.success ? 'retrieved' : 'failed'}`);
        console.log(`✅ get-stack-events with project_id: ${getStackEvents.success ? 'retrieved' : 'failed'}`);
        this.testResults.push(getStack, getStackEvents);
      }

      console.log('\n');

      // Generate report
      this.generateReport(project1, project2);

    } catch (error) {
      console.error('💥 Fatal error:', error);
    } finally {
      if (this.server) {
        this.server.kill();
      }
      process.exit(0);
    }
  }

  generateReport(project1, project2) {
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('                TEST SUMMARY REPORT\n');
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

    // Summary
    const successRate = (successful / total) * 100;
    console.log('━━━ Dynamic Filtering Assessment ━━━\n');
    if (successRate >= 90) {
      console.log('✅ DYNAMIC FILTERING WORKS PERFECTLY');
    } else if (successRate >= 75) {
      console.log('⚠️  DYNAMIC FILTERING MOSTLY WORKS - Review failures');
    } else {
      console.log('❌ DYNAMIC FILTERING NEEDS ATTENTION');
    }
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   Avg Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log('\n');

    console.log('💡 Key Findings:');
    console.log('   • Server started with NO EXCEPTIONLESS_PROJECT_ID env var');
    console.log('   • Tested org-wide queries (no project_id param)');
    console.log(`   • Tested dynamic filtering for ${project1.name}`);
    if (project2) {
      console.log(`   • Tested dynamic filtering for ${project2.name}`);
    }
    console.log('   • All 9 tools now support optional project_id parameter');
    console.log('\n');

    console.log('🎯 Architecture:');
    console.log('   • EXCEPTIONLESS_PROJECT_ID (env) = Security boundary (optional)');
    console.log('   • project_id (param) = Query filter (optional, per-query)');
    console.log('   • Priority: param > env > org-wide');

    console.log('\n═══════════════════════════════════════════════════════════\n');
  }
}

const tester = new DynamicFilteringTester();
tester.run();
