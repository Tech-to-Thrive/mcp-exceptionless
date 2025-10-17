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
    const projectId = projectConfig.mcpServers.exceptionless.env.EXCEPTIONLESS_PROJECT_ID;

    console.log('📋 Testing New Project and Organization Tools');
    console.log(`   API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    if (projectId) {
      console.log(`   Project ID: ${projectId}`);
    }
    console.log('\n');

    return { apiKey, projectId };
  } catch (error) {
    console.error('❌ Failed to read configuration:', error.message);
    console.error('   Make sure the MCP server is configured in .claude.json\n');
    throw error;
  }
}

class NewToolsTester {
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

    const env = {
      ...process.env,
      EXCEPTIONLESS_API_KEY: this.apiKey,
    };

    if (this.projectId) {
      env.EXCEPTIONLESS_PROJECT_ID = this.projectId;
    }

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
      clientInfo: { name: 'new-tools-tester', version: '1.0.0' }
    });
    await this.sendRequest('initialized');
    return response;
  }

  async listTools() {
    console.log('📋 Listing all available tools...\n');
    const response = await this.sendRequest('tools/list');
    const tools = response.result.tools;
    console.log(`✅ Found ${tools.length} tools total\n`);

    const newTools = tools.filter(t =>
      t.name.includes('project') || t.name.includes('organization')
    );

    console.log(`🆕 New Tools (${newTools.length}):`);
    newTools.forEach(tool => {
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
    console.log('       NEW TOOLS TEST SUITE: Projects & Organizations\n');
    console.log('═══════════════════════════════════════════════════════════\n\n');

    // Test 1: get-projects
    console.log('━━━ TEST GROUP 1: PROJECT TOOLS ━━━\n');
    this.testResults.push(await this.callTool('get-projects', {}));
    this.testResults.push(await this.callTool('get-projects', { mode: 'full', limit: 5 }));
    this.testResults.push(await this.callTool('get-projects', { mode: 'summary', limit: 10 }));

    // Get a project ID from the results
    const projectsResult = this.testResults.find(r => r.tool === 'get-projects' && r.success && r.data);
    let projectId = null;
    if (projectsResult && projectsResult.data) {
      if (Array.isArray(projectsResult.data)) {
        projectId = projectsResult.data[0]?.id;
      } else if (projectsResult.data.data && Array.isArray(projectsResult.data.data)) {
        projectId = projectsResult.data.data[0]?.id;
      }
    }

    // Test 2: get-project
    if (projectId) {
      console.log(`   Using real project ID: ${projectId}\n`);
      this.testResults.push(await this.callTool('get-project', { id: projectId }));
    } else {
      console.log('   ⚠️  No project ID found, testing with invalid ID\n');
      this.testResults.push(await this.callTool('get-project', { id: 'test-project-id' }));
    }

    // Test 3: get-organizations
    console.log('\n━━━ TEST GROUP 2: ORGANIZATION TOOLS ━━━\n');
    this.testResults.push(await this.callTool('get-organizations', {}));
    this.testResults.push(await this.callTool('get-organizations', { mode: 'full', limit: 5 }));

    // Get an organization ID from the results
    const orgsResult = this.testResults.find(r => r.tool === 'get-organizations' && r.success && r.data);
    let orgId = null;
    if (orgsResult && orgsResult.data) {
      if (Array.isArray(orgsResult.data)) {
        orgId = orgsResult.data[0]?.id;
      } else if (orgsResult.data.data && Array.isArray(orgsResult.data.data)) {
        orgId = orgsResult.data.data[0]?.id;
      }
    }

    // Test 4: get-organization
    if (orgId) {
      console.log(`   Using real organization ID: ${orgId}\n`);
      this.testResults.push(await this.callTool('get-organization', { id: orgId }));
    } else {
      console.log('   ⚠️  No organization ID found, testing with invalid ID\n');
      this.testResults.push(await this.callTool('get-organization', { id: 'test-org-id' }));
    }

    // Edge cases
    console.log('\n━━━ TEST GROUP 3: EDGE CASES ━━━\n');
    this.testResults.push(await this.callTool('get-project', { id: 'invalid-id-12345' }));
    this.testResults.push(await this.callTool('get-organization', { id: 'invalid-org-id' }));
  }

  generateReport() {
    console.log('\n\n═══════════════════════════════════════════════════════════\n');
    console.log('                NEW TOOLS TEST SUMMARY\n');
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

    // Assessment
    const successRate = (successful / total) * 100;
    console.log('━━━ Production Readiness Assessment ━━━\n');
    if (successRate >= 75) {
      console.log('✅ NEW TOOLS READY - All new tools functioning correctly');
    } else {
      console.log('❌ REVIEW NEEDED - Some tools need attention');
    }
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   Avg Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log(`   New Tools Tested: ${Object.keys(byTool).length}/4`);

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

const tester = new NewToolsTester();
tester.run();
