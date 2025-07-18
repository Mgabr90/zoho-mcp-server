import axios, { AxiosInstance } from 'axios';
import { ZohoAuthManager } from '../auth/oauth-manager';
import { 
  ZohoApiResponse, 
  ZohoCRMRecord, 
  ZohoCRMModule, 
  ZohoCRMField,
  ZohoCRMTask,
  ZohoCRMEvent,
  ZohoCRMNote,
  ZohoCRMAttachment,
  ZohoCRMEmail,
  ZohoCRMUser,
  ZohoCRMProfile,
  ZohoCRMRole,
  ZohoCRMLayout,
  ZohoCRMCustomView,
  ZohoCRMRelatedList,
  ZohoCRMOrganization,
  ZohoCRMTerritory,
  ZohoCRMCurrency,
  ZohoCRMPipeline,
  ZohoCRMAssignmentRule,
  ZohoCRMBlueprint,
  ZohoAPIError,
  RateLimitError,
  PaginationOptions,
  PaginationResult,
  PaginationConfig
} from '../types';

export class ZohoCRMClient {
  private axiosInstance: AxiosInstance;
  private authManager: ZohoAuthManager;
  private dataCenter: string;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private paginationConfig: PaginationConfig = {
    defaultPageSize: 200,
    maxPageSize: 200,
    enableAutoPagination: true,
    rateLimitDelay: 1000,
    maxRetries: 3,
    usePageTokens: true,
    maxRecordsPerBatch: 5000
  };

