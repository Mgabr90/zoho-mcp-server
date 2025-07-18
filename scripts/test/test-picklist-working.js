const { spawn } = require('child_process');

async function testPicklistWorking() {
    console.log('🔍 Testing picklist tool with fields that have picklist values...');
    
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

    // Test with fields that actually have picklist values
    const testCases = [
        { module: 'Leads', field: 'Enrich_Status__s', description: 'Enrich Status field' },
        { module: 'Leads', field: 'Reason_For_Future_Lead', description: 'Reason For Future Lead field' },
        { module: 'Leads', field: 'Reason_For_Not_Connected', description: 'Reason For Not Connected field' },
        { module: 'Leads', field: 'Reason_For_Not_Interested', description: 'Reason For Not Interested field' },
        { module: 'Leads', field: 'Record_Status__s', description: 'Record Status field' }
    ];

    console.log('\n📋 Testing picklist values for fields with actual picklist data...\n');

    for (const testCase of testCases) {
        try {
            console.log(`🔍 Testing: ${testCase.module} - ${testCase.field} (${testCase.description})`);
            
            // Create MCP request
            const mcpRequest = {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: 'crm_get_picklist_values',
                    arguments: {
                        module_name: testCase.module,
                        field_name: testCase.field
                    }
                }
            };

            console.log(`📤 Sending request for ${testCase.module} - ${testCase.field}`);
            
            // Send request to server via stdin
            server.stdin.write(JSON.stringify(mcpRequest) + '\n');
            
            // Wait for response
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('---');
            
        } catch (error) {
            console.error(`❌ Error testing ${testCase.module} - ${testCase.field}:`, error.message);
        }
    }

    console.log('\n✅ Picklist working test completed!');
    
    server.kill();
}

testPicklistWorking().catch(console.error); 