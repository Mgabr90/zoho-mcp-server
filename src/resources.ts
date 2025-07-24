/**
 * Enhanced MCP Server Resource Handler
 * 
 * This file provides enhanced resource handling for the Zoho MCP server
 * with proper distinction between tools and resources, plus action resources
 * for profile/environment switching.
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ConfigManagementTools } from './tools/config-tools.js';
import { ZohoCRMClient } from './lib/clients/crm-client.js';

export class EnhancedResourceHandler {
  constructor(
    private configTools: ConfigManagementTools,
    private crmClient: ZohoCRMClient
  ) {}

  /**
   * List all available resources with clear categorization
   */
  getResourceList() {
    return {
      resources: [
        // Data Resources (Read-only information)
        {
          uri: 'zoho://crm/modules',
          name: 'CRM Modules',
          description: 'Available CRM modules and their configurations',
          mimeType: 'application/json',
          category: 'data'
        },
        {
          uri: 'zoho://crm/modules/{module}/fields',
          name: 'CRM Module Fields',
          description: 'Field metadata for any CRM module (replace {module} with module name)',
          mimeType: 'application/json',
          category: 'data'
        },
        {
          uri: 'zoho://crm/modules/{module}/records',
          name: 'CRM Module Records',
          description: 'Browse records in any CRM module (replace {module} with module name)',
          mimeType: 'application/json',
          category: 'data'
        },
        {
          uri: 'zoho://crm/modules/{module}/timeline/{record_id}',
          name: 'CRM Record Timeline',
          description: 'Timeline history for any CRM record (replace {module} and {record_id})',
          mimeType: 'application/json',
          category: 'data'
        },
        {
          uri: 'zoho://books/organizations',
          name: 'Books Organizations', 
          description: 'Available Books organizations',
          mimeType: 'application/json',
          category: 'data'
        },
        
        // Configuration Resources (Current state information)
        {
          uri: 'zoho://config/profiles',
          name: 'Configuration Profiles',
          description: 'List of available configuration profiles',
          mimeType: 'application/json',
          category: 'config'
        },
        {
          uri: 'zoho://config/environments',
          name: 'Configuration Environments',
          description: 'List of available environments',
          mimeType: 'application/json',
          category: 'config'
        },
        {
          uri: 'zoho://config/status',
          name: 'Configuration Status',
          description: 'Current configuration status and active profile',
          mimeType: 'application/json',
          category: 'config'
        },
        
        // Action Resources (Tool shortcuts via resources)
        {
          uri: 'zoho://action/switch_profile',
          name: 'Switch Profile Action',
          description: 'Switch to a different profile (requires ?profile=name parameter)',
          mimeType: 'application/json',
          category: 'action'
        },
        {
          uri: 'zoho://action/switch_environment',
          name: 'Switch Environment Action',
          description: 'Switch to a different environment (requires ?environment=name parameter)',
          mimeType: 'application/json',
          category: 'action'
        }
      ]
    };
  }

  /**
   * Handle resource read requests with enhanced functionality
   */
  async handleResourceRead(uri: string) {
    try {
      // Parse URI for action resources with parameters
      if (uri.includes('?')) {
        const [baseUri, queryString] = uri.split('?');
        const params = new URLSearchParams(queryString);
        
        switch (baseUri) {
          case 'zoho://action/switch_profile':
            const profileName = params.get('profile');
            if (!profileName) {
              throw new McpError(ErrorCode.InvalidRequest, 'Profile parameter required: ?profile=name');
            }
            const switchResult = await this.configTools.switchProfile(profileName);
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    action: 'switch_profile',
                    result: switchResult,
                    timestamp: new Date().toISOString()
                  }, null, 2)
                }
              ]
            };
            
          case 'zoho://action/switch_environment':
            const envName = params.get('environment');
            if (!envName) {
              throw new McpError(ErrorCode.InvalidRequest, 'Environment parameter required: ?environment=name');
            }
            const switchEnvResult = await this.configTools.switchEnvironment(envName);
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    action: 'switch_environment',
                    result: switchEnvResult,
                    timestamp: new Date().toISOString()
                  }, null, 2)
                }
              ]
            };
        }
      }
      
      // Handle module-generic resources with pattern matching
      if (uri.startsWith('zoho://crm/modules/') && !uri.endsWith('/modules')) {
        return await this.handleCRMModuleResource(uri);
      }
      
      // Handle standard resources
      switch (uri) {
        case 'zoho://crm/modules':
          const modules = await this.crmClient.getModules();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  type: 'data_resource',
                  data: modules,
                  timestamp: new Date().toISOString(),
                  count: modules.length
                }, null, 2)
              }
            ]
          };
          
        case 'zoho://books/organizations':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  type: 'data_resource',
                  message: 'Books organizations endpoint would return available organizations',
                  note: 'This requires additional API implementation',
                  timestamp: new Date().toISOString()
                }, null, 2)
              }
            ]
          };
          
        case 'zoho://config/profiles':
          const profilesResult = await this.configTools.listProfiles();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  type: 'config_resource',
                  data: profilesResult,
                  timestamp: new Date().toISOString()
                }, null, 2)
              }
            ]
          };
          
        case 'zoho://config/environments':
          const environmentsResult = await this.configTools.listEnvironments();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  type: 'config_resource',
                  data: environmentsResult,
                  timestamp: new Date().toISOString()
                }, null, 2)
              }
            ]
          };
          
        case 'zoho://config/status':
          const statusResult = await this.configTools.getStatus();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  type: 'config_resource',
                  data: statusResult,
                  timestamp: new Date().toISOString()
                }, null, 2)
              }
            ]
          };
          
        default:
          throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
      }
    } catch (error: any) {
      console.error(`Error reading resource ${uri}:`, error);
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(ErrorCode.InternalError, `Resource read failed: ${error.message}`);
    }
  }

  /**
   * Handle module-generic CRM resources
   * Supports patterns like:
   * - zoho://crm/modules/{module}/fields
   * - zoho://crm/modules/{module}/records
   * - zoho://crm/modules/{module}/timeline/{record_id}
   */
  private async handleCRMModuleResource(uri: string) {
    const pathParts = uri.replace('zoho://crm/modules/', '').split('/');
    const moduleName = pathParts[0];
    
    if (!moduleName) {
      throw new McpError(ErrorCode.InvalidRequest, 'Module name required in URI path');
    }

    try {
      switch (pathParts.length) {
        case 2: // zoho://crm/modules/{module}/fields or /records
          const resourceType = pathParts[1];
          
          if (resourceType === 'fields') {
            const fields = await this.crmClient.getFields(moduleName);
            return {
              contents: [{
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  type: 'module_fields',
                  module: moduleName,
                  fields: fields,
                  count: fields.length,
                  timestamp: new Date().toISOString()
                }, null, 2)
              }]
            };
          }
          
          if (resourceType === 'records') {
            const records = await this.crmClient.getRecords(moduleName, { per_page: 10 });
            return {
              contents: [{
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  type: 'module_records',
                  module: moduleName,
                  records: records.data || [],
                  info: records.info || {},
                  timestamp: new Date().toISOString()
                }, null, 2)
              }]
            };
          }
          
          throw new McpError(ErrorCode.InvalidRequest, `Unsupported resource type: ${resourceType}`);

        case 3: // zoho://crm/modules/{module}/timeline/{record_id}
          if (pathParts[1] !== 'timeline') {
            throw new McpError(ErrorCode.InvalidRequest, 'Only timeline resources supported for 3-part paths');
          }
          
          const recordId = pathParts[2];
          const timeline = await this.crmClient.getTimeline(moduleName, recordId, { per_page: 20 });
          
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                type: 'record_timeline',
                module: moduleName,
                record_id: recordId,
                timeline: timeline.__timeline || [],
                info: timeline.info || {},
                timestamp: new Date().toISOString()
              }, null, 2)
            }]
          };

        default:
          throw new McpError(ErrorCode.InvalidRequest, 'Invalid CRM module resource path');
      }
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `CRM module resource failed: ${error.message}`);
    }
  }
}