  constructor(authManager: ZohoAuthManager, dataCenter: string, paginationConfig?: Partial<PaginationConfig>) {
    this.authManager = authManager;
    this.dataCenter = dataCenter;
    
    if (paginationConfig) {
      this.paginationConfig = { ...this.paginationConfig, ...paginationConfig };
    }
    
    this.axiosInstance = axios.create({
      baseURL: `https://www.zohoapis.${dataCenter}/crm/v8`,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.authManager.getValidAccessToken();
        config.headers.Authorization = `Zoho-oauthtoken ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try refreshing
          await this.authManager.refreshAccessToken();
          return this.axiosInstance.request(error.config);
        }
        
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          throw new RateLimitError('Rate limit exceeded', retryAfter);
        }
        
        throw new ZohoAPIError(
          error.response?.data?.message || error.message,
          error.response?.status || 500,
          error.response?.data
        );
      }
    );
  }

  // ========== METADATA MANAGEMENT ==========

  /**
   * Get all available modules
   */
  async getModules(): Promise<ZohoCRMModule[]> {
    try {
      const response = await this.axiosInstance.get('/settings/modules');
      return response.data.modules || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get modules');
    }
  }

  /**
   * Get metadata for a specific module
   */
  async getModuleMetadata(moduleName: string): Promise<ZohoCRMModule> {
    try {
      const response = await this.axiosInstance.get(`/settings/modules/${moduleName}`);
      return response.data.modules[0];
    } catch (error) {
      throw this.handleError(error, `Failed to get module metadata for ${moduleName}`);
    }
  }

  /**
   * Get fields for a specific module
   */
  async getFields(module: string): Promise<ZohoCRMField[]> {
    try {
      const response = await this.axiosInstance.get(`/settings/fields?module=${module}`);
      return response.data.fields || [];
    } catch (error) {
      throw this.handleError(error, `Failed to get fields for module ${module}`);
    }
  }

  /**
   * Get metadata for a specific field
   */
  async getFieldMetadata(fieldId: string, module: string): Promise<ZohoCRMField> {
    try {
      const response = await this.axiosInstance.get(`/settings/fields/${fieldId}?module=${module}`);
      return response.data.fields[0];
    } catch (error) {
      throw this.handleError(error, `Failed to get field metadata for ${fieldId} in module ${module}`);
    }
  }

  /**
   * Get layouts for a module
   */
  async getLayouts(module?: string): Promise<ZohoCRMLayout[]> {
    try {
      const url = module ? `/settings/layouts?module=${module}` : '/settings/layouts';
      const response = await this.axiosInstance.get(url);
      return response.data.layouts || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get layouts');
    }
  }

  /**
   * Get specific layout metadata
   */
  async getLayout(layoutId: string): Promise<ZohoCRMLayout> {
    try {
      const response = await this.axiosInstance.get(`/settings/layouts/${layoutId}`);
      return response.data.layouts[0];
    } catch (error) {
      throw this.handleError(error, `Failed to get layout ${layoutId}`);
    }
  }

  /**
   * Update layout configuration
   */
  async updateLayout(layoutId: string, layoutData: Partial<ZohoCRMLayout>): Promise<ZohoCRMLayout> {
    try {
      const response = await this.axiosInstance.put(`/settings/layouts/${layoutId}`, {
        layouts: [layoutData]
      });
      return response.data.layouts[0];
    } catch (error) {
      throw this.handleError(error, `Failed to update layout ${layoutId}`);
    }
  }

  /**
   * Get all profiles
   */
  async getProfiles(): Promise<ZohoCRMProfile[]> {
    try {
      const response = await this.axiosInstance.get('/settings/profiles');
      return response.data.profiles || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get profiles');
    }
  }

  /**
   * Create a new profile
   */
  async createProfile(profileData: Partial<ZohoCRMProfile>): Promise<ZohoCRMProfile> {
    try {
      const response = await this.axiosInstance.post('/settings/profiles', {
        profiles: [profileData]
      });
      return response.data.profiles[0];
    } catch (error) {
      throw this.handleError(error, 'Failed to create profile');
    }
  }

  /**
   * Update profile permissions
   */
  async updateProfile(profileId: string, profileData: Partial<ZohoCRMProfile>): Promise<ZohoCRMProfile> {
    try {
      const response = await this.axiosInstance.put(`/settings/profiles/${profileId}`, {
        profiles: [{ id: profileId, ...profileData }]
      });
      return response.data.profiles[0];
    } catch (error) {
      throw this.handleError(error, `Failed to update profile ${profileId}`);
    }
  }

  /**
   * Get all roles
   */
  async getRoles(): Promise<ZohoCRMRole[]> {
    try {
      const response = await this.axiosInstance.get('/settings/roles');
      return response.data.roles || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get roles');
    }
  }

  /**
   * Get specific role metadata
   */
  async getRole(roleId: string): Promise<ZohoCRMRole> {
    try {
      const response = await this.axiosInstance.get(`/settings/roles/${roleId}`);
      return response.data.roles[0];
    } catch (error) {
      throw this.handleError(error, `Failed to get role ${roleId}`);
    }
  }

  /**
   * Create a new role
   */
  async createRole(roleData: Partial<ZohoCRMRole>): Promise<ZohoCRMRole> {
    try {
      const response = await this.axiosInstance.post('/settings/roles', {
        roles: [roleData]
      });
      return response.data.roles[0];
    } catch (error) {
      throw this.handleError(error, 'Failed to create role');
    }
  }

  /**
   * Update role details
   */
  async updateRole(roleId: string, roleData: Partial<ZohoCRMRole>): Promise<ZohoCRMRole> {
    try {
      const response = await this.axiosInstance.put(`/settings/roles/${roleId}`, {
        roles: [{ id: roleId, ...roleData }]
      });
      return response.data.roles[0];
    } catch (error) {
      throw this.handleError(error, `Failed to update role ${roleId}`);
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/settings/roles/${roleId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete role ${roleId}`);
    }
  }

  /**
   * Get all users
   */
  async getUsers(type?: string): Promise<ZohoCRMUser[]> {
    try {
      const url = type ? `/users?type=${type}` : '/users';
      const response = await this.axiosInstance.get(url);
      return response.data.users || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get users');
    }
  }

  /**
   * Get specific user metadata
   */
  async getUser(userId: string): Promise<ZohoCRMUser> {
    try {
      const response = await this.axiosInstance.get(`/users/${userId}`);
      return response.data.users[0];
    } catch (error) {
      throw this.handleError(error, `Failed to get user ${userId}`);
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: Partial<ZohoCRMUser>): Promise<ZohoCRMUser> {
    try {
      const response = await this.axiosInstance.post('/users', {
        users: [userData]
      });
      return response.data.users[0];
    } catch (error) {
      throw this.handleError(error, 'Failed to create user');
    }
  }

  /**
   * Get organization details
   */
  async getOrganization(): Promise<ZohoCRMOrganization> {
    try {
      const response = await this.axiosInstance.get('/org');
      return response.data.org[0];
    } catch (error) {
      throw this.handleError(error, 'Failed to get organization details');
    }
  }

  /**
   * Get organization features
   */
  async getFeatures(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/settings/features');
      return response.data.features || {};
    } catch (error) {
      throw this.handleError(error, 'Failed to get organization features');
    }
  }

