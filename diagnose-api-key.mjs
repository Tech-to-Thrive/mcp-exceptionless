import { readFileSync } from 'fs';
import { join } from 'path';
import https from 'https';

// Read API key from .claude.json
function getConfiguredApiKey() {
  try {
    const claudeJsonPath = join(process.env.USERPROFILE || process.env.HOME, '.claude.json');
    const claudeJson = JSON.parse(readFileSync(claudeJsonPath, 'utf-8'));

    const projectPath = process.cwd();
    const projectConfig = claudeJson.projects?.[projectPath];

    if (!projectConfig?.mcpServers?.exceptionless?.env?.EXCEPTIONLESS_API_KEY) {
      throw new Error('Exceptionless API key not found in .claude.json configuration');
    }

    return projectConfig.mcpServers.exceptionless.env.EXCEPTIONLESS_API_KEY;
  } catch (error) {
    console.error('❌ Failed to read configuration:', error.message);
    throw error;
  }
}

function makeRequest(path, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.exceptionless.io',
      port: 443,
      path: `/api/v2${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'mcp-exceptionless-diagnostic/1.0.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function diagnose() {
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('      EXCEPTIONLESS API KEY DIAGNOSTIC TOOL\n');
  console.log('═══════════════════════════════════════════════════════════\n\n');

  const apiKey = getConfiguredApiKey();
  console.log('✅ API Key found in configuration');
  console.log(`   Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`   Length: ${apiKey.length} characters\n`);

  const endpoints = [
    { name: 'Projects List', path: '/projects', description: 'Get list of projects' },
    { name: 'Current User', path: '/users/me', description: 'Get current user info' },
    { name: 'Organizations', path: '/organizations', description: 'Get organizations' },
    { name: 'Events', path: '/events?limit=1', description: 'Query events (limited to 1)' },
    { name: 'Stacks', path: '/stacks?limit=1', description: 'Query stacks (limited to 1)' },
    { name: 'Event Count', path: '/events/count', description: 'Count total events' },
    { name: 'Tokens', path: '/tokens', description: 'List API tokens' },
  ];

  console.log('Testing API endpoints...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = [];

  for (const endpoint of endpoints) {
    process.stdout.write(`Testing: ${endpoint.name.padEnd(20)} `);

    try {
      const result = await makeRequest(endpoint.path, apiKey);

      if (result.status === 200) {
        console.log('✅ OK');
        results.push({ ...endpoint, status: 'success', code: 200, data: result.data });
      } else if (result.status === 403) {
        console.log('❌ 403 Forbidden');
        results.push({ ...endpoint, status: 'forbidden', code: 403, data: result.data });
      } else if (result.status === 401) {
        console.log('❌ 401 Unauthorized (Invalid API key)');
        results.push({ ...endpoint, status: 'unauthorized', code: 401, data: result.data });
      } else if (result.status === 404) {
        console.log('⚠️  404 Not Found');
        results.push({ ...endpoint, status: 'not_found', code: 404, data: result.data });
      } else {
        console.log(`⚠️  ${result.status}`);
        results.push({ ...endpoint, status: 'other', code: result.status, data: result.data });
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results.push({ ...endpoint, status: 'error', error: error.message });
    }

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Analysis
  console.log('ANALYSIS:\n');

  const successful = results.filter(r => r.status === 'success');
  const forbidden = results.filter(r => r.status === 'forbidden');
  const unauthorized = results.filter(r => r.status === 'unauthorized');

  console.log(`✅ Successful:   ${successful.length}/${results.length}`);
  console.log(`❌ Forbidden:    ${forbidden.length}/${results.length}`);
  console.log(`❌ Unauthorized: ${unauthorized.length}/${results.length}\n`);

  if (unauthorized.length > 0) {
    console.log('🔴 CRITICAL: API key appears to be invalid or expired.\n');
    console.log('   Solution: Generate a new API key at:');
    console.log('   https://app.exceptionless.io/project/list\n');
  } else if (forbidden.length === results.length) {
    console.log('⚠️  WARNING: API key is valid but has NO permissions.\n');
    console.log('   This is a project-specific API key with restricted access.');
    console.log('   The project may be empty or the key may be read-only.\n');
    console.log('   Possible causes:');
    console.log('   1. No data has been sent to this project yet');
    console.log('   2. The API key has limited scopes/permissions');
    console.log('   3. The API key is for a specific project ID\n');
    console.log('   To test with full access, create a USER token instead of a project token.\n');
  } else if (successful.length > 0) {
    console.log('✅ GOOD: API key is working!\n');

    // Show available data
    console.log('Available Data:\n');

    const eventsResult = results.find(r => r.name === 'Events' && r.status === 'success');
    if (eventsResult && eventsResult.data) {
      const count = Array.isArray(eventsResult.data) ? eventsResult.data.length :
                    eventsResult.data.total || eventsResult.data.length || 0;
      console.log(`   📊 Events: ${count > 0 ? 'Data available' : 'No events yet'}`);
    }

    const stacksResult = results.find(r => r.name === 'Stacks' && r.status === 'success');
    if (stacksResult && stacksResult.data) {
      const count = Array.isArray(stacksResult.data) ? stacksResult.data.length :
                    stacksResult.data.total || stacksResult.data.length || 0;
      console.log(`   📚 Stacks: ${count > 0 ? 'Data available' : 'No stacks yet'}`);
    }

    const countResult = results.find(r => r.name === 'Event Count' && r.status === 'success');
    if (countResult && countResult.data) {
      const total = countResult.data.total || 0;
      console.log(`   🔢 Total Events: ${total}`);
    }

    console.log('\n');
  }

  // Detailed response data for successful endpoints
  if (successful.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('SUCCESSFUL ENDPOINT DETAILS:\n');

    successful.forEach(result => {
      console.log(`\n📍 ${result.name} (${result.path}):`);
      const dataStr = JSON.stringify(result.data, null, 2);
      const preview = dataStr.length > 500 ? dataStr.substring(0, 500) + '...' : dataStr;
      console.log(preview);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  console.log('\nDIAGNOSTIC COMPLETE\n');
  console.log('═══════════════════════════════════════════════════════════\n');
}

diagnose().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
