import fs from 'fs';
import path from 'path';
import { 
  ZohoConfig, 
  ZohoConfigProfile, 
  MultiConfigEnvironment, 
  ConfigurationManager 
} from '../types/index.js';

export class ZohoConfigManager implements ConfigurationManager {
  private _currentEnvironment: string = 'default';
  private _environments: Record<string, MultiConfigEnvironment> = {};
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'zoho-config.json');
    this.loadConfiguration();
  }

  get currentEnvironment(): string {
    return this._currentEnvironment;
  }

  get environments(): Record<string, MultiConfigEnvironment> {
    return this._environments;
  }

  /**
   * Load configuration from file or environment variables
   */
  private loadConfiguration(): void {
    // Try to load from JSON file first
    if (fs.existsSync(this.configPath)) {
      try {
        const configData = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this._environments = configData.environments || {};
        this._currentEnvironment = configData.currentEnvironment || 'default';
      } catch (error) {
        console.warn('Failed to load configuration file, using environment variables');
        this.loadFromEnvironment();
      }
    } else {
      this.loadFromEnvironment();
    }

    // Ensure default environment exists
    if (!this._environments.default) {
      this._environments.default = {
        name: 'default',
        description: 'Default environment',
        activeProfile: 'main',
        profiles: {
          main: this.createProfileFromEnvironment()
        }
      };
    }
  }

  /**
   * Load configuration from environment variables (legacy support)
   */
  private loadFromEnvironment(): void {
    const profile = this.createProfileFromEnvironment();
    
    this._environments.default = {
      name: 'default',
      description: 'Default environment from .env file',
      activeProfile: 'main',
      profiles: {
        main: profile
      }
    };
  }

  /**
   * Create a profile from environment variables
   */
  private createProfileFromEnvironment(): ZohoConfigProfile {
    // Use EdgeStone configuration (primary) or Mag configuration (fallback)
    const clientId = process.env.EDGESTONE_ZOHO_CLIENT_ID || process.env.MAG_ZOHO_CLIENT_ID || '';
    const clientSecret = process.env.EDGESTONE_ZOHO_CLIENT_SECRET || process.env.MAG_ZOHO_CLIENT_SECRET || '';
    const redirectUri = process.env.EDGESTONE_ZOHO_REDIRECT_URI || process.env.MAG_ZOHO_REDIRECT_URI || 'http://localhost:3000/callback';
    const refreshToken = process.env.EDGESTONE_ZOHO_REFRESH_TOKEN || process.env.MAG_ZOHO_REFRESH_TOKEN || '';
    const dataCenter = process.env.EDGESTONE_ZOHO_DATA_CENTER || process.env.MAG_ZOHO_DATA_CENTER || 'com';
    const scopes = (process.env.EDGESTONE_ZOHO_SCOPES || process.env.MAG_ZOHO_SCOPES || '').split(',').filter(s => s.trim());
    const organizationId = process.env.EDGESTONE_ZOHO_BOOKS_ORGANIZATION_ID || process.env.MAG_ZOHO_BOOKS_ORGANIZATION_ID;

    return {
      name: 'main',
      description: 'Main configuration from environment variables (EdgeStone preferred, Mag fallback)',
      clientId,
      clientSecret,
      redirectUri,
      refreshToken,
      dataCenter,
      scopes,
      organizationId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get the currently active configuration
   */
  getActiveConfig(): ZohoConfig {
    const environment = this._environments[this._currentEnvironment];
    if (!environment) {
      throw new Error(`Environment '${this._currentEnvironment}' not found`);
    }

    const profile = environment.profiles[environment.activeProfile];
    if (!profile) {
      throw new Error(`Profile '${environment.activeProfile}' not found in environment '${this._currentEnvironment}'`);
    }

    return {
      clientId: profile.clientId,
      clientSecret: profile.clientSecret,
      redirectUri: profile.redirectUri,
      refreshToken: profile.refreshToken,
      dataCenter: profile.dataCenter,
      scopes: profile.scopes,
      organizationId: profile.organizationId
    };
  }

  /**
   * Switch to a different environment
   */
  switchEnvironment(environmentName: string): void {
    if (!this._environments[environmentName]) {
      throw new Error(`Environment '${environmentName}' not found`);
    }
    this._currentEnvironment = environmentName;
    this.saveConfiguration();
  }

  /**
   * Switch to a different profile within the current environment
   */
  switchProfile(profileName: string): void {
    const environment = this._environments[this._currentEnvironment];
    if (!environment) {
      throw new Error(`Environment '${this._currentEnvironment}' not found`);
    }
    if (!environment.profiles[profileName]) {
      throw new Error(`Profile '${profileName}' not found in environment '${this._currentEnvironment}'`);
    }
    environment.activeProfile = profileName;
    this.saveConfiguration();
  }

  /**
   * Add a new profile to the current environment
   */
  addProfile(profile: ZohoConfigProfile): void {
    const environment = this._environments[this._currentEnvironment];
    if (!environment) {
      throw new Error(`Environment '${this._currentEnvironment}' not found`);
    }
    
    profile.updatedAt = new Date().toISOString();
    if (!profile.createdAt) {
      profile.createdAt = new Date().toISOString();
    }
    
    environment.profiles[profile.name] = profile;
    this.saveConfiguration();
  }

  /**
   * Remove a profile from the current environment
   */
  removeProfile(profileName: string): void {
    const environment = this._environments[this._currentEnvironment];
    if (!environment) {
      throw new Error(`Environment '${this._currentEnvironment}' not found`);
    }
    
    if (environment.activeProfile === profileName) {
      throw new Error(`Cannot remove active profile '${profileName}'. Switch to another profile first.`);
    }
    
    delete environment.profiles[profileName];
    this.saveConfiguration();
  }

  /**
   * Update an existing profile
   */
  updateProfile(profileName: string, updates: Partial<ZohoConfigProfile>): void {
    const environment = this._environments[this._currentEnvironment];
    if (!environment) {
      throw new Error(`Environment '${this._currentEnvironment}' not found`);
    }
    
    if (!environment.profiles[profileName]) {
      throw new Error(`Profile '${profileName}' not found in environment '${this._currentEnvironment}'`);
    }
    
    environment.profiles[profileName] = {
      ...environment.profiles[profileName],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveConfiguration();
  }

  /**
   * List all profiles in the current environment
   */
  listProfiles(): ZohoConfigProfile[] {
    const environment = this._environments[this._currentEnvironment];
    if (!environment) {
      return [];
    }
    
    return Object.values(environment.profiles).map(profile => ({
      ...profile,
      isActive: profile.name === environment.activeProfile
    }));
  }

  /**
   * List all available environments
   */
  listEnvironments(): string[] {
    return Object.keys(this._environments);
  }

  /**
   * Add a new environment
   */
  addEnvironment(name: string, description?: string): void {
    if (this._environments[name]) {
      throw new Error(`Environment '${name}' already exists`);
    }
    
    this._environments[name] = {
      name,
      description,
      activeProfile: 'main',
      profiles: {}
    };
    
    this.saveConfiguration();
  }

  /**
   * Remove an environment
   */
  removeEnvironment(name: string): void {
    if (name === 'default') {
      throw new Error('Cannot remove default environment');
    }
    
    if (this._currentEnvironment === name) {
      this._currentEnvironment = 'default';
    }
    
    delete this._environments[name];
    this.saveConfiguration();
  }

  /**
   * Save configuration to file
   */
  private saveConfiguration(): void {
    const configData = {
      currentEnvironment: this._currentEnvironment,
      environments: this._environments,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(configData, null, 2));
    } catch (error) {
      console.warn('Failed to save configuration file:', error);
    }
  }

  /**
   * Export configuration to .env format
   */
  exportToEnv(profileName?: string): string {
    const config = profileName 
      ? this.getProfileConfig(profileName)
      : this.getActiveConfig();
    
    const envName = this._currentEnvironment;
    const prefix = envName === 'edgestone' ? 'EDGESTONE_' : 
                   envName === 'mag' ? 'MAG_' : '';
    
    return `# ${envName.charAt(0).toUpperCase() + envName.slice(1)} OAuth Configuration
${prefix}ZOHO_CLIENT_ID=${config.clientId}
${prefix}ZOHO_CLIENT_SECRET=${config.clientSecret}
${prefix}ZOHO_REDIRECT_URI=${config.redirectUri}
${prefix}ZOHO_REFRESH_TOKEN=${config.refreshToken}
${prefix}ZOHO_DATA_CENTER=${config.dataCenter}
${prefix}ZOHO_SCOPES=${config.scopes.join(',')}
${config.organizationId ? `${prefix}ZOHO_BOOKS_ORGANIZATION_ID=${config.organizationId}` : ''}
`;
  }

  /**
   * Get configuration for a specific profile
   */
  private getProfileConfig(profileName: string): ZohoConfig {
    const environment = this._environments[this._currentEnvironment];
    if (!environment || !environment.profiles[profileName]) {
      throw new Error(`Profile '${profileName}' not found`);
    }
    
    const profile = environment.profiles[profileName];
    return {
      clientId: profile.clientId,
      clientSecret: profile.clientSecret,
      redirectUri: profile.redirectUri,
      refreshToken: profile.refreshToken,
      dataCenter: profile.dataCenter,
      scopes: profile.scopes,
      organizationId: profile.organizationId
    };
  }

  /**
   * Get a specific profile by name
   */
  getProfile(profileName: string): ZohoConfigProfile | null {
    const environment = this._environments[this._currentEnvironment];
    if (!environment || !environment.profiles[profileName]) {
      return null;
    }
    return environment.profiles[profileName];
  }

  /**
   * Get current configuration status
   */
  getStatus(): {
    currentEnvironment: string;
    currentProfile: string;
    totalEnvironments: number;
    totalProfiles: number;
    configPath: string;
  } {
    const environment = this._environments[this._currentEnvironment];
    return {
      currentEnvironment: this._currentEnvironment,
      currentProfile: environment?.activeProfile || 'none',
      totalEnvironments: Object.keys(this._environments).length,
      totalProfiles: Object.keys(environment?.profiles || {}).length,
      configPath: this.configPath
    };
  }
} 