  /**
   * Get all custom views for a module
   */
  async getCustomViews(module: string): Promise<ZohoCRMCustomView[]> {
    try {
      const response = await this.axiosInstance.get(`/settings/custom_views?module=${module}`);
      return response.data.custom_views || [];
    } catch (error) {
      throw this.handleError(error, `Failed to get custom views for module ${module}`);
    }
  }

  /**
   * Get specific custom view metadata
   */
  async getCustomView(customViewId: string, module: string): Promise<ZohoCRMCustomView> {
    try {
      const response = await this.axiosInstance.get(`/settings/custom_views/${customViewId}?module=${module}`);
      return response.data.custom_views[0];
    } catch (error) {
      throw this.handleError(error, `Failed to get custom view ${customViewId} for module ${module}`);
    }
  }

  /**
   * Get related lists for a module
   */
  async getRelatedLists(module: string): Promise<ZohoCRMRelatedList[]> {
    try {
      const response = await this.axiosInstance.get(`/settings/related_lists?module=${module}`);
      return response.data.related_lists || [];
    } catch (error) {
      throw this.handleError(error, `Failed to get related lists for module ${module}`);
    }
  }

  /**
   * Get territories
   */
  async getTerritories(): Promise<ZohoCRMTerritory[]> {
    try {
      const response = await this.axiosInstance.get('/settings/territories');
      return response.data.territories || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get territories');
    }
  }

  /**
   * Get currencies
   */
  async getCurrencies(): Promise<ZohoCRMCurrency[]> {
    try {
      const response = await this.axiosInstance.get('/settings/currencies');
      return response.data.currencies || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get currencies');
    }
  }

  /**
   * Get pipeline metadata
   */
  async getPipeline(): Promise<ZohoCRMPipeline[]> {
    try {
      const response = await this.axiosInstance.get('/settings/pipeline');
      return response.data.pipeline || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get pipeline metadata');
    }
  }

  /**
   * Get assignment rules
   */
  async getAssignmentRules(): Promise<ZohoCRMAssignmentRule[]> {
    try {
      const response = await this.axiosInstance.get('/settings/assignment_rules');
      return response.data.assignment_rules || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get assignment rules');
    }
  }

  /**
   * Get blueprint metadata
   */
  async getBlueprint(): Promise<ZohoCRMBlueprint[]> {
    try {
      const response = await this.axiosInstance.get('/settings/blueprint');
      return response.data.blueprint || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get blueprint metadata');
    }
  }

