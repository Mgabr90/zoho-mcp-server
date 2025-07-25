/**
 * CRM Modules Resource
 * Provides access to available CRM modules and their configurations
 */

import { ZohoCRMClient } from '../lib/clients/crm-client.js';

export class CRMModulesResource {
  constructor(private crmClient: ZohoCRMClient) {}

  async getModules() {
    try {
      const modules = await this.crmClient.getModules();
      return {
        name: 'CRM Modules',
        description: 'Available CRM modules and their configurations',
        data: modules,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch CRM modules: ${error.message}`);
    }
  }

  async getModuleFields(moduleName: string) {
    try {
      const fields = await this.crmClient.getFields(moduleName);
      return {
        name: `${moduleName} Fields`,
        description: `Field definitions for ${moduleName} module`,
        data: fields,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch ${moduleName} fields: ${error.message}`);
    }
  }
}