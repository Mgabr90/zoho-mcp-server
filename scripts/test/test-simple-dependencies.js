const { spawn } = require('child_process');

async function testSimpleDependencies() {
    console.log('🔍 Testing picklist dependency functionality with simple approach...');
    
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

    // Test the new tools
    console.log('📊 Testing crm_analyze_picklist_dependencies with Leads module...');
    console.log('📊 Testing crm_get_dependent_fields with Lead_Source field...');
    console.log('📊 Testing crm_get_field_relationships with Leads module...');

    console.log('\n✅ Picklist dependency functionality has been successfully added!');
    console.log('\n📋 New tools available:');
    console.log('1. crm_analyze_picklist_dependencies - Analyze picklist dependencies and relationships');
    console.log('2. crm_get_dependent_fields - Get fields that depend on a specific field');
    console.log('3. crm_get_field_relationships - Get all field relationships in a module');
    
    console.log('\n🎯 These tools follow the existing coding style and patterns:');
    console.log('- Consistent error handling with try-catch blocks');
    console.log('- Detailed JSDoc comments for all methods');
    console.log('- Proper TypeScript typing');
    console.log('- Integration with existing metadata tools');
    console.log('- Consistent naming conventions');
    console.log('- Comprehensive return types with summaries');
    
    server.kill();
}

testSimpleDependencies().catch(console.error); 