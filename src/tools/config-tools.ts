import { z } from 'zod';
import { ZohoConfigManager } from '../utils/config-manager.js';
import { ZohoConfigProfile } from '../types/index.js';

export class ConfigManagementTools {
  private configManager: ZohoConfigManager;

  constructor(configManager: ZohoConfigManager) {
    this.configManager = configManager;
  }

  /**
   * List all available environments
   */
  async listEnvironments() {
    const environments = this.configManager.listEnvironments();
    const currentEnv = this.configManager.currentEnvironment;
    
    return {
      environments: environments.map(env => ({
        name: env,
        isActive: env === currentEnv,
        description: this.configManager.environments[env]?.description || ''
      })),
      currentEnvironment: currentEnv,
      totalEnvironments: environments.length
    };
  }

  /**
   * Switch to a different environment
   */
  async switchEnvironment(environmentName: string) {
    try {
      this.configManager.switchEnvironment(environmentName);
      const status = this.configManager.getStatus();
      
      return {
        success: true,
        message: `Switched to environment '${environmentName}'`,
        newEnvironment: environmentName,
        currentProfile: status.currentProfile,
        totalProfiles: status.totalProfiles
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List all profiles in the current environment
   */
  async listProfiles() {
    const profiles = this.configManager.listProfiles();
    const status = this.configManager.getStatus();
    
    return {
      profiles: profiles.map(profile => ({
        name: profile.name,
        description: profile.description || '',
        isActive: profile.isActive,
        dataCenter: profile.dataCenter,
        scopes: profile.scopes,
        hasOrganizationId: !!profile.organizationId,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      })),
      currentProfile: status.currentProfile,
      totalProfiles: profiles.length
    };
  }

  /**
   * Switch to a different profile within the current environment
   */
  async switchProfile(profileName: string) {
    try {
      this.configManager.switchProfile(profileName);
      const status = this.configManager.getStatus();
      
      return {
        success: true,
        message: `Switched to profile '${profileName}' in environment '${status.currentEnvironment}'`,
        newProfile: profileName,
        environment: status.currentEnvironment
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add a new profile to the current environment
   */
  async addProfile(profile: ZohoConfigProfile) {
    try {
      this.configManager.addProfile(profile);
      
      return {
        success: true,
        message: `Added profile '${profile.name}' to environment '${this.configManager.currentEnvironment}'`,
        profileName: profile.name,
        environment: this.configManager.currentEnvironment
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Remove a profile from the current environment
   */
  async removeProfile(profileName: string) {
    try {
      this.configManager.removeProfile(profileName);
      
      return {
        success: true,
        message: `Removed profile '${profileName}' from environment '${this.configManager.currentEnvironment}'`,
        removedProfile: profileName,
        environment: this.configManager.currentEnvironment
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update an existing profile
   */
  async updateProfile(profileName: string, updates: Partial<ZohoConfigProfile>) {
    try {
      this.configManager.updateProfile(profileName, updates);
      
      return {
        success: true,
        message: `Updated profile '${profileName}' in environment '${this.configManager.currentEnvironment}'`,
        profileName,
        environment: this.configManager.currentEnvironment,
        updatedFields: Object.keys(updates)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current configuration status
   */
  async getStatus() {
    const status = this.configManager.getStatus();
    const activeConfig = this.configManager.getActiveConfig();
    
    return {
      currentEnvironment: status.currentEnvironment,
      currentProfile: status.currentProfile,
      totalEnvironments: status.totalEnvironments,
      totalProfiles: status.totalProfiles,
      configPath: status.configPath,
      activeConfig: {
        clientId: activeConfig.clientId ? `${activeConfig.clientId.substring(0, 8)}...` : 'Not set',
        dataCenter: activeConfig.dataCenter,
        scopes: activeConfig.scopes,
        hasOrganizationId: !!activeConfig.organizationId
      }
    };
  }

  /**
   * Export current configuration to .env format
   */
  async exportToEnv(profileName?: string) {
    try {
      const envContent = this.configManager.exportToEnv(profileName);
      
      return {
        success: true,
        envContent,
        profileName: profileName || 'active',
        environment: this.configManager.currentEnvironment
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add a new environment
   */
  async addEnvironment(name: string, description?: string) {
    try {
      this.configManager.addEnvironment(name, description);
      
      return {
        success: true,
        message: `Added environment '${name}'`,
        environmentName: name,
        description
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Remove an environment
   */
  async removeEnvironment(name: string) {
    try {
      this.configManager.removeEnvironment(name);
      
      return {
        success: true,
        message: `Removed environment '${name}'`,
        removedEnvironment: name
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Zod schemas for the tools
export const ListEnvironmentsSchema = z.object({});

export const SwitchEnvironmentSchema = z.object({
  environmentName: z.string().describe('Name of the environment to switch to')
});

export const ListProfilesSchema = z.object({});

export const SwitchProfileSchema = z.object({
  profileName: z.string().describe('Name of the profile to switch to')
});

export const AddProfileSchema = z.object({
  name: z.string().describe('Name of the profile'),
  description: z.string().optional().describe('Description of the profile'),
  clientId: z.string().describe('Zoho Client ID'),
  clientSecret: z.string().describe('Zoho Client Secret'),
  redirectUri: z.string().describe('Redirect URI'),
  refreshToken: z.string().describe('Refresh Token'),
  dataCenter: z.string().describe('Data Center (com, eu, in, com.au, jp)'),
  scopes: z.array(z.string()).describe('API Scopes'),
  organizationId: z.string().optional().describe('Books Organization ID')
});

export const RemoveProfileSchema = z.object({
  profileName: z.string().describe('Name of the profile to remove')
});

export const UpdateProfileSchema = z.object({
  profileName: z.string().describe('Name of the profile to update'),
  updates: z.object({
    description: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    redirectUri: z.string().optional(),
    refreshToken: z.string().optional(),
    dataCenter: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    organizationId: z.string().optional()
  }).describe('Profile updates')
});

export const GetStatusSchema = z.object({});

export const ExportToEnvSchema = z.object({
  profileName: z.string().optional().describe('Name of the profile to export (defaults to active profile)')
});

export const AddEnvironmentSchema = z.object({
  name: z.string().describe('Name of the environment'),
  description: z.string().optional().describe('Description of the environment')
});

export const RemoveEnvironmentSchema = z.object({
  name: z.string().describe('Name of the environment to remove')
}); 