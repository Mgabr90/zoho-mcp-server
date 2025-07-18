const { spawn } = require('child_process');

async function testDispositionDependencies() {
    console.log('🔍 Testing disposition and sub-disposition picklist dependencies in Leads module...');
    
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

    console.log('✅ Server is ready. Testing disposition dependencies...');

    try {
        // Test 1: Get all fields in Leads module to find disposition fields
        console.log('\n📊 Step 1: Getting all fields in Leads module...');
        const fieldsRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
                name: 'crm_get_module_fields',
                arguments: {
                    module_name: 'Leads'
                }
            }
        };

        const fieldsResponse = await fetch('http://localhost:3000', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fieldsRequest)
        });

        const fieldsResult = await fieldsResponse.json();
        console.log('Fields Result:', JSON.stringify(fieldsResult, null, 2));

        // Test 2: Get picklist values for disposition field
        console.log('\n📊 Step 2: Getting picklist values for disposition field...');
        const dispositionRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'crm_get_picklist_values',
                arguments: {
                    module_name: 'Leads',
                    field_name: 'disposition'
                }
            }
        };

        const dispositionResponse = await fetch('http://localhost:3000', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dispositionRequest)
        });

        const dispositionResult = await dispositionResponse.json();
        console.log('Disposition Picklist Result:', JSON.stringify(dispositionResult, null, 2));

        // Test 3: Get picklist values for sub-disposition field
        console.log('\n📊 Step 3: Getting picklist values for sub-disposition field...');
        const subDispositionRequest = {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
                name: 'crm_get_picklist_values',
                arguments: {
                    module_name: 'Leads',
                    field_name: 'sub_disposition'
                }
            }
        };

        const subDispositionResponse = await fetch('http://localhost:3000', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subDispositionRequest)
        });

        const subDispositionResult = await subDispositionResponse.json();
        console.log('Sub-Disposition Picklist Result:', JSON.stringify(subDispositionResult, null, 2));

        // Test 4: Analyze picklist dependencies in Leads module
        console.log('\n📊 Step 4: Analyzing picklist dependencies in Leads module...');
        const dependenciesRequest = {
            jsonrpc: '2.0',
            id: 4,
            method: 'tools/call',
            params: {
                name: 'crm_analyze_picklist_dependencies',
                arguments: {
                    module_name: 'Leads'
                }
            }
        };

        const dependenciesResponse = await fetch('http://localhost:3000', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dependenciesRequest)
        });

        const dependenciesResult = await dependenciesResponse.json();
        console.log('Picklist Dependencies Result:', JSON.stringify(dependenciesResult, null, 2));

        // Test 5: Get dependent fields for disposition
        console.log('\n📊 Step 5: Getting fields that depend on disposition...');
        const dependentFieldsRequest = {
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: {
                name: 'crm_get_dependent_fields',
                arguments: {
                    module_name: 'Leads',
                    field_name: 'disposition'
                }
            }
        };

        const dependentFieldsResponse = await fetch('http://localhost:3000', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dependentFieldsRequest)
        });

        const dependentFieldsResult = await dependentFieldsResponse.json();
        console.log('Dependent Fields Result:', JSON.stringify(dependentFieldsResult, null, 2));

        console.log('\n✅ Disposition dependency analysis completed!');

    } catch (error) {
        console.error('❌ Error during testing:', error);
    } finally {
        server.kill();
        console.log('🔄 Server stopped.');
    }
}

testDispositionDependencies().catch(console.error); 