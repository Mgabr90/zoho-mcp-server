const { spawn } = require('child_process');

async function testGlobalFields() {
    console.log('🔍 Testing global fields tool...');
    
    // Start the MCP server
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
        if (output.includes('Server is running and ready for requests')) {
            serverReady = true;
        }
    });

    server.stderr.on('data', (data) => {
        console.log('STDERR:', data.toString());
    });

    // Wait for server to be ready
    await new Promise(resolve => {
        const checkReady = () => {
            if (serverReady) {
                resolve();
            } else {
                setTimeout(checkReady, 100);
            }
        };
        checkReady();
    });

    console.log('✅ Server is ready. Testing global fields tool...');

    // Test the global fields tool
    const testRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
            name: 'crm_get_global_fields',
            arguments: {}
        }
    };

    // Send the request to the server
    server.stdin.write(JSON.stringify(testRequest) + '\n');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('✅ Global fields test completed');
    
    // Clean up
    server.kill();
}

testGlobalFields().catch(console.error); 