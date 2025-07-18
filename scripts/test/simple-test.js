const { spawn } = require('child_process');

console.log('Starting server test...');

const server = spawn('node', ['dist/server.js'], {
  env: {
    ...process.env,
    MULTI_CONFIG_ENABLED: 'true',
    MULTI_CONFIG_PATH: './zoho-config.json'
  }
});

let serverReady = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('STDOUT:', output);
  
  if (output.includes('🚀 Zoho MCP Server is running and ready for requests')) {
    serverReady = true;
    console.log('✅ Server is ready!');
    
    // Send a simple test request
    const testRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    console.log('Sending tools/list request...');
    server.stdin.write(JSON.stringify(testRequest) + '\n');
  }
});

server.stderr.on('data', (data) => {
  const output = data.toString();
  console.log('STDERR:', output);
});

server.on('close', (code) => {
  console.log(`Server closed with code ${code}`);
});

// Timeout after 10 seconds
setTimeout(() => {
  if (!serverReady) {
    console.log('❌ Server did not start within timeout');
    server.kill();
  }
}, 10000); 