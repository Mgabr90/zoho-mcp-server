/**
 * Configuration Status Resource
 * Provides access to current configuration and environment status
 */

import { ZohoConfigManager } from '../lib/utils/config-manager.js';

export class ConfigStatusResource {
  constructor(private configManager: ZohoConfigManager) {}

  async getStatus() {
    try {
      const status = this.configManager.getStatus();
      return {
        name: 'Configuration Status',
        description: 'Current MCP server configuration and environment status',
        data: status,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch configuration status: ${error.message}`);
    }
  }

  async getProfiles() {
    try {
      const profiles = this.configManager.listProfiles();
      return {
        name: 'Available Profiles',
        description: 'All configured Zoho profiles',
        data: profiles,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }
  }

  async getEnvironments() {
    try {
      const environments = this.configManager.listEnvironments();
      return {
        name: 'Available Environments',
        description: 'All configured environments',
        data: environments,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch environments: ${error.message}`);
    }
  }
}