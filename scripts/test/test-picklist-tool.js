const { spawn } = require('child_process');

async function testPicklistTool() {
    console.log('🔍 Testing picklist tool with MAG organization...');
    
    const server = spawn('node', ['dist/server.js'], {
        env: {
            ...process.env,
            MULTI_CONFIG_ENABLED: 'true',
            MULTI_CONFIG_PATH: './zoho-config.json'
        }
    });

    let serverReady = false;
    let serverOutput = '';

    server.stdout.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
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

    // Test the picklist tool with common disposition field names
    const testCases = [
        { module: 'Calls', field: 'Disposition' },
        { module: 'Calls', field: 'Sub_Disposition' },
        { module: 'Calls', field: 'Call_Result' },
        { module: 'Leads', field: 'Lead_Status' },
        { module: 'Leads', field: 'Lead_Source' },
        { module: 'Leads', field: 'Industry' },
        { module: 'Accounts', field: 'Industry' },
        { module: 'Accounts', field: 'Type' },
        { module: 'Contacts', field: 'Lead_Source' },
        { module: 'Contacts', field: 'Salutation' }
    ];

    console.log('\n📋 Testing picklist values for various fields...\n');

    for (const testCase of testCases) {
        try {
            console.log(`🔍 Testing: ${testCase.module} - ${testCase.field}`);
            
            // Simulate MCP tool call
            const toolCall = {
                name: 'crm_get_picklist_values',
                arguments: {
                    module_name: testCase.module,
                    field_name: testCase.field
                }
            };

            console.log(`📤 Tool call:`, JSON.stringify(toolCall, null, 2));
            
            // For now, just log what we would call
            console.log(`📥 Would call: crm_get_picklist_values with module_name="${testCase.module}", field_name="${testCase.field}"`);
            console.log('---');
            
        } catch (error) {
            console.error(`❌ Error testing ${testCase.module} - ${testCase.field}:`, error.message);
        }
    }

    console.log('\n✅ Picklist tool test completed!');
    console.log('\n📝 To test with actual MCP client, use:');
    console.log('node test-mcp-tools.js');
    
    server.kill();
}

testPicklistTool().catch(console.error); 