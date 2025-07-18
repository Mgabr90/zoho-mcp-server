#!/usr/bin/env node

/**
 * MCP Tools Test Runner
 * 
 * This script demonstrates the comprehensive testing capabilities
 * for the Zoho MCP Server tools, following MCP best practices.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}${description}${colors.reset}`);
  log(`${colors.yellow}Running: ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    log(`${colors.green}✅ Success${colors.reset}`);
    return { success: true, output };
  } catch (error) {
    log(`${colors.red}❌ Failed${colors.reset}`);
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

function displayTestSummary() {
  log('\n' + '='.repeat(60), 'bright');
  log('MCP Tools Testing Summary', 'bright');
  log('='.repeat(60), 'bright');
  
  log('\n📋 Test Categories:', 'cyan');
  log('• Functional Testing - Tool execution and parameter validation');
  log('• Security Testing - Input sanitization and attack prevention');
  log('• Performance Testing - Load handling and resource management');
  log('• Integration Testing - End-to-end tool workflows');
  log('• Error Handling - Proper error reporting and cleanup');
  
  log('\n🔧 Available Test Commands:', 'yellow');
  log('npm test                    - Run all tests');
  log('npm run test:unit          - Unit tests only');
  log('npm run test:integration   - Integration tests only');
  log('npm run test:security      - Security tests only');
  log('npm run test:performance   - Performance tests only');
  log('npm run test:coverage      - Tests with coverage report');
  log('npm run test:watch         - Watch mode for development');
  
  log('\n📊 Test Coverage Areas:', 'cyan');
  log('• Input validation against JSON Schema');
  log('• Path traversal and command injection protection');
  log('• XSS and SQL injection prevention');
  log('• Rate limiting and concurrent request handling');
  log('• Memory leak prevention and resource cleanup');
  log('• Tool annotation accuracy validation');
  log('• Error message sanitization');
  
  log('\n🛡️ Security Validations:', 'green');
  log('• Parameter type and range validation');
  log('• Required parameter enforcement');
  log('• File path character sanitization');
  log('• Shell metacharacter filtering');
  log('• HTML entity and script injection blocking');
  log('• SQL injection attempt detection');
  log('• Authentication and authorization checks');
  
  log('\n⚡ Performance Benchmarks:', 'magenta');
  log('• Concurrent tool call handling (10+ requests)');
  log('• Large dataset processing (200+ records)');
  log('• Response time optimization (< 3 seconds)');
  log('• Memory usage monitoring (< 50MB increase)');
  log('• Rate limiting enforcement');
  log('• Timeout handling (5-10 seconds)');
  log('• Resource cleanup verification');
  
  log('\n📝 Test Documentation:', 'blue');
  log('• Comprehensive test documentation in docs/TESTING.md');
  log('• MCP specification compliance validation');
  log('• Best practices implementation');
  log('• Continuous integration ready');
  
  log('\n' + '='.repeat(60), 'bright');
}

function runQuickValidation() {
  log('\n🔍 Running Quick Validation Tests...', 'cyan');
  
  // Check if test files exist
  const testFiles = [
    'tests/unit/security-tools.test.ts',
    'tests/unit/performance-tools.test.ts',
    'tests/integration/tools-integration.test.ts',
    'test-config.json',
    'docs/TESTING.md'
  ];
  
  let allFilesExist = true;
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file}`, 'red');
      allFilesExist = false;
    }
  });
  
  if (allFilesExist) {
    log('\n✅ All test infrastructure files are present', 'green');
  } else {
    log('\n❌ Some test files are missing', 'red');
  }
  
  // Check package.json scripts
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const testScripts = [
    'test:unit',
    'test:integration', 
    'test:security',
    'test:performance',
    'test:coverage'
  ];
  
  log('\n📦 Package.json Test Scripts:', 'cyan');
  testScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      log(`✅ ${script}`, 'green');
    } else {
      log(`❌ ${script}`, 'red');
    }
  });
}

function main() {
  log('🚀 MCP Tools Test Runner', 'bright');
  log('Comprehensive testing for Zoho MCP Server tools', 'cyan');
  
  // Run quick validation
  runQuickValidation();
  
  // Display test summary
  displayTestSummary();
  
  log('\n💡 Next Steps:', 'yellow');
  log('1. Run "npm test" to execute all tests');
  log('2. Run "npm run test:security" for security validation');
  log('3. Run "npm run test:performance" for performance testing');
  log('4. Check docs/TESTING.md for detailed documentation');
  log('5. Review test coverage with "npm run test:coverage"');
  
  log('\n🎯 Testing follows MCP best practices:', 'green');
  log('• Functional testing with valid/invalid inputs');
  log('• Security testing for input sanitization');
  log('• Performance testing under load');
  log('• Error handling and resource cleanup');
  log('• Tool annotation validation');
  
  log('\n✨ Ready for comprehensive MCP tools testing!', 'bright');
}

if (require.main === module) {
  main();
}

module.exports = { runQuickValidation, displayTestSummary }; 