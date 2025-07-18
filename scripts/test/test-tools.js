const { spawn } = require('child_process');
const readline = require('readline');

// Start the server
const server = spawn('node', ['dist/server.js'], {
  env: {
    ...process.env,
    MULTI_CONFIG_ENABLED: 'true',
    MULTI_CONFIG_PATH: './zoho-config.json'
  }
});

// Create readline interface for the server
const rl = readline.createInterface({
  input: server.stdout,
  terminal: false
});

// Listen for server startup
rl.on('line', (line) => {
  console.log('Server:', line);
  
  // Once server is ready, send a list tools request
  if (line.includes('🚀 Zoho MCP Server is running and ready for requests')) {
    console.log('\n=== Testing Tool Registration ===');
    
    // Send a list tools request
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  }
});

// Listen for server responses
server.stderr.on('data', (data) => {
  console.log('Server stderr:', data.toString());
});

// Handle server response
server.stdout.on('data', (data) => {
  const response = data.toString();
  if (response.includes('"result"')) {
    try {
      const parsed = JSON.parse(response);
      if (parsed.result && parsed.result.tools) {
        console.log('\n=== Available Tools ===');
        const tools = parsed.result.tools;
        console.log(`Total tools: ${tools.length}`);
        
        // Check for configuration tools
        const configTools = tools.filter(tool => tool.name.startsWith('config_'));
        console.log(`Configuration tools: ${configTools.length}`);
        
        configTools.forEach(tool => {
          console.log(`- ${tool.name}: ${tool.description}`);
        });
        
        // Check for other tool categories
        const booksTools = tools.filter(tool => tool.name.startsWith('books_'));
        const syncTools = tools.filter(tool => tool.name.startsWith('sync_'));
        
        console.log(`\nBooks tools: ${booksTools.length}`);
        console.log(`Sync tools: ${syncTools.length}`);
        
        console.log('\n=== All Tools ===');
        tools.forEach(tool => {
          console.log(`- ${tool.name}`);
        });
      }
    } catch (e) {
      console.log('Response:', response);
    }
    
    // Close the server after getting the response
    setTimeout(() => {
      server.kill();
      process.exit(0);
    }, 1000);
  }
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
}); 