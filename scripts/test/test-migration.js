const { spawn } = require('child_process');
const path = require('path');

// Test the migration by running the MCP server and testing configuration tools
async function testMigration() {
  console.log('🧪 Testing Migration - Phase 2: Testing and Validation');
  console.log('=====================================================');

  // Test 1: Check if the server builds successfully
  console.log('\n1. Testing Build Process...');
  try {
    // Use npx or npm.cmd on Windows
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const buildProcess = spawn(npmCommand, ['run', 'build'], { 
      stdio: 'pipe',
      shell: true 
    });
    
    buildProcess.stdout.on('data', (data) => {
      console.log('Build output:', data.toString());
    });
    
    buildProcess.stderr.on('data', (data) => {
      console.log('Build errors:', data.toString());
    });
    
    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build successful');
          resolve();
        } else {
          console.log('❌ Build failed');
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });
  } catch (error) {
    console.log('❌ Build test failed:', error.message);
    console.log('Continuing with other tests...');
  }

  // Test 2: Check configuration files
  console.log('\n2. Testing Configuration Files...');
  const fs = require('fs');
  
  // Check .env file
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const hasLegacyConfig = envContent.includes('ZOHO_CLIENT_ID');
    const hasEdgeStoneConfig = envContent.includes('EDGESTONE_ZOHO_CLIENT_ID');
    const hasMultiConfig = envContent.includes('MULTI_CONFIG_ENABLED=true');
    
    console.log('✅ .env file exists');
    console.log(`   Legacy config: ${hasLegacyConfig ? '✅' : '❌'}`);
    console.log(`   EdgeStone config: ${hasEdgeStoneConfig ? '✅' : '❌'}`);
    console.log(`   Multi-config enabled: ${hasMultiConfig ? '✅' : '❌'}`);
  } else {
    console.log('❌ .env file missing');
  }

  // Check zoho-config.json
  if (fs.existsSync('zoho-config.json')) {
    const configContent = JSON.parse(fs.readFileSync('zoho-config.json', 'utf8'));
    const hasEdgeStoneEnv = configContent.environments?.edgestone;
    const hasMagEnv = configContent.environments?.mag;
    const currentEnv = configContent.currentEnvironment;
    
    console.log('✅ zoho-config.json exists');
    console.log(`   EdgeStone environment: ${hasEdgeStoneEnv ? '✅' : '❌'}`);
    console.log(`   Mag environment: ${hasMagEnv ? '✅' : '❌'}`);
    console.log(`   Current environment: ${currentEnv}`);
  } else {
    console.log('❌ zoho-config.json missing');
  }

  // Test 3: Validate configuration structure
  console.log('\n3. Validating Configuration Structure...');
  try {
    const configContent = JSON.parse(fs.readFileSync('zoho-config.json', 'utf8'));
    
    // Check EdgeStone configuration
    const edgestoneConfig = configContent.environments?.edgestone?.profiles?.main;
    if (edgestoneConfig) {
      const requiredFields = ['clientId', 'clientSecret', 'refreshToken', 'dataCenter', 'organizationId'];
      const missingFields = requiredFields.filter(field => !edgestoneConfig[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ EdgeStone configuration is complete');
      } else {
        console.log('❌ EdgeStone configuration missing fields:', missingFields);
      }
    } else {
      console.log('❌ EdgeStone configuration not found');
    }

    // Check Mag configuration
    const magConfig = configContent.environments?.mag?.profiles?.main;
    if (magConfig) {
      const requiredFields = ['clientId', 'clientSecret', 'refreshToken', 'dataCenter', 'organizationId'];
      const missingFields = requiredFields.filter(field => !magConfig[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ Mag configuration is complete');
      } else {
        console.log('❌ Mag configuration missing fields:', missingFields);
      }
    } else {
      console.log('❌ Mag configuration not found');
    }

  } catch (error) {
    console.log('❌ Configuration validation failed:', error.message);
  }

  // Test 4: Check migration guide
  console.log('\n4. Checking Migration Documentation...');
  if (fs.existsSync('MIGRATION_GUIDE.md')) {
    const guideContent = fs.readFileSync('MIGRATION_GUIDE.md', 'utf8');
    const hasPhases = guideContent.includes('Phase 1') && guideContent.includes('Phase 2');
    const hasChecklist = guideContent.includes('Migration Checklist');
    const hasRollback = guideContent.includes('Rollback Plan');
    
    console.log('✅ Migration guide exists');
    console.log(`   Migration phases: ${hasPhases ? '✅' : '❌'}`);
    console.log(`   Migration checklist: ${hasChecklist ? '✅' : '❌'}`);
    console.log(`   Rollback plan: ${hasRollback ? '✅' : '❌'}`);
  } else {
    console.log('❌ Migration guide missing');
  }

  // Test 5: Check if dist folder exists (build output)
  console.log('\n5. Checking Build Output...');
  if (fs.existsSync('dist')) {
    const distFiles = fs.readdirSync('dist');
    const hasServer = distFiles.includes('server.js');
    const hasAuth = distFiles.includes('auth');
    const hasClients = distFiles.includes('clients');
    const hasTools = distFiles.includes('tools');
    
    console.log('✅ dist folder exists');
    console.log(`   server.js: ${hasServer ? '✅' : '❌'}`);
    console.log(`   auth folder: ${hasAuth ? '✅' : '❌'}`);
    console.log(`   clients folder: ${hasClients ? '✅' : '❌'}`);
    console.log(`   tools folder: ${hasTools ? '✅' : '❌'}`);
  } else {
    console.log('❌ dist folder missing - build may have failed');
  }

  console.log('\n🎉 Migration Testing Complete!');
  console.log('\nNext Steps:');
  console.log('1. Test the MCP server with your MCP client');
  console.log('2. Verify all tools work correctly');
  console.log('3. Test environment switching');
  console.log('4. Proceed to Phase 3: Code Updates');
}

// Run the migration test
testMigration().catch(console.error); 