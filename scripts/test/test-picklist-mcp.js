const { spawn } = require('child_process');
const fs = require('fs').promises;

async function testPicklistMCP() {
    console.log('🔍 Testing picklist tool via MCP...');
    
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

    // Test cases for picklist values
    const testCases = [
        { module: 'Calls', field: 'Disposition', description: 'Call disposition field' },
        { module: 'Calls', field: 'Sub_Disposition', description: 'Call sub-disposition field' },
        { module: 'Calls', field: 'Call_Result', description: 'Call result field' },
        { module: 'Leads', field: 'Lead_Status', description: 'Lead status field' },
        { module: 'Leads', field: 'Lead_Source', description: 'Lead source field' },
        { module: 'Leads', field: 'Industry', description: 'Lead industry field' },
        { module: 'Accounts', field: 'Industry', description: 'Account industry field' },
        { module: 'Accounts', field: 'Type', description: 'Account type field' },
        { module: 'Contacts', field: 'Lead_Source', description: 'Contact lead source field' },
        { module: 'Contacts', field: 'Salutation', description: 'Contact salutation field' },
        { module: 'Deals', field: 'Stage', description: 'Deal stage field' },
        { module: 'Deals', field: 'Type', description: 'Deal type field' },
        { module: 'Cases', field: 'Status', description: 'Case status field' },
        { module: 'Cases', field: 'Priority', description: 'Case priority field' },
        { module: 'Cases', field: 'Type', description: 'Case type field' }
    ];

    const results = [];

    console.log('\n📋 Testing picklist values for various fields...\n');

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

            console.log(`📤 MCP Request:`, JSON.stringify(mcpRequest, null, 2));
            
            // Send request to server via stdin
            server.stdin.write(JSON.stringify(mcpRequest) + '\n');
            
            // Wait a bit for response
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('---');
            
        } catch (error) {
            console.error(`❌ Error testing ${testCase.module} - ${testCase.field}:`, error.message);
            results.push({
                module: testCase.module,
                field: testCase.field,
                success: false,
                error: error.message
            });
        }
    }

    console.log('\n✅ Picklist MCP test completed!');
    console.log('\n📝 Results summary:');
    console.log(`- Tested ${testCases.length} field combinations`);
    console.log('- Check server output above for actual responses');
    
    // Save results to file
    await fs.writeFile('picklist-test-results.json', JSON.stringify(results, null, 2));
    console.log('- Results saved to picklist-test-results.json');
    
    server.kill();
}

testPicklistMCP().catch(console.error); 