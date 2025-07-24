import { z } from 'zod';
import { ZohoConfigManager } from '../lib/utils/config-manager.js';
import { ZohoConfigProfile } from '../lib/types/index.js';
import { ZohoBooksClient } from '../lib/clients/books-client.js';
import { ZohoAuthManager } from '../lib/auth/oauth-manager.js';

export class ConfigManagementTools {
  private configManager: ZohoConfigManager;

  constructor(configManager: ZohoConfigManager) {
    this.configManager = configManager;
  }

  /**
   * Validate organization ID by testing Books API access
   */
  private async validateOrganizationId(organizationId: string, profile: ZohoConfigProfile): Promise<{ valid: boolean; error?: string; warning?: string }> {
    try {
      // Create a temporary config for testing
      const testConfig = {
        clientId: profile.clientId,
        clientSecret: profile.clientSecret,
        redirectUri: profile.redirectUri,
        refreshToken: profile.refreshToken,
        dataCenter: profile.dataCenter,
        scopes: profile.scopes,
        organizationId
      };

      // Test Books API access with a lightweight operation
      const authManager = new ZohoAuthManager(testConfig);
      const booksClient = new ZohoBooksClient(authManager, testConfig.dataCenter, testConfig.organizationId!);
      await booksClient.getCustomers({ per_page: 1 });
      
      return { valid: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('CompanyID/CompanyName')) {
        return { 
          valid: false, 
          error: `Organization ID '${organizationId}' is not associated with your Zoho Books account. Please verify the organization ID is correct.` 
        };
      }
      
      if (errorMessage.includes('INVALID_TOKEN') || errorMessage.includes('Authentication')) {
        return { 
          valid: false, 
          warning: `Cannot validate organization ID due to authentication issues. The profile was created but Books functionality may not work until tokens are refreshed.` 
        };
      }
      
      return { 
        valid: false, 
        warning: `Cannot validate organization ID due to API error: ${errorMessage}. The profile was created but Books functionality should be tested.` 
      };
    }
  }

  /**
   * Check if profile has Books scopes
   */
  private hasBookScopes(scopes: string[]): boolean {
    return scopes.some(scope => scope.toLowerCase().includes('books'));
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
      const hasBooks = this.hasBookScopes(profile.scopes);
      let validationResult: { valid: boolean; error?: string; warning?: string } | null = null;
      
      // Always add the profile first
      this.configManager.addProfile(profile);
      
      // If profile has Books scopes, check organization ID
      if (hasBooks) {
        if (!profile.organizationId) {
          return {
            success: true,
            message: `Added profile '${profile.name}' to environment '${this.configManager.currentEnvironment}'`,
            profileName: profile.name,
            environment: this.configManager.currentEnvironment,
            warning: 'Profile includes Books scopes but no organization ID was provided. Books functionality will be unavailable until you add a valid organization ID using config_update_profile.',
            suggestions: [
              'Find your organization ID in Zoho Books Settings > Organization Profile',
              'Update this profile with: config_update_profile',
              'Test Books functionality after adding organization ID'
            ]
          };
        }
        
        // Validate organization ID if provided
        validationResult = await this.validateOrganizationId(profile.organizationId, profile);
        
        if (!validationResult.valid && validationResult.error) {
          return {
            success: true,
            message: `Added profile '${profile.name}' to environment '${this.configManager.currentEnvironment}'`,
            profileName: profile.name,
            environment: this.configManager.currentEnvironment,
            warning: validationResult.error,
            suggestions: [
              'Verify organization ID in Zoho Books Settings > Organization Profile',
              'Update organization ID using: config_update_profile',
              'Ensure your Zoho account has access to this organization'
            ]
          };
        }
        
        if (validationResult.warning) {
          return {
            success: true,
            message: `Added profile '${profile.name}' to environment '${this.configManager.currentEnvironment}'`,
            profileName: profile.name,
            environment: this.configManager.currentEnvironment,
            warning: validationResult.warning,
            suggestions: [
              'Test Books functionality after profile creation',
              'Refresh tokens if authentication issues persist'
            ]
          };
        }
      }
      
      return {
        success: true,
        message: `Added profile '${profile.name}' to environment '${this.configManager.currentEnvironment}'`,
        profileName: profile.name,
        environment: this.configManager.currentEnvironment,
        ...(hasBooks && validationResult?.valid ? { info: 'Organization ID validated successfully' } : {})
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
      // Get current profile to check scopes
      const currentProfile = this.configManager.getProfile(profileName);
      if (!currentProfile) {
        return {
          success: false,
          error: `Profile '${profileName}' not found`
        };
      }
      
      // Apply updates
      this.configManager.updateProfile(profileName, updates);
      
      // Get updated profile
      const updatedProfile = this.configManager.getProfile(profileName);
      const hasBooks = this.hasBookScopes(updatedProfile!.scopes);
      
      // If organization ID was updated and profile has Books scopes, validate it
      if (hasBooks && updates.organizationId) {
        const validationResult = await this.validateOrganizationId(updates.organizationId, updatedProfile!);
        
        if (!validationResult.valid && validationResult.error) {
          return {
            success: true,
            message: `Updated profile '${profileName}' in environment '${this.configManager.currentEnvironment}'`,
            profileName,
            environment: this.configManager.currentEnvironment,
            updatedFields: Object.keys(updates),
            warning: validationResult.error,
            suggestions: [
              'Verify organization ID in Zoho Books Settings > Organization Profile',
              'Test Books functionality to confirm the organization ID works'
            ]
          };
        }
        
        if (validationResult.warning) {
          return {
            success: true,
            message: `Updated profile '${profileName}' in environment '${this.configManager.currentEnvironment}'`,
            profileName,
            environment: this.configManager.currentEnvironment,
            updatedFields: Object.keys(updates),
            warning: validationResult.warning
          };
        }
        
        return {
          success: true,
          message: `Updated profile '${profileName}' in environment '${this.configManager.currentEnvironment}'`,
          profileName,
          environment: this.configManager.currentEnvironment,
          updatedFields: Object.keys(updates),
          info: 'Organization ID validated successfully'
        };
      }
      
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