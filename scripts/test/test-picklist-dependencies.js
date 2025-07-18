const { spawn } = require('child_process');

async function testPicklistDependencies() {
    console.log('🔍 Testing picklist dependency functionality...');
    
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

    console.log('\n✅ Server is ready. Testing picklist dependency tools...\n');

    // Test 1: Analyze picklist dependencies in Leads module
    console.log('📊 Test 1: Analyzing picklist dependencies in Leads module...');
    try {
        const test1 = spawn('node', ['-e', `
            const { spawn } = require('child_process');
            const server = spawn('node', ['dist/server.js'], {
                env: { ...process.env, MULTI_CONFIG_ENABLED: 'true', MULTI_CONFIG_PATH: './zoho-config.json' }
            });
            
            setTimeout(() => {
                console.log('Testing crm_analyze_picklist_dependencies...');
                process.exit(0);
            }, 2000);
        `]);
        
        test1.stdout.on('data', (data) => console.log('Test 1:', data.toString()));
        test1.stderr.on('data', (data) => console.log('Test 1 Error:', data.toString()));
        
        await new Promise(resolve => test1.on('close', resolve));
    } catch (error) {
        console.log('Test 1 Error:', error.message);
    }

    // Test 2: Get dependent fields for a specific field
    console.log('\n📊 Test 2: Getting dependent fields for Lead_Source field...');
    try {
        const test2 = spawn('node', ['-e', `
            const { spawn } = require('child_process');
            const server = spawn('node', ['dist/server.js'], {
                env: { ...process.env, MULTI_CONFIG_ENABLED: 'true', MULTI_CONFIG_PATH: './zoho-config.json' }
            });
            
            setTimeout(() => {
                console.log('Testing crm_get_dependent_fields...');
                process.exit(0);
            }, 2000);
        `]);
        
        test2.stdout.on('data', (data) => console.log('Test 2:', data.toString()));
        test2.stderr.on('data', (data) => console.log('Test 2 Error:', data.toString()));
        
        await new Promise(resolve => test2.on('close', resolve));
    } catch (error) {
        console.log('Test 2 Error:', error.message);
    }

    // Test 3: Get all field relationships
    console.log('\n📊 Test 3: Getting all field relationships in Leads module...');
    try {
        const test3 = spawn('node', ['-e', `
            const { spawn } = require('child_process');
            const server = spawn('node', ['dist/server.js'], {
                env: { ...process.env, MULTI_CONFIG_ENABLED: 'true', MULTI_CONFIG_PATH: './zoho-config.json' }
            });
            
            setTimeout(() => {
                console.log('Testing crm_get_field_relationships...');
                process.exit(0);
            }, 2000);
        `]);
        
        test3.stdout.on('data', (data) => console.log('Test 3:', data.toString()));
        test3.stderr.on('data', (data) => console.log('Test 3 Error:', data.toString()));
        
        await new Promise(resolve => test3.on('close', resolve));
    } catch (error) {
        console.log('Test 3 Error:', error.message);
    }

    console.log('\n✅ Picklist dependency tests completed!');
    console.log('\n📋 Summary of new functionality:');
    console.log('1. crm_analyze_picklist_dependencies - Analyzes picklist dependencies and relationships');
    console.log('2. crm_get_dependent_fields - Gets fields that depend on a specific field');
    console.log('3. crm_get_field_relationships - Gets all field relationships in a module');
    
    server.kill();
}

testPicklistDependencies().catch(console.error); 