  /**
   * Get picklist values for a specific field in a module
   */
  async getPicklistValues(moduleName: string, fieldName: string): Promise<any> {
    try {
      // First get the field metadata to get the field ID
      const fields = await this.getFields(moduleName);
      const field = fields.find(f => f.api_name === fieldName || f.display_label === fieldName);
      
      if (!field) {
        throw new Error(`Field ${fieldName} not found in module ${moduleName}`);
      }
      
      // Check if the field has picklist values in its metadata
      if (field.pick_list_values && field.pick_list_values.length > 0) {
        return {
          field_name: fieldName,
          module_name: moduleName,
          picklist_values: field.pick_list_values,
          total_count: field.pick_list_values.length
        };
      }
      
      // If not found in metadata, try the API endpoint
      const response = await this.axiosInstance.get(`/settings/fields/${field.id}/picklist`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get picklist values for ${fieldName} in ${moduleName}`);
    }
  }

  /**
   * Get global fields across all modules
   */
  async getGlobalFields(): Promise<{
    global_picklists: Array<{
      id: string;
      name: string;
      display_label: string;
      values: Array<{
        id: string;
        display_value: string;
        actual_value: string;
        sequence_number: number;
        colour_code?: string;
      }>;
      total_values: number;
    }>;
    global_lookups: Array<{
      id: string;
      name: string;
      display_label: string;
      source_module: string;
      target_module: string;
    }>;
    summary: {
      total_global_picklists: number;
      total_global_lookups: number;
    };
  }> {
    try {
      // Get all modules first
      const modules = await this.getModules();
      const globalPicklists: any[] = [];
      const globalLookups: any[] = [];
      
      // Get fields from each module to identify global fields
      for (const module of modules) {
        try {
          const fields = await this.getFields(module.api_name);
          
          // Find fields with global picklists
          const picklistFields = fields.filter(field => 
            field.global_picklist && field.global_picklist.id
          );
          
          // Find lookup fields
          const lookupFields = fields.filter(field => 
            field.lookup && field.lookup.id
          );
          
          // Add to global collections
          picklistFields.forEach(field => {
            if (field.global_picklist && !globalPicklists.find(gp => gp.id === field.global_picklist!.id)) {
              globalPicklists.push({
                id: field.global_picklist.id,
                name: field.global_picklist.name || field.api_name,
                display_label: field.display_label,
                values: field.pick_list_values || [],
                total_values: field.pick_list_values?.length || 0
              });
            }
          });
          
          lookupFields.forEach(field => {
            if (!globalLookups.find(gl => gl.id === field.lookup.id)) {
              globalLookups.push({
                id: field.lookup.id,
                name: field.api_name,
                display_label: field.display_label,
                source_module: module.api_name,
                target_module: field.lookup.module?.api_name || 'Unknown'
              });
            }
          });
        } catch (error: any) {
          // Skip modules that can't be accessed
          console.warn(`Could not get fields for module ${module.api_name}: ${error.message || 'Unknown error'}`);
        }
      }
      
      return {
        global_picklists: globalPicklists,
        global_lookups: globalLookups,
        summary: {
          total_global_picklists: globalPicklists.length,
          total_global_lookups: globalLookups.length
        }
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get global fields');
    }
  }

  /**
   * Get records from a module with enhanced pagination support
   */
  async getRecords(
    module: string,
    options: {
      fields?: string[];
      page?: number;
      per_page?: number;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
      page_token?: string;
      auto_paginate?: boolean;
      max_records?: number;
    } = {}
  ): Promise<ZohoApiResponse<ZohoCRMRecord[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.fields) params.append('fields', options.fields.join(','));
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.sort_by) params.append('sort_by', options.sort_by);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      if (options.page_token) params.append('page_token', options.page_token);
      
      const response = await this.axiosInstance.get(`/${module}?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get records from ${module}`);
    }
  }

  /**
   * Get all records from a module with automatic pagination
   */
  async getAllRecords(
    module: string,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<ZohoCRMRecord>> {
    try {
      const allRecords: ZohoCRMRecord[] = [];
      let currentPage = options.page || 1;
      let nextPageToken = options.page_token;
      let hasMore = true;
      let totalRecords = 0;
      let requestCount = 0;
      
      const maxRecords = options.max_records || this.paginationConfig.maxRecordsPerBatch;
      const pageSize = Math.min(
        options.per_page || this.paginationConfig.defaultPageSize,
        this.paginationConfig.maxPageSize
      );

      while (hasMore && allRecords.length < maxRecords) {
        await this.rateLimitDelay(requestCount);
        
        const requestOptions = {
          ...options,
          page: this.paginationConfig.usePageTokens ? undefined : currentPage,
          per_page: pageSize,
          page_token: nextPageToken
        };

        const response = await this.getRecords(module, requestOptions);
        
        if (response.data && response.data.length > 0) {
          allRecords.push(...response.data);
          totalRecords += response.data.length;
          
          // Check for pagination info
          if (response.info) {
            hasMore = response.info.more_records || false;
            nextPageToken = response.info.next_page_token;
            currentPage++;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        requestCount++;
        
        // Safety check to prevent infinite loops
        if (requestCount > 100) {
          console.warn(`Stopping pagination after ${requestCount} requests to prevent infinite loop`);
          break;
        }
      }

      return {
        data: allRecords.slice(0, maxRecords),
        totalRecords,
        hasMore: allRecords.length === maxRecords && hasMore,
        nextPageToken,
        currentPage,
        totalPages: Math.ceil(totalRecords / pageSize)
      };
    } catch (error) {
      throw this.handleError(error, `Failed to get all records from ${module}`);
    }
  }

  /**
   * Get records with advanced pagination options
   */
  async getRecordsWithPagination(
    module: string,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<ZohoCRMRecord>> {
    try {
      if (options.auto_paginate && this.paginationConfig.enableAutoPagination) {
        return this.getAllRecords(module, options);
      }
      
      const response = await this.getRecords(module, options);
      
      return {
        data: response.data || [],
        totalRecords: response.data?.length || 0,
        hasMore: response.info?.more_records || false,
        nextPageToken: response.info?.next_page_token,
        currentPage: response.info?.page || 1,
        totalPages: response.info?.count ? Math.ceil(response.info.count / (options.per_page || this.paginationConfig.defaultPageSize)) : undefined
      };
    } catch (error) {
      throw this.handleError(error, `Failed to get records with pagination from ${module}`);
    }
  }

  /**
   * Get a specific record by ID
   */
  async getRecord(module: string, recordId: string): Promise<ZohoCRMRecord> {
    try {
      const response = await this.axiosInstance.get(`/${module}/${recordId}`);
      return response.data.data[0];
    } catch (error) {
      throw this.handleError(error, `Failed to get record ${recordId} from ${module}`);
    }
  }

  /**
   * Create a new record
   */
  async createRecord(module: string, data: Partial<ZohoCRMRecord>): Promise<ZohoCRMRecord> {
    try {
      const response = await this.axiosInstance.post(`/${module}`, {
        data: [data]
      });
      return response.data.data[0].details;
    } catch (error) {
      throw this.handleError(error, `Failed to create record in ${module}`);
    }
  }

  /**
   * Update an existing record
   */
  async updateRecord(
    module: string, 
    recordId: string, 
    data: Partial<ZohoCRMRecord>
  ): Promise<ZohoCRMRecord> {
    try {
      const response = await this.axiosInstance.put(`/${module}/${recordId}`, {
        data: [{ id: recordId, ...data }]
      });
      return response.data.data[0].details;
    } catch (error) {
      throw this.handleError(error, `Failed to update record ${recordId} in ${module}`);
    }
  }

  /**
   * Delete a record
   */
  async deleteRecord(module: string, recordId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/${module}/${recordId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete record ${recordId} from ${module}`);
    }
  }

  /**
   * Search records with criteria and enhanced pagination
   */
  async searchRecords(
    module: string,
    criteria: string,
    options: {
      fields?: string[];
      page?: number;
      per_page?: number;
      page_token?: string;
      auto_paginate?: boolean;
      max_records?: number;
    } = {}
  ): Promise<ZohoApiResponse<ZohoCRMRecord[]>> {
    try {
      const params = new URLSearchParams();
      params.append('criteria', criteria);
      
      if (options.fields) params.append('fields', options.fields.join(','));
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.page_token) params.append('page_token', options.page_token);
      
      const response = await this.axiosInstance.get(`/${module}/search?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to search records in ${module}`);
    }
  }

  /**
   * Search all records with automatic pagination
   */
  async searchAllRecords(
    module: string,
    criteria: string,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<ZohoCRMRecord>> {
    try {
      const allRecords: ZohoCRMRecord[] = [];
      let currentPage = options.page || 1;
      let nextPageToken = options.page_token;
      let hasMore = true;
      let totalRecords = 0;
      let requestCount = 0;
      
      const maxRecords = options.max_records || this.paginationConfig.maxRecordsPerBatch;
      const pageSize = Math.min(
        options.per_page || this.paginationConfig.defaultPageSize,
        this.paginationConfig.maxPageSize
      );

      while (hasMore && allRecords.length < maxRecords) {
        await this.rateLimitDelay(requestCount);
        
        const requestOptions = {
          ...options,
          page: this.paginationConfig.usePageTokens ? undefined : currentPage,
          per_page: pageSize,
          page_token: nextPageToken
        };

        const response = await this.searchRecords(module, criteria, requestOptions);
        
        if (response.data && response.data.length > 0) {
          allRecords.push(...response.data);
          totalRecords += response.data.length;
          
          // Check for pagination info
          if (response.info) {
            hasMore = response.info.more_records || false;
            nextPageToken = response.info.next_page_token;
            currentPage++;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        requestCount++;
        
        // Safety check to prevent infinite loops
        if (requestCount > 100) {
          console.warn(`Stopping search pagination after ${requestCount} requests to prevent infinite loop`);
          break;
        }
      }

      return {
        data: allRecords.slice(0, maxRecords),
        totalRecords,
        hasMore: allRecords.length === maxRecords && hasMore,
        nextPageToken,
        currentPage,
        totalPages: Math.ceil(totalRecords / pageSize)
      };
    } catch (error) {
      throw this.handleError(error, `Failed to search all records in ${module}`);
    }
  }

  /**
   * Get related records
   */
  async getRelatedRecords(
    module: string,
    recordId: string,
    relatedModule: string,
    options: {
      fields?: string[];
      page?: number;
      per_page?: number;
    } = {}
  ): Promise<ZohoApiResponse<ZohoCRMRecord[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.fields) params.append('fields', options.fields.join(','));
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      
      const response = await this.axiosInstance.get(
        `/${module}/${recordId}/${relatedModule}?${params}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get related records from ${relatedModule}`);
    }
  }

  // ========== TASKS MANAGEMENT ==========

  /**
   * Get all tasks
   */
  async getTasks(options: {
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    status?: string;
    due_date?: string;
  } = {}): Promise<ZohoApiResponse<ZohoCRMTask[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.sort_by) params.append('sort_by', options.sort_by);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      if (options.status) params.append('status', options.status);
      if (options.due_date) params.append('due_date', options.due_date);
      
      const response = await this.axiosInstance.get(`/Tasks?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get tasks');
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTask(taskId: string): Promise<ZohoCRMTask> {
    try {
      const response = await this.axiosInstance.get(`/Tasks/${taskId}`);
      return response.data.data[0];
    } catch (error) {
      throw this.handleError(error, `Failed to get task ${taskId}`);
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData: Partial<ZohoCRMTask>): Promise<ZohoCRMTask> {
    try {
      const response = await this.axiosInstance.post('/Tasks', {
        data: [taskData]
      });
      return response.data.data[0].details;
    } catch (error) {
      throw this.handleError(error, 'Failed to create task');
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, taskData: Partial<ZohoCRMTask>): Promise<ZohoCRMTask> {
    try {
      const response = await this.axiosInstance.put(`/Tasks/${taskId}`, {
        data: [{ id: taskId, ...taskData }]
      });
      return response.data.data[0].details;
    } catch (error) {
      throw this.handleError(error, `Failed to update task ${taskId}`);
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/Tasks/${taskId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete task ${taskId}`);
    }
  }

  // ========== EVENTS MANAGEMENT ==========

  /**
   * Get all events
   */
  async getEvents(options: {
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    start_date?: string;
    end_date?: string;
  } = {}): Promise<ZohoApiResponse<ZohoCRMEvent[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.sort_by) params.append('sort_by', options.sort_by);
      if (options.sort_order) params.append('sort_order', options.sort_order);
      if (options.start_date) params.append('start_date', options.start_date);
      if (options.end_date) params.append('end_date', options.end_date);
      
      const response = await this.axiosInstance.get(`/Events?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to get events');
    }
  }

  /**
   * Get a specific event by ID
   */
  async getEvent(eventId: string): Promise<ZohoCRMEvent> {
    try {
      const response = await this.axiosInstance.get(`/Events/${eventId}`);
      return response.data.data[0];
    } catch (error) {
      throw this.handleError(error, `Failed to get event ${eventId}`);
    }
  }

  /**
   * Create a new event
   */
  async createEvent(eventData: Partial<ZohoCRMEvent>): Promise<ZohoCRMEvent> {
    try {
      const response = await this.axiosInstance.post('/Events', {
        data: [eventData]
      });
      return response.data.data[0].details;
    } catch (error) {
      throw this.handleError(error, 'Failed to create event');
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, eventData: Partial<ZohoCRMEvent>): Promise<ZohoCRMEvent> {
    try {
      const response = await this.axiosInstance.put(`/Events/${eventId}`, {
        data: [{ id: eventId, ...eventData }]
      });
      return response.data.data[0].details;
    } catch (error) {
      throw this.handleError(error, `Failed to update event ${eventId}`);
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/Events/${eventId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete event ${eventId}`);
    }
  }

  // ========== NOTES MANAGEMENT ==========

  /**
   * Get notes for a specific record
   */
  async getNotes(module: string, recordId: string, options: {
    page?: number;
    per_page?: number;
  } = {}): Promise<ZohoApiResponse<ZohoCRMNote[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      
      const response = await this.axiosInstance.get(`/${module}/${recordId}/Notes?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get notes for ${module} ${recordId}`);
    }
  }

  /**
   * Get a specific note by ID
   */
  async getNote(module: string, recordId: string, noteId: string): Promise<ZohoCRMNote> {
    try {
      const response = await this.axiosInstance.get(`/${module}/${recordId}/Notes/${noteId}`);
      return response.data.data[0];
    } catch (error) {
      throw this.handleError(error, `Failed to get note ${noteId}`);
    }
  }

  /**
   * Create a new note for a record
   */
  async createNote(module: string, recordId: string, noteData: Partial<ZohoCRMNote>): Promise<ZohoCRMNote> {
    try {
      const response = await this.axiosInstance.post(`/${module}/${recordId}/Notes`, {
        data: [{ ...noteData, Parent_Id: recordId }]
      });
      return response.data.data[0].details;
    } catch (error) {
      throw this.handleError(error, `Failed to create note for ${module} ${recordId}`);
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(module: string, recordId: string, noteId: string, noteData: Partial<ZohoCRMNote>): Promise<ZohoCRMNote> {
    try {
      const response = await this.axiosInstance.put(`/${module}/${recordId}/Notes/${noteId}`, {
        data: [{ id: noteId, ...noteData }]
      });
      return response.data.data[0].details;
    } catch (error) {
      throw this.handleError(error, `Failed to update note ${noteId}`);
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(module: string, recordId: string, noteId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/${module}/${recordId}/Notes/${noteId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete note ${noteId}`);
    }
  }

  // ========== ATTACHMENTS MANAGEMENT ==========

  /**
   * Get attachments for a specific record
   */
  async getAttachments(module: string, recordId: string, options: {
    page?: number;
    per_page?: number;
  } = {}): Promise<ZohoApiResponse<ZohoCRMAttachment[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      
      const response = await this.axiosInstance.get(`/${module}/${recordId}/Attachments?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get attachments for ${module} ${recordId}`);
    }
  }

  /**
   * Upload attachment to a record
   */
  async uploadAttachment(module: string, recordId: string, file: Buffer, fileName: string): Promise<ZohoCRMAttachment> {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([file]), fileName);
      
      const response = await this.axiosInstance.post(`/${module}/${recordId}/Attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data[0].details;
    } catch (error) {
      throw this.handleError(error, `Failed to upload attachment to ${module} ${recordId}`);
    }
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(module: string, recordId: string, attachmentId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/${module}/${recordId}/Attachments/${attachmentId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete attachment ${attachmentId}`);
    }
  }

  // ========== EMAIL MANAGEMENT ==========

  /**
   * Send email for a record
   */
  async sendEmail(module: string, recordId: string, emailData: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    content: string;
    mail_format?: string;
    template_id?: string;
  }): Promise<void> {
    try {
      await this.axiosInstance.post(`/${module}/${recordId}/actions/send_mail`, {
        data: [emailData]
      });
    } catch (error) {
      throw this.handleError(error, `Failed to send email for ${module} ${recordId}`);
    }
  }

  /**
   * Get email history for a record
   */
  async getEmailHistory(module: string, recordId: string, options: {
    page?: number;
    per_page?: number;
  } = {}): Promise<ZohoApiResponse<ZohoCRMEmail[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page.toString());
      if (options.per_page) params.append('per_page', options.per_page.toString());
      
      const response = await this.axiosInstance.get(`/${module}/${recordId}/Emails?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get email history for ${module} ${recordId}`);
    }
  }

  /**
   * Rate limiting delay with exponential backoff
   */
  private async rateLimitDelay(requestCount: number): Promise<void> {
    if (requestCount === 0) return;
    
    const baseDelay = this.paginationConfig.rateLimitDelay;
    const exponentialDelay = Math.min(baseDelay * Math.pow(1.5, requestCount - 1), 10000);
    
    await new Promise(resolve => setTimeout(resolve, exponentialDelay));
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.paginationConfig.maxRetries
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (error instanceof RateLimitError) {
          const retryAfter = error.retryAfter * 1000; // Convert to milliseconds
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          continue;
        }
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff for other errors
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: any, message: string): ZohoAPIError {
    if (error instanceof ZohoAPIError || error instanceof RateLimitError) {
      return error;
    }
    
    return new ZohoAPIError(
      `${message}: ${error.message}`,
      error.response?.status || 500,
      error.response?.data
    );
  }
}
