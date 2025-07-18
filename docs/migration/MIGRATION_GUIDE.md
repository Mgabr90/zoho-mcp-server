# Gradual Migration Guide

This guide helps you migrate from the legacy Zoho configuration to the new multi-configuration system step by step.

## Current Configuration Structure

### 1. Legacy Configuration (ZOHO_* variables)
```env
ZOHO_CLIENT_ID=1000.ZXO2LP1R52XTB6IJBTH154V4602JLM
ZOHO_CLIENT_SECRET=4c002c24b0b809e16ea8ec7327bccf1fe36986dc81
ZOHO_REDIRECT_URI=http://localhost:3000/callback
ZOHO_REFRESH_TOKEN=1000.27f9203f9e0401fc69b548f984321a42.a3b22ef2ac8ca1f0c68db376c257cf7b
ZOHO_DATA_CENTER=com
ZOHO_BOOKS_ORGANIZATION_ID=869860407
ZOHO_SCOPES=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoBooks.fullaccess.all
```

### 2. EdgeStone Configuration (EDGESTONE_ZOHO_* variables)
```env
EDGESTONE_ZOHO_CLIENT_ID=1000.ZXO2LP1R52XTB6IJBTH154V4602JLM
EDGESTONE_ZOHO_CLIENT_SECRET=4c002c24b0b809e16ea8ec7327bccf1fe36986dc81
EDGESTONE_ZOHO_REDIRECT_URI=http://localhost:3000/callback
EDGESTONE_ZOHO_REFRESH_TOKEN=1000.27f9203f9e0401fc69b548f984321a42.a3b22ef2ac8ca1f0c68db376c257cf7b
EDGESTONE_ZOHO_DATA_CENTER=com
EDGESTONE_ZOHO_BOOKS_ORGANIZATION_ID=869860407
EDGESTONE_ZOHO_SCOPES=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoBooks.fullaccess.all
```

### 3. Multi-Configuration System
```env
MULTI_CONFIG_ENABLED=true
MULTI_CONFIG_ENVIRONMENT=edgestone
MULTI_CONFIG_PATH=./zoho-config.json
```

## Migration Phases

### Phase 1: Parallel Configuration (Current State)
- ✅ Legacy variables are maintained
- ✅ New EdgeStone variables are added
- ✅ Multi-configuration system is enabled
- ✅ All systems work simultaneously

### Phase 2: Testing and Validation
1. **Test Multi-Configuration System**
   ```bash
   # Test switching between environments
   curl -X POST http://localhost:3000/mcp/tools/call \
     -H "Content-Type: application/json" \
     -d '{
       "name": "config_switch_environment",
       "arguments": {
         "environment": "edgestone",
         "profile": "main"
       }
     }'
   ```

2. **Test Legacy Fallback**
   ```bash
   # Temporarily disable multi-config
   MULTI_CONFIG_ENABLED=false
   # Test that legacy variables still work
   ```

3. **Verify All Tools Work**
   - Test CRM tools
   - Test Books tools
   - Test sync tools
   - Test configuration management tools

### Phase 3: Code Updates
1. **Update any hardcoded references**
   - Search for `ZOHO_CLIENT_ID` in your codebase
   - Replace with `EDGESTONE_ZOHO_CLIENT_ID` or multi-config system
   - Update documentation

2. **Update deployment scripts**
   - CI/CD pipelines
   - Docker configurations
   - Environment setup scripts

### Phase 4: Cleanup
1. **Remove Legacy Variables**
   ```env
   # Remove these lines from .env
   ZOHO_CLIENT_ID=...
   ZOHO_CLIENT_SECRET=...
   ZOHO_REDIRECT_URI=...
   ZOHO_REFRESH_TOKEN=...
   ZOHO_DATA_CENTER=...
   ZOHO_BOOKS_ORGANIZATION_ID=...
   ZOHO_SCOPES=...
   ```

2. **Update Documentation**
   - Update README.md
   - Update deployment guides
   - Update API documentation

## Migration Checklist

### ✅ Phase 1: Setup
- [x] Legacy variables maintained
- [x] EdgeStone variables added
- [x] Multi-configuration system enabled
- [x] zoho-config.json created

### 🔄 Phase 2: Testing
- [ ] Test multi-configuration system
- [ ] Test legacy fallback
- [ ] Verify all MCP tools work
- [ ] Test environment switching
- [ ] Test profile switching

### 🔄 Phase 3: Code Updates
- [ ] Update hardcoded references
- [ ] Update deployment scripts
- [ ] Update documentation
- [ ] Update CI/CD pipelines

### 🔄 Phase 4: Cleanup
- [ ] Remove legacy variables
- [ ] Update final documentation
- [ ] Archive old configuration files

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**
   ```env
   # Disable multi-configuration
   MULTI_CONFIG_ENABLED=false
   ```

2. **Full Rollback**
   - Restore original .env file
   - Remove zoho-config.json
   - Disable multi-configuration features

## Benefits of Gradual Migration

1. **Zero Downtime**: Legacy system continues to work
2. **Risk Mitigation**: Easy rollback if issues arise
3. **Testing**: Can validate new system before removing old
4. **Flexibility**: Can switch between systems as needed

## Timeline Recommendation

- **Week 1**: Setup and initial testing
- **Week 2**: Comprehensive testing and validation
- **Week 3**: Code updates and documentation
- **Week 4**: Cleanup and final validation

## Monitoring During Migration

1. **Check Logs**
   ```bash
   tail -f logs/zoho-mcp-server.log
   ```

2. **Monitor API Calls**
   - Verify token refresh is working
   - Check for authentication errors
   - Monitor rate limiting

3. **Test Tools Regularly**
   - Run sync tools
   - Test CRM operations
   - Test Books operations

## Final State

After successful migration, your configuration will be:

```env
# EdgeStone OAuth Configuration
EDGESTONE_ZOHO_CLIENT_ID=...
EDGESTONE_ZOHO_CLIENT_SECRET=...
# ... other EdgeStone variables

# Multi-Configuration System
MULTI_CONFIG_ENABLED=true
MULTI_CONFIG_ENVIRONMENT=edgestone
MULTI_CONFIG_PATH=./zoho-config.json

# Mag Organization Configuration
MAG_ZOHO_CLIENT_ID=...
MAG_ZOHO_CLIENT_SECRET=...
# ... other Mag variables
```

The legacy `ZOHO_*` variables will be removed, and the system will rely entirely on the multi-configuration system with named configurations. 