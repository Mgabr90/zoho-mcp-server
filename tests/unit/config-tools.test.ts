import { ConfigManagementTools } from '../../src/tools/config-tools';
import { ZohoConfigManager } from '../../src/lib/utils/config-manager';
import { ZohoBooksClient } from '../../src/lib/clients/books-client';
import { ZohoAuthManager } from '../../src/lib/auth/oauth-manager';
import { ZohoConfigProfile } from '../../src/lib/types';

jest.mock('../../src/lib/utils/config-manager');
jest.mock('../../src/lib/clients/books-client');
jest.mock('../../src/lib/auth/oauth-manager');

describe('ConfigManagementTools', () => {
  let configTools: ConfigManagementTools;
  let mockConfigManager: jest.Mocked<ZohoConfigManager>;
  let mockBooksClient: jest.Mocked<ZohoBooksClient>;
  let mockAuthManager: jest.Mocked<ZohoAuthManager>;

  const mockProfile: ZohoConfigProfile = {
    name: 'test-profile',
    description: 'Test profile',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/callback',
    refreshToken: 'test-refresh-token',
    dataCenter: 'com',
    scopes: ['ZohoCRM.modules.ALL', 'ZohoBooks.fullaccess.all'],
    organizationId: 'test-org-id',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    mockConfigManager = new ZohoConfigManager() as jest.Mocked<ZohoConfigManager>;
    mockBooksClient = new ZohoBooksClient(null as any, 'com', 'test-org') as jest.Mocked<ZohoBooksClient>;
    mockAuthManager = new ZohoAuthManager(null as any) as jest.Mocked<ZohoAuthManager>;
    
    configTools = new ConfigManagementTools(mockConfigManager);
    
    // Setup common mocks using Object.defineProperty
    Object.defineProperty(mockConfigManager, 'currentEnvironment', {
      get: jest.fn().mockReturnValue('development'),
      configurable: true
    });
    Object.defineProperty(mockConfigManager, 'environments', {
      get: jest.fn().mockReturnValue({
        development: { description: 'Development environment' },
        production: { description: 'Production environment' }
      }),
      configurable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listEnvironments', () => {
    it('should list all environments with current environment marked', async () => {
      mockConfigManager.listEnvironments.mockReturnValue(['development', 'production']);
      Object.defineProperty(mockConfigManager, 'currentEnvironment', {
        get: jest.fn().mockReturnValue('development'),
        configurable: true
      });

      const result = await configTools.listEnvironments();

      expect(result).toEqual({
        environments: [
          { name: 'development', isActive: true, description: 'Development environment' },
          { name: 'production', isActive: false, description: 'Production environment' }
        ],
        currentEnvironment: 'development',
        totalEnvironments: 2
      });
    });

    it('should handle empty environments list', async () => {
      mockConfigManager.listEnvironments.mockReturnValue([]);
      Object.defineProperty(mockConfigManager, 'currentEnvironment', {
        get: jest.fn().mockReturnValue(''),
        configurable: true
      });

      const result = await configTools.listEnvironments();

      expect(result).toEqual({
        environments: [],
        currentEnvironment: '',
        totalEnvironments: 0
      });
    });
  });

  describe('switchEnvironment', () => {
    it('should switch environment successfully', async () => {
      mockConfigManager.switchEnvironment.mockImplementation(() => {
        Object.defineProperty(mockConfigManager, 'currentEnvironment', {
          get: jest.fn().mockReturnValue('production'),
          configurable: true  
        });
      });
      mockConfigManager.getStatus.mockReturnValue({
        currentEnvironment: 'production',
        currentProfile: 'test-profile',
        totalEnvironments: 2,
        totalProfiles: 1,
        configPath: '/path/to/config'
      });

      const result = await configTools.switchEnvironment('production');

      expect(result).toEqual({
        success: true,
        message: "Switched to environment 'production'",
        newEnvironment: 'production',
        currentProfile: 'test-profile',
        totalProfiles: 1
      });
      expect(mockConfigManager.switchEnvironment).toHaveBeenCalledWith('production');
    });

    it('should handle environment switch errors', async () => {
      mockConfigManager.switchEnvironment.mockImplementation(() => {
        throw new Error('Environment not found');
      });

      const result = await configTools.switchEnvironment('nonexistent');

      expect(result).toEqual({
        success: false,
        error: 'Environment not found'
      });
    });
  });

  describe('listProfiles', () => {
    it('should list all profiles in current environment', async () => {
      const mockProfiles = [
        { ...mockProfile, isActive: true },
        { ...mockProfile, name: 'profile2', isActive: false }
      ];
      
      mockConfigManager.listProfiles.mockReturnValue(mockProfiles);
      mockConfigManager.getStatus.mockReturnValue({
        currentEnvironment: 'development',
        currentProfile: 'test-profile',
        totalEnvironments: 2,
        totalProfiles: 2,
        configPath: '/path/to/config'
      });

      const result = await configTools.listProfiles();

      expect(result).toEqual({
        profiles: [
          {
            name: 'test-profile',
            description: 'Test profile',
            isActive: true,
            dataCenter: 'com',
            scopes: ['ZohoCRM.modules.ALL', 'ZohoBooks.fullaccess.all'],
            hasOrganizationId: true,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          },
          {
            name: 'profile2',
            description: 'Test profile',
            isActive: false,
            dataCenter: 'com',
            scopes: ['ZohoCRM.modules.ALL', 'ZohoBooks.fullaccess.all'],
            hasOrganizationId: true,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ],
        currentProfile: 'test-profile',
        totalProfiles: 2
      });
    });
  });

  describe('switchProfile', () => {
    it('should switch profile successfully', async () => {
      mockConfigManager.switchProfile.mockImplementation(() => {});
      mockConfigManager.getStatus.mockReturnValue({
        currentEnvironment: 'development',
        currentProfile: 'new-profile',
        totalEnvironments: 2,
        totalProfiles: 2,
        configPath: '/path/to/config'
      });

      const result = await configTools.switchProfile('new-profile');

      expect(result).toEqual({
        success: true,
        message: "Switched to profile 'new-profile' in environment 'development'",
        newProfile: 'new-profile',
        environment: 'development'
      });
      expect(mockConfigManager.switchProfile).toHaveBeenCalledWith('new-profile');
    });

    it('should handle profile switch errors', async () => {
      mockConfigManager.switchProfile.mockImplementation(() => {
        throw new Error('Profile not found');
      });

      const result = await configTools.switchProfile('nonexistent');

      expect(result).toEqual({
        success: false,
        error: 'Profile not found'
      });
    });
  });

  describe('addProfile', () => {
    beforeEach(() => {
      (ZohoAuthManager as jest.MockedClass<typeof ZohoAuthManager>).mockImplementation(() => mockAuthManager);
      (ZohoBooksClient as jest.MockedClass<typeof ZohoBooksClient>).mockImplementation(() => mockBooksClient);
    });

    it('should add profile with Books scopes and valid organization ID', async () => {
      mockConfigManager.addProfile.mockImplementation(() => {});
      mockBooksClient.getCustomers.mockResolvedValue({
        data: [],
        info: { page: 1, per_page: 1, count: 0, more_records: false }
      });

      const result = await configTools.addProfile(mockProfile);

      expect(result).toEqual({
        success: true,
        message: "Added profile 'test-profile' to environment 'development'",
        profileName: 'test-profile',
        environment: 'development',
        info: 'Organization ID validated successfully'
      });
      expect(mockConfigManager.addProfile).toHaveBeenCalledWith(mockProfile);
    });

    it('should add profile with Books scopes but no organization ID', async () => {
      const profileWithoutOrgId = { ...mockProfile, organizationId: undefined };
      mockConfigManager.addProfile.mockImplementation(() => {});

      const result = await configTools.addProfile(profileWithoutOrgId);

      expect(result).toEqual({
        success: true,
        message: "Added profile 'test-profile' to environment 'development'",
        profileName: 'test-profile',
        environment: 'development',
        warning: 'Profile includes Books scopes but no organization ID was provided. Books functionality will be unavailable until you add a valid organization ID using config_update_profile.',
        suggestions: [
          'Find your organization ID in Zoho Books Settings > Organization Profile',
          'Update this profile with: config_update_profile',
          'Test Books functionality after adding organization ID'
        ]
      });
    });

    it('should add profile with invalid organization ID', async () => {
      mockConfigManager.addProfile.mockImplementation(() => {});
      mockBooksClient.getCustomers.mockRejectedValue(new Error('CompanyID/CompanyName not found'));

      const result = await configTools.addProfile(mockProfile);

      expect(result).toEqual({
        success: true,
        message: "Added profile 'test-profile' to environment 'development'",
        profileName: 'test-profile',
        environment: 'development',
        warning: "Organization ID 'test-org-id' is not associated with your Zoho Books account. Please verify the organization ID is correct.",
        suggestions: [
          'Verify organization ID in Zoho Books Settings > Organization Profile',
          'Update organization ID using: config_update_profile',
          'Ensure your Zoho account has access to this organization'
        ]
      });
    });

    it('should add profile without Books scopes', async () => {
      const profileWithoutBooks = { ...mockProfile, scopes: ['ZohoCRM.modules.ALL'] };
      mockConfigManager.addProfile.mockImplementation(() => {});

      const result = await configTools.addProfile(profileWithoutBooks);

      expect(result).toEqual({
        success: true,
        message: "Added profile 'test-profile' to environment 'development'",
        profileName: 'test-profile',
        environment: 'development'
      });
    });

    it('should handle profile addition errors', async () => {
      mockConfigManager.addProfile.mockImplementation(() => {
        throw new Error('Profile already exists');
      });

      const result = await configTools.addProfile(mockProfile);

      expect(result).toEqual({
        success: false,
        error: 'Profile already exists'
      });
    });
  });

  describe('removeProfile', () => {
    it('should remove profile successfully', async () => {
      mockConfigManager.removeProfile.mockImplementation(() => {});

      const result = await configTools.removeProfile('test-profile');

      expect(result).toEqual({
        success: true,
        message: "Removed profile 'test-profile' from environment 'development'",
        removedProfile: 'test-profile',
        environment: 'development'
      });
      expect(mockConfigManager.removeProfile).toHaveBeenCalledWith('test-profile');
    });

    it('should handle profile removal errors', async () => {
      mockConfigManager.removeProfile.mockImplementation(() => {
        throw new Error('Profile not found');
      });

      const result = await configTools.removeProfile('nonexistent');

      expect(result).toEqual({
        success: false,
        error: 'Profile not found'
      });
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      (ZohoAuthManager as jest.MockedClass<typeof ZohoAuthManager>).mockImplementation(() => mockAuthManager);
      (ZohoBooksClient as jest.MockedClass<typeof ZohoBooksClient>).mockImplementation(() => mockBooksClient);
    });

    it('should update profile with organization ID validation', async () => {
      const updates = { organizationId: 'new-org-id' };
      mockConfigManager.getProfile.mockReturnValue(mockProfile);
      mockConfigManager.updateProfile.mockImplementation(() => {});
      mockBooksClient.getCustomers.mockResolvedValue({
        data: [],
        info: { page: 1, per_page: 1, count: 0, more_records: false }
      });

      const result = await configTools.updateProfile('test-profile', updates);

      expect(result).toEqual({
        success: true,
        message: "Updated profile 'test-profile' in environment 'development'",
        profileName: 'test-profile',
        environment: 'development',
        updatedFields: ['organizationId'],
        info: 'Organization ID validated successfully'
      });
      expect(mockConfigManager.updateProfile).toHaveBeenCalledWith('test-profile', updates);
    });

    it('should update profile without organization ID validation', async () => {
      const updates = { description: 'Updated description' };
      mockConfigManager.getProfile.mockReturnValue(mockProfile);
      mockConfigManager.updateProfile.mockImplementation(() => {});

      const result = await configTools.updateProfile('test-profile', updates);

      expect(result).toEqual({
        success: true,
        message: "Updated profile 'test-profile' in environment 'development'",
        profileName: 'test-profile',
        environment: 'development',
        updatedFields: ['description']
      });
    });

    it('should handle profile not found error', async () => {
      mockConfigManager.getProfile.mockReturnValue(null);

      const result = await configTools.updateProfile('nonexistent', {});

      expect(result).toEqual({
        success: false,
        error: "Profile 'nonexistent' not found"
      });
    });

    it('should handle update errors', async () => {
      mockConfigManager.getProfile.mockReturnValue(mockProfile);
      mockConfigManager.updateProfile.mockImplementation(() => {
        throw new Error('Update failed');
      });

      const result = await configTools.updateProfile('test-profile', {});

      expect(result).toEqual({
        success: false,
        error: 'Update failed'
      });
    });
  });

  describe('getStatus', () => {
    it('should return current configuration status', async () => {
      mockConfigManager.getStatus.mockReturnValue({
        currentEnvironment: 'development',
        currentProfile: 'test-profile',
        totalEnvironments: 2,
        totalProfiles: 3,
        configPath: '/path/to/config'
      });
      mockConfigManager.getActiveConfig.mockReturnValue({
        clientId: 'test-client-id-12345',
        clientSecret: 'secret',
        redirectUri: 'http://localhost:3000',
        refreshToken: 'token',
        dataCenter: 'com',
        scopes: ['ZohoCRM.modules.ALL'],
        organizationId: 'org-123'
      });

      const result = await configTools.getStatus();

      expect(result).toEqual({
        currentEnvironment: 'development',
        currentProfile: 'test-profile',
        totalEnvironments: 2,
        totalProfiles: 3,
        configPath: '/path/to/config',
        activeConfig: {
          clientId: 'test-cli...',
          dataCenter: 'com',
          scopes: ['ZohoCRM.modules.ALL'],
          hasOrganizationId: true
        }
      });
    });
  });

  describe('exportToEnv', () => {
    it('should export configuration to env format', async () => {
      mockConfigManager.exportToEnv.mockReturnValue('ZOHO_CLIENT_ID=test\nZOHO_CLIENT_SECRET=secret');

      const result = await configTools.exportToEnv('test-profile');

      expect(result).toEqual({
        success: true,
        envContent: 'ZOHO_CLIENT_ID=test\nZOHO_CLIENT_SECRET=secret',
        profileName: 'test-profile',
        environment: 'development'
      });
      expect(mockConfigManager.exportToEnv).toHaveBeenCalledWith('test-profile');
    });

    it('should handle export errors', async () => {
      mockConfigManager.exportToEnv.mockImplementation(() => {
        throw new Error('Export failed');
      });

      const result = await configTools.exportToEnv();

      expect(result).toEqual({
        success: false,
        error: 'Export failed'
      });
    });
  });

  describe('addEnvironment', () => {
    it('should add environment successfully', async () => {
      mockConfigManager.addEnvironment.mockImplementation(() => {});

      const result = await configTools.addEnvironment('staging', 'Staging environment');

      expect(result).toEqual({
        success: true,
        message: "Added environment 'staging'",
        environmentName: 'staging',
        description: 'Staging environment'
      });
      expect(mockConfigManager.addEnvironment).toHaveBeenCalledWith('staging', 'Staging environment');
    });

    it('should handle environment addition errors', async () => {
      mockConfigManager.addEnvironment.mockImplementation(() => {
        throw new Error('Environment already exists');
      });

      const result = await configTools.addEnvironment('existing');

      expect(result).toEqual({
        success: false,
        error: 'Environment already exists'
      });
    });
  });

  describe('removeEnvironment', () => {
    it('should remove environment successfully', async () => {
      mockConfigManager.removeEnvironment.mockImplementation(() => {});

      const result = await configTools.removeEnvironment('staging');

      expect(result).toEqual({
        success: true,
        message: "Removed environment 'staging'",
        removedEnvironment: 'staging'
      });
      expect(mockConfigManager.removeEnvironment).toHaveBeenCalledWith('staging');
    });

    it('should handle environment removal errors', async () => {
      mockConfigManager.removeEnvironment.mockImplementation(() => {
        throw new Error('Environment not found');
      });

      const result = await configTools.removeEnvironment('nonexistent');

      expect(result).toEqual({
        success: false,
        error: 'Environment not found'
      });
    });
  });
});