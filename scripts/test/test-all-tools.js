const { spawn } = require('child_process');

console.log('Testing MCP Server Tools...\n');

const server = spawn('node', ['dist/server.js'], {
  env: {
    ...process.env,
    MULTI_CONFIG_ENABLED: 'true',
    MULTI_CONFIG_PATH: './zoho-config.json'
  }
});

let responseReceived = false;

server.stdout.on('data', (data) => {
  const output = data.toString();
  
  if (output.includes('🚀 Zoho MCP Server is running and ready for requests')) {
    console.log('✅ Server is ready! Sending tools/list request...\n');
    
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  }
  
  if (output.includes('"result"') && !responseReceived) {
    responseReceived = true;
    
    try {
      const lines = output.split('\n');
      const jsonLine = lines.find(line => line.includes('"result"'));
      if (jsonLine) {
        const parsed = JSON.parse(jsonLine);
        if (parsed.result && parsed.result.tools) {
          const tools = parsed.result.tools;
          
          console.log(`📊 Total Tools Available: ${tools.length}\n`);
          
          // Categorize tools
          const configTools = tools.filter(t => t.name.startsWith('config_'));
          const booksTools = tools.filter(t => t.name.startsWith('books_'));
          const syncTools = tools.filter(t => t.name.startsWith('sync_'));
          const searchTools = tools.filter(t => t.name.includes('search'));
          const otherTools = tools.filter(t => 
            !t.name.startsWith('config_') && 
            !t.name.startsWith('books_') && 
            !t.name.startsWith('sync_') && 
            !t.name.includes('search')
          );
          
          console.log('🔧 Configuration Management Tools:');
          configTools.forEach(tool => {
            console.log(`  ✅ ${tool.name}: ${tool.description}`);
          });
          
          console.log('\n📚 Books Tools:');
          booksTools.forEach(tool => {
            console.log(`  ✅ ${tool.name}: ${tool.description}`);
          });
          
          console.log('\n🔄 Sync Tools:');
          syncTools.forEach(tool => {
            console.log(`  ✅ ${tool.name}: ${tool.description}`);
          });
          
          console.log('\n🔍 Search Tools:');
          searchTools.forEach(tool => {
            console.log(`  ✅ ${tool.name}: ${tool.description}`);
          });
          
          console.log('\n📋 Other Tools:');
          otherTools.forEach(tool => {
            console.log(`  ✅ ${tool.name}: ${tool.description}`);
          });
          
          console.log(`\n🎉 Configuration tools available: ${configTools.length}`);
          console.log('The LLM can now switch between organizations using:');
          console.log('  - config_list_environments');
          console.log('  - config_switch_environment');
          console.log('  - config_get_status');
        }
      }
    } catch (e) {
      console.log('Error parsing response:', e);
      console.log('Raw response:', output);
    }
    
    setTimeout(() => {
      server.kill();
      process.exit(0);
    }, 1000);
  }
});

server.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

setTimeout(() => {
  console.log('❌ Timeout - server did not respond');
  server.kill();
  process.exit(1);
}, 15000); 