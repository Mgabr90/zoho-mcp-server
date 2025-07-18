const { spawn } = require('child_process');

async function testFieldsFirst() {
    console.log('🔍 First getting fields from Leads module to see what\'s available...');
    
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
                resolve(true);
            } else {
                setTimeout(checkReady, 100);
            }
        };
        checkReady();
    });

    console.log('✅ Server is ready!');

    // First get all fields from Leads module
    console.log('\n📋 Getting all fields from Leads module...\n');
    
    const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
            name: 'crm_get_module_fields',
            arguments: {
                module_name: 'Leads'
            }
        }
    };

    console.log(`📤 Sending request to get Leads fields`);
    console.log(`📤 Request:`, JSON.stringify(mcpRequest, null, 2));
    
    // Send request to server via stdin
    server.stdin.write(JSON.stringify(mcpRequest) + '\n');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n✅ Fields test completed!');
    
    server.kill();
}

testFieldsFirst().catch(console.error); 