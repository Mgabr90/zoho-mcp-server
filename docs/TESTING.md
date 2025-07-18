# MCP Tools Testing Guide

This document outlines the comprehensive testing strategy for the Zoho MCP Server tools, following the [Model Context Protocol testing best practices](https://modelcontextprotocol.io/docs/concepts/tools#testing-tools).

## Overview

Our testing strategy covers all aspects recommended by the MCP specification:

- **Functional Testing**: Verify tools execute correctly with valid inputs and handle invalid inputs appropriately
- **Integration Testing**: Test tool interaction with external systems using both real and mocked dependencies
- **Security Testing**: Validate authentication, authorization, input sanitization, and rate limiting
- **Performance Testing**: Check behavior under load, timeout handling, and resource cleanup
- **Error Handling**: Ensure tools properly report errors through the MCP protocol and clean up resources

## Test Structure

```
tests/
├── unit/
│   ├── auth-manager.test.ts          # Authentication tests
│   ├── books-items-tools.test.ts     # Books tools unit tests
│   ├── crm-tasks-tools.test.ts       # CRM tools unit tests
│   ├── sync-tools.test.ts            # Sync tools unit tests
│   ├── security-tools.test.ts        # Security validation tests
│   └── performance-tools.test.ts     # Performance and load tests
├── integration/
│   └── tools-integration.test.ts     # End-to-end tool testing
└── setup.ts                          # Test configuration
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Security tests only
npm run test:security

# Performance tests only
npm run test:performance

# With coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Test Categories

### 1. Functional Testing

Tests verify that tools:
- Execute correctly with valid parameters
- Handle invalid inputs appropriately
- Return expected data structures
- Follow MCP protocol specifications

**Key Test Areas:**
- Parameter validation against JSON Schema
- Required parameter enforcement
- Data type validation
- Range and constraint validation

**Example:**
```typescript
it('should validate input parameters against schema', async () => {
  const result = await server.server.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'books_get_customers',
      arguments: {
        page: -1, // Invalid page number
        per_page: 1000 // Invalid per_page
      }
    }
  });

  expect(result.error).toBeDefined();
  expect(result.error.code).toBe(-32602); // Invalid params
});
```

### 2. Security Testing

Tests validate security measures including:

**Input Validation:**
- Parameter type validation
- Range and constraint validation
- Required parameter enforcement

**Path Traversal Protection:**
- Directory traversal prevention
- File path character validation
- URL encoding attack prevention

**Command Injection Protection:**
- Shell metacharacter sanitization
- Command injection attempt blocking
- Safe parameter handling

**XSS Protection:**
- HTML entity sanitization
- Script injection prevention
- Malicious payload blocking

**SQL Injection Protection:**
- SQL injection attempt detection
- Parameter sanitization
- Query injection prevention

**Example:**
```typescript
it('should prevent path traversal in file paths', async () => {
  const pathTraversalAttempts = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '....//....//....//etc/passwd'
  ];

  for (const path of pathTraversalAttempts) {
    const result = await server.server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'config_switch_environment',
        arguments: { environment: path }
      }
    });

    expect(result.error).toBeDefined();
  }
});
```

### 3. Performance Testing

Tests verify performance characteristics:

**Load Testing:**
- Concurrent tool call handling
- Large dataset processing
- Rapid successive calls

**Timeout Handling:**
- Slow external API responses
- Network timeouts
- Infinite loop prevention

**Memory Management:**
- Memory leak prevention
- Resource cleanup
- Memory usage monitoring

**Rate Limiting:**
- Rate limit enforcement
- Burst request handling
- Request queuing

**Example:**
```typescript
it('should handle concurrent tool calls efficiently', async () => {
  const concurrentRequests = 10;
  const requests = Array.from({ length: concurrentRequests }, (_, i) => ({
    jsonrpc: '2.0',
    id: i + 1,
    method: 'tools/call',
    params: {
      name: 'books_get_customers',
      arguments: { page: 1, per_page: 10 }
    }
  }));

  const startTime = Date.now();
  const results = await Promise.all(
    requests.map(req => server.server.handleRequest(req))
  );
  const endTime = Date.now();

  expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
  expect(results).toHaveLength(concurrentRequests);
});
```

### 4. Error Handling

Tests ensure proper error reporting:

**Error Structure:**
- Proper MCP error format
- Error content validation
- Error code consistency

**Error Sanitization:**
- Internal error hiding
- Sensitive information removal
- User-friendly error messages

**Resource Cleanup:**
- Connection cleanup
- Memory deallocation
- File handle closure

**Example:**
```typescript
it('should not expose internal errors to clients', async () => {
  jest.spyOn(server['booksClient'], 'getCustomers')
    .mockRejectedValue(new Error('Internal database error'));

  const result = await server.server.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'books_get_customers',
      arguments: { page: 1, per_page: 10 }
    }
  });

  expect(result.result.isError).toBe(true);
  expect(result.result.content[0].text).not.toContain('Internal database error');
  expect(result.result.content[0].text).toContain('Error');
});
```

### 5. Tool Annotations Validation

Tests verify tool annotation accuracy:

**readOnlyHint:**
- Read-only tools don't modify state
- Proper annotation for query tools
- Side effect validation

**destructiveHint:**
- Destructive tools properly marked
- Warning descriptions included
- Safe operation confirmation

**idempotentHint:**
- Idempotent operation validation
- Repeated call behavior
- State consistency

**Example:**
```typescript
it('should have accurate readOnlyHint annotations', async () => {
  const tools = await server.server.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  });

  const readOnlyTools = tools.result.tools.filter((tool: any) => 
    tool.annotations?.readOnlyHint === true
  );

  // Verify read-only tools don't modify state
  for (const tool of readOnlyTools) {
    const result = await server.server.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: tool.name,
        arguments: {}
      }
    });
    
    expect(result.result).toBeDefined();
  }
});
```

## Test Configuration

### Environment Setup

Tests use dedicated test configurations to avoid affecting production data:

```json
{
  "environments": {
    "test": {
      "clientId": "test_client_id",
      "clientSecret": "test_client_secret",
      "redirectUri": "http://localhost:3000/callback",
      "refreshToken": "test_refresh_token",
      "dataCenter": "com",
      "organizationId": "test_org_id",
      "scopes": ["ZohoCRM.modules.ALL", "ZohoBooks.fullaccess.all"]
    }
  },
  "currentEnvironment": "test",
  "autoSwitch": false
}
```

### Mocking Strategy

External dependencies are mocked to ensure:
- Test isolation
- Predictable behavior
- Fast execution
- No external API calls

```typescript
// Mock external dependencies
jest.mock('axios');
jest.mock('../../src/auth/oauth-manager.js');
jest.mock('../../src/clients/crm-client.js');
jest.mock('../../src/clients/books-client.js');
```

## Best Practices

### 1. Test Isolation
- Each test is independent
- No shared state between tests
- Proper cleanup after each test

### 2. Comprehensive Coverage
- All tool functions tested
- Edge cases covered
- Error scenarios validated

### 3. Realistic Test Data
- Valid but safe test data
- Realistic parameter values
- Appropriate data sizes

### 4. Performance Benchmarks
- Response time limits
- Memory usage constraints
- Concurrent request handling

### 5. Security Validation
- Input sanitization
- Authentication checks
- Authorization validation

## Continuous Integration

Tests are integrated into the CI/CD pipeline:

1. **Pre-commit hooks**: Run unit tests
2. **Pull request validation**: Full test suite
3. **Deployment verification**: Integration tests
4. **Security scanning**: Security test validation

## Monitoring and Metrics

Test results provide insights into:

- **Code Coverage**: Percentage of code tested
- **Performance Metrics**: Response times and resource usage
- **Security Posture**: Vulnerability detection
- **Reliability**: Error rate and recovery success

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout values for slow operations
2. **Memory Leaks**: Check resource cleanup in tests
3. **Mock Failures**: Verify mock implementations
4. **Environment Issues**: Check test configuration

### Debugging

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debugging
npm test -- --testNamePattern="should handle concurrent tool calls"

# Run tests with coverage
npm run test:coverage
```

## Contributing

When adding new tools:

1. Create unit tests for the tool
2. Add integration tests
3. Include security validation
4. Add performance benchmarks
5. Update documentation

Follow the existing test patterns and maintain consistency with the established testing strategy. 