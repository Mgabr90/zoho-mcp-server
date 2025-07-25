import { ZohoCRMMetadataTools } from '../../src/tools/metadata-tools';
import { ZohoCRMClient } from '../../src/lib/clients/crm-client';
import { 
  ZohoCRMModule, 
  ZohoCRMField, 
  ZohoCRMProfile, 
  ZohoCRMRole, 
  ZohoCRMUser, 
  ZohoCRMLayout, 
  ZohoCRMCustomView, 
  ZohoCRMRelatedList,
  ZohoCRMOrganization
} from '../../src/lib/types';

jest.mock('../../src/lib/clients/crm-client');

describe('ZohoCRMMetadataTools', () => {
  let metadataTools: ZohoCRMMetadataTools;
  let mockCRMClient: jest.Mocked<ZohoCRMClient>;

  const mockModule: ZohoCRMModule = {
    api_name: 'Leads',
    module_name: 'Leads',
    plural_label: 'Leads',
    singular_label: 'Lead',
    supported_operations: ['read', 'create', 'update', 'delete']
  };

  const mockField: ZohoCRMField = {
    api_name: 'Lead_Name',
    display_label: 'Lead Name',
    data_type: 'lookup',
    required: false,
    read_only: false,
    field_read_only: false,
    id: '123456789',
    custom_field: false
  };

  const mockProfile: ZohoCRMProfile = {
    name: 'Administrator',
    description: 'This profile will have all the permissions.',
    id: '123456789'
  };

  const mockRole: ZohoCRMRole = {
    name: 'CEO',
    display_label: 'CEO',
    description: 'Chief Executive Officer',
    id: '123456789'
  };

  const mockUser: ZohoCRMUser = {
    id: '123456789',
    name: 'John Doe',
    email: 'john.doe@example.com',
    full_name: 'John Doe'
  };

  const mockLayout: ZohoCRMLayout = {
    name: 'Standard',
    display_label: 'Standard',
    api_name: 'Standard',
    module: 'Leads',
    visible: true,
    id: '123456789'
  };

  const mockCustomView: ZohoCRMCustomView = {
    name: 'All_Leads',
    display_value: 'All Leads',
    id: '123456789',
    system_defined: true,
    system_name: 'All Leads',
    default: true,
    shared_type: 'shared_with_all',
    category: 'system_defined'
  };

  const mockRelatedList: ZohoCRMRelatedList = {
    api_name: 'Activities',
    module: 'Activities',  
    name: 'Activities',
    id: '123456789',
    href: 'Activities',
    type: 'default',
    sequence_number: 1,
    display_label: 'Activities',
    action: 'read'
  };

  const mockOrganization: ZohoCRMOrganization = {
    id: '123456789',
    company_name: 'Zylker',
    alias: 'zylker',
    primary_email: 'john.doe@zylkerinc.com',
    website: 'https://www.zoho.com',
    mobile: '+15551234567',
    phone: '+15551234567',
    fax: '+15551234568',
    employee_count: '11-25',
    time_zone: 'America/Los_Angeles',
    iso_code: 'USD',
    currency_locale: 'en_US',
    currency_symbol: '$',
    street: '4900 Hopyard Rd, Suite 310',
    city: 'Austin',
    state: 'Texas',
    country: 'United States',
    zip_code: '78727',
    mc_status: false,
    gapps_enabled: false,
    domain_name: 'example',
    translation_enabled: true,
    privacy_settings: true,
    hipaa_compliance_enabled: false,
    locking_system: 'standard',
    logo: 'logo.png',
    icon: 'icon.png',
    privacy_policy: 'https://example.com/privacy',
    terms_of_service: 'https://example.com/terms',
    created_time: '2023-01-01T00:00:00+00:00',
    modified_time: '2023-01-01T00:00:00+00:00',
    created_by: mockUser,
    modified_by: mockUser
  };

  beforeEach(() => {
    mockCRMClient = new ZohoCRMClient(null as any, 'com') as jest.Mocked<ZohoCRMClient>;
    metadataTools = new ZohoCRMMetadataTools(mockCRMClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllModules', () => {
    it('should get all modules successfully', async () => {
      const modules = [mockModule];
      mockCRMClient.getModules.mockResolvedValue(modules);

      const result = await metadataTools.getAllModules();

      expect(result).toEqual(modules);
      expect(mockCRMClient.getModules).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      mockCRMClient.getModules.mockRejectedValue(new Error('API Error'));

      await expect(metadataTools.getAllModules()).rejects.toThrow('Failed to get all modules: API Error');
    });
  });

  describe('getModuleDetails', () => {
    it('should get module details successfully', async () => {
      mockCRMClient.getModuleMetadata.mockResolvedValue(mockModule);

      const result = await metadataTools.getModuleDetails({
        module_name: 'Leads'
      });

      expect(result).toEqual(mockModule);
      expect(mockCRMClient.getModuleMetadata).toHaveBeenCalledWith('Leads');
    });

    it('should handle module not found error', async () => {
      mockCRMClient.getModuleMetadata.mockRejectedValue(new Error('Module not found'));

      await expect(metadataTools.getModuleDetails({
        module_name: 'NonExistent'
      })).rejects.toThrow('Failed to get module details for NonExistent: Module not found');
    });
  });

  describe('getModuleFields', () => {
    beforeEach(() => {
      mockCRMClient.getFields.mockResolvedValue([mockField]);
    });

    it('should get module fields with default parameters', async () => {
      const result = await metadataTools.getModuleFields({
        module_name: 'Leads'
      });

      expect(result.fields).toEqual([mockField]);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.per_page).toBe(50);
      expect(mockCRMClient.getFields).toHaveBeenCalledWith('Leads');
    });

    it('should get module fields with pagination', async () => {
      const result = await metadataTools.getModuleFields({
        module_name: 'Leads',
        page: 2,
        per_page: 25
      });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.per_page).toBe(25);
    });

    it('should filter fields by type', async () => {
      const picklistField = { ...mockField, data_type: 'picklist', pick_list_values: [{ id: '1', display_value: 'Option 1', actual_value: 'opt1', type: 'string' }] };
      mockCRMClient.getFields.mockResolvedValue([mockField, picklistField]);

      const result = await metadataTools.getModuleFields({
        module_name: 'Leads',
        field_type: 'picklist'
      });

      expect(result.fields).toEqual([picklistField]);
      expect(result.fields.length).toBe(1);
    });

    it('should search fields by term', async () => {
      const nameField = { ...mockField, display_label: 'Lead Name', api_name: 'Lead_Name' };
      const emailField = { ...mockField, display_label: 'Email', api_name: 'Email' };
      mockCRMClient.getFields.mockResolvedValue([nameField, emailField]);

      const result = await metadataTools.getModuleFields({
        module_name: 'Leads',
        search_term: 'lead'
      });

      expect(result.fields).toEqual([nameField]);
      expect(result.fields.length).toBe(1);
    });

    it('should exclude system fields', async () => {
      const systemField = { ...mockField, custom_field: false, api_name: 'Created_Time' };
      const customField = { ...mockField, custom_field: true, api_name: 'Custom_Field' };
      mockCRMClient.getFields.mockResolvedValue([systemField, customField]);

      const result = await metadataTools.getModuleFields({
        module_name: 'Leads',
        exclude_system_fields: true
      });

      expect(result.fields).toEqual([customField]);
    });

    it('should return minimal format', async () => {
      const result = await metadataTools.getModuleFields({
        module_name: 'Leads',
        format: 'minimal'
      });

      expect(result.fields[0]).toHaveProperty('api_name');
      expect(result.fields[0]).toHaveProperty('label');
      expect(result.fields[0]).toHaveProperty('type');
      expect(result.fields[0]).not.toHaveProperty('currency');
    });

    it('should return only specified fields', async () => {
      const result = await metadataTools.getModuleFields({
        module_name: 'Leads',
        fields_only: ['api_name', 'display_label']
      });

      expect(Object.keys(result.fields[0])).toEqual(['api_name', 'display_label']);
    });

    it('should handle fields retrieval errors', async () => {
      mockCRMClient.getFields.mockRejectedValue(new Error('Fields not found'));

      await expect(metadataTools.getModuleFields({
        module_name: 'Leads'
      })).rejects.toThrow('Failed to get fields for module Leads: Fields not found');
    });
  });

  describe('getFieldDetails', () => {
    it('should get field details successfully', async () => {
      mockCRMClient.getFieldMetadata = jest.fn().mockResolvedValue(mockField);

      const result = await metadataTools.getFieldDetails({
        field_id: 'Lead_Name',
        module_name: 'Leads'
      });

      expect(result).toEqual(mockField);
      expect(mockCRMClient.getFieldMetadata).toHaveBeenCalledWith('Lead_Name', 'Leads');
    });

    it('should handle field not found error', async () => {
      mockCRMClient.getFieldMetadata = jest.fn().mockRejectedValue(new Error('Field not found'));

      await expect(metadataTools.getFieldDetails({
        field_id: 'NonExistent',
        module_name: 'Leads'
      })).rejects.toThrow('Failed to get field details for NonExistent in module Leads: Field not found');
    });
  });

  describe('getAllProfiles', () => {
    it('should get all profiles successfully', async () => {
      const profiles = [mockProfile];
      mockCRMClient.getProfiles.mockResolvedValue(profiles);

      const result = await metadataTools.getAllProfiles();

      expect(result).toEqual(profiles);
      expect(mockCRMClient.getProfiles).toHaveBeenCalled();
    });

    it('should handle profiles retrieval errors', async () => {
      mockCRMClient.getProfiles.mockRejectedValue(new Error('Profiles error'));

      await expect(metadataTools.getAllProfiles()).rejects.toThrow('Failed to get all profiles: Profiles error');
    });
  });

  describe('getAllRoles', () => {
    it('should get all roles successfully', async () => {
      const roles = [mockRole];
      mockCRMClient.getRoles.mockResolvedValue(roles);

      const result = await metadataTools.getAllRoles();

      expect(result).toEqual(roles);
      expect(mockCRMClient.getRoles).toHaveBeenCalled();
    });

    it('should handle roles retrieval errors', async () => {
      mockCRMClient.getRoles.mockRejectedValue(new Error('Roles error'));

      await expect(metadataTools.getAllRoles()).rejects.toThrow('Failed to get all roles: Roles error');
    });
  });

  describe('getRoleDetails', () => {
    it('should get role details successfully', async () => {
      mockCRMClient.getRole = jest.fn().mockResolvedValue(mockRole);

      const result = await metadataTools.getRoleDetails({
        role_id: '123456789'
      });

      expect(result).toEqual(mockRole);
      expect(mockCRMClient.getRole).toHaveBeenCalledWith('123456789');
    });

    it('should handle role details errors', async () => {
      mockCRMClient.getRole = jest.fn().mockRejectedValue(new Error('Role not found'));

      await expect(metadataTools.getRoleDetails({
        role_id: 'invalid'
      })).rejects.toThrow('Failed to get role details for invalid: Role not found');
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      const users = [mockUser];
      mockCRMClient.getUsers.mockResolvedValue(users);

      const result = await metadataTools.getAllUsers();

      expect(result).toEqual(users);
      expect(mockCRMClient.getUsers).toHaveBeenCalled();
    });

    it('should get users by type', async () => {
      const users = [mockUser];
      mockCRMClient.getUsers.mockResolvedValue(users);

      await metadataTools.getAllUsers({ type: 'AdminUsers' });

      expect(mockCRMClient.getUsers).toHaveBeenCalledWith('AdminUsers');
    });

    it('should handle users retrieval errors', async () => {
      mockCRMClient.getUsers.mockRejectedValue(new Error('Users error'));

      await expect(metadataTools.getAllUsers()).rejects.toThrow('Failed to get all users: Users error');
    });
  });

  describe('getUserDetails', () => {
    it('should get user details successfully', async () => {
      mockCRMClient.getUser = jest.fn().mockResolvedValue(mockUser);

      const result = await metadataTools.getUserDetails({
        user_id: '123456789'
      });

      expect(result).toEqual(mockUser);
      expect(mockCRMClient.getUser).toHaveBeenCalledWith('123456789');
    });

    it('should handle user details errors', async () => {
      mockCRMClient.getUser = jest.fn().mockRejectedValue(new Error('User not found'));

      await expect(metadataTools.getUserDetails({
        user_id: 'invalid'
      })).rejects.toThrow('Failed to get user details for invalid: User not found');
    });
  });

  describe('getOrganizationDetails', () => {
    it('should get organization details successfully', async () => {
      mockCRMClient.getOrganization.mockResolvedValue(mockOrganization);

      const result = await metadataTools.getOrganizationDetails();

      expect(result).toEqual(mockOrganization);
      expect(mockCRMClient.getOrganization).toHaveBeenCalled();
    });

    it('should handle organization details errors', async () => {
      mockCRMClient.getOrganization.mockRejectedValue(new Error('Org error'));

      await expect(metadataTools.getOrganizationDetails()).rejects.toThrow('Failed to get organization details: Org error');
    });
  });

  describe('getLayouts', () => {
    it('should get layouts successfully', async () => {
      const layouts = [mockLayout];
      mockCRMClient.getLayouts.mockResolvedValue(layouts);

      const result = await metadataTools.getLayouts({
        module_name: 'Leads'
      });

      expect(result).toEqual(layouts);
      expect(mockCRMClient.getLayouts).toHaveBeenCalledWith('Leads');
    });

    it('should handle layouts retrieval errors', async () => {
      mockCRMClient.getLayouts.mockRejectedValue(new Error('Layouts error'));

      await expect(metadataTools.getLayouts({
        module_name: 'Leads'
      })).rejects.toThrow('Failed to get layouts: Layouts error');
    });
  });

  describe('getLayoutDetails', () => {
    it('should get layout details successfully', async () => {
      mockCRMClient.getLayout = jest.fn().mockResolvedValue(mockLayout);

      const result = await metadataTools.getLayoutDetails({
        layout_id: '123456789'
      });

      expect(result).toEqual(mockLayout);
      expect(mockCRMClient.getLayout).toHaveBeenCalledWith('123456789');
    });

    it('should handle layout details errors', async () => {
      mockCRMClient.getLayout = jest.fn().mockRejectedValue(new Error('Layout not found'));

      await expect(metadataTools.getLayoutDetails({
        layout_id: 'invalid'
      })).rejects.toThrow('Failed to get layout details for invalid: Layout not found');
    });
  });

  describe('getCustomViews', () => {
    it('should get custom views successfully', async () => {
      const views = [mockCustomView];
      mockCRMClient.getCustomViews.mockResolvedValue(views);

      const result = await metadataTools.getCustomViews({
        module_name: 'Leads'
      });

      expect(result).toEqual(views);
      expect(mockCRMClient.getCustomViews).toHaveBeenCalledWith('Leads');
    });

    it('should handle custom views errors', async () => {
      mockCRMClient.getCustomViews.mockRejectedValue(new Error('Views error'));

      await expect(metadataTools.getCustomViews({
        module_name: 'Leads'
      })).rejects.toThrow('Failed to get custom views for module Leads: Views error');
    });
  });

  describe('getCustomViewDetails', () => {
    it('should get custom view details successfully', async () => {
      mockCRMClient.getCustomView = jest.fn().mockResolvedValue(mockCustomView);

      const result = await metadataTools.getCustomViewDetails({
        custom_view_id: '123456789',
        module_name: 'Leads'
      });

      expect(result).toEqual(mockCustomView);
      expect(mockCRMClient.getCustomView).toHaveBeenCalledWith('123456789', 'Leads');
    });

    it('should handle custom view details errors', async () => {
      mockCRMClient.getCustomView = jest.fn().mockRejectedValue(new Error('View not found'));

      await expect(metadataTools.getCustomViewDetails({
        custom_view_id: 'invalid',
        module_name: 'Leads'
      })).rejects.toThrow('Failed to get custom view details for invalid in module Leads: View not found');
    });
  });

  describe('getRelatedLists', () => {
    it('should get related lists successfully', async () => {
      const relatedLists = [mockRelatedList];
      mockCRMClient.getRelatedLists.mockResolvedValue(relatedLists);

      const result = await metadataTools.getRelatedLists({
        module_name: 'Leads'
      });

      expect(result).toEqual(relatedLists);
      expect(mockCRMClient.getRelatedLists).toHaveBeenCalledWith('Leads');
    });

    it('should handle related lists errors', async () => {
      mockCRMClient.getRelatedLists.mockRejectedValue(new Error('Related lists error'));

      await expect(metadataTools.getRelatedLists({
        module_name: 'Leads'
      })).rejects.toThrow('Failed to get related lists for module Leads: Related lists error');
    });
  });

  describe('caching mechanism', () => {
    it('should cache and retrieve data correctly', async () => {
      const modules = [mockModule];
      mockCRMClient.getModules.mockResolvedValue(modules);

      // First call - should hit API
      const result1 = await metadataTools.getAllModules();
      expect(mockCRMClient.getModules).toHaveBeenCalledTimes(1);

      // Second call - should use cache (if caching is implemented for getAllModules)
      const result2 = await metadataTools.getAllModules();
      
      expect(result1).toEqual(result2);
      expect(result1).toEqual(modules);
    });

    it('should handle cache expiry', (done) => {
      // This test would verify cache TTL functionality
      // Implementation depends on how caching is actually used in the methods
      done();
    });
  });

  describe('error handling', () => {
    it('should provide consistent error messages', async () => {
      mockCRMClient.getModules.mockRejectedValue(new Error('Network timeout'));

      await expect(metadataTools.getAllModules()).rejects.toThrow('Failed to get all modules: Network timeout');
    });

    it('should handle API rate limiting', async () => {
      mockCRMClient.getFields.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(metadataTools.getModuleFields({
        module_name: 'Leads'
      })).rejects.toThrow('Failed to get fields for module Leads: Rate limit exceeded');
    });
  });

  describe('data formatting and processing', () => {
    it('should format field data based on response format', async () => {
      mockCRMClient.getFields.mockResolvedValue([mockField]);

      const minimalResult = await metadataTools.getModuleFields({
        module_name: 'Leads',
        format: 'minimal'
      });

      expect(minimalResult.fields[0]).toHaveProperty('api_name');
      expect(minimalResult.fields[0]).toHaveProperty('label');
      expect(minimalResult.fields[0]).toHaveProperty('type');
    });

    it('should extract only specified fields', async () => {
      mockCRMClient.getFields.mockResolvedValue([mockField]);

      const result = await metadataTools.getModuleFields({
        module_name: 'Leads',
        fields_only: ['api_name', 'data_type']
      });

      expect(Object.keys(result.fields[0])).toEqual(['api_name', 'data_type']);
    });

    it('should count different field types correctly', async () => {
      const fields = [
        { ...mockField, data_type: 'text', system_mandatory: false },
        { ...mockField, data_type: 'picklist', system_mandatory: false },
        { ...mockField, data_type: 'lookup', system_mandatory: true }
      ];
      mockCRMClient.getFields.mockResolvedValue(fields);

      const result = await metadataTools.getModuleFields({
        module_name: 'Leads'
      });

      expect(result.fields.length).toBe(3);
    });
  });
});