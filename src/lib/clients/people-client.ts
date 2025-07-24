import axios, { AxiosInstance } from 'axios';
import { ZohoAuthManager } from '../auth/oauth-manager';
import { 
  ZohoApiResponse, 
  ZohoAPIError,
  RateLimitError,
  PaginationOptions,
  PaginationResult,
  PaginationConfig
} from '../types';

// Zoho People specific types
export interface ZohoPeopleRecord {
  id: string;
  [key: string]: any;
}

export interface ZohoPeopleModule {
  api_name: string;
  module_name: string;
  plural_label: string;
  singular_label: string;
  supported_operations: string[];
  creatable?: boolean;
  deletable?: boolean;
  editable?: boolean;
  viewable?: boolean;
}

export interface ZohoPeopleField {
  api_name: string;
  display_label: string;
  data_type: string;
  required: boolean;
  read_only: boolean;
  id?: string;
  custom_field?: boolean;
  pick_list_values?: Array<{
    id: string;
    display_value: string;
    actual_value: string;
  }>;
  lookup?: any;
  sequence_number?: number;
}

export class ZohoPeopleClient {
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
      baseURL: `https://people.zoho.${dataCenter}/people/api`,
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
   * Get all available People modules
   */
  async getModules(): Promise<ZohoPeopleModule[]> {
    try {
      const response = await this.axiosInstance.get('/forms');
      
      // Transform the People API response to match our expected format
      const modules = response.data?.forms?.map((form: any) => ({
        api_name: form.form_name || form.linkName,
        module_name: form.display_name || form.form_name,
        plural_label: form.display_name || form.form_name,
        singular_label: form.display_name || form.form_name,
        supported_operations: ['read', 'create', 'update', 'delete'],
        creatable: true,
        deletable: true,
        editable: true,
        viewable: true
      })) || [];

      // Add common People modules that might not be in forms endpoint
      const commonModules = [
        {
          api_name: 'employees',
          module_name: 'Employees',
          plural_label: 'Employees',
          singular_label: 'Employee',
          supported_operations: ['read', 'create', 'update', 'delete'],
          creatable: true,
          deletable: true,
          editable: true,
          viewable: true
        },
        {
          api_name: 'departments',
          module_name: 'Departments',
          plural_label: 'Departments',
          singular_label: 'Department',
          supported_operations: ['read', 'create', 'update', 'delete'],
          creatable: true,
          deletable: true,
          editable: true,
          viewable: true
        },
        {
          api_name: 'attendance',
          module_name: 'Attendance',
          plural_label: 'Attendance',
          singular_label: 'Attendance',
          supported_operations: ['read', 'create', 'update'],
          creatable: true,
          deletable: false,
          editable: true,
          viewable: true
        },
        {
          api_name: 'leave',
          module_name: 'Leave',
          plural_label: 'Leave Records',
          singular_label: 'Leave Record',
          supported_operations: ['read', 'create', 'update'],
          creatable: true,
          deletable: false,
          editable: true,
          viewable: true
        },
        {
          api_name: 'performance',
          module_name: 'Performance',
          plural_label: 'Performance Records',
          singular_label: 'Performance Record',
          supported_operations: ['read', 'create', 'update'],
          creatable: true,
          deletable: false,
          editable: true,
          viewable: true
        },
        {
          api_name: 'training',
          module_name: 'Training',
          plural_label: 'Training Records',
          singular_label: 'Training Record',
          supported_operations: ['read', 'create', 'update'],
          creatable: true,
          deletable: false,
          editable: true,
          viewable: true
        }
      ];

      // Merge form-based modules with common modules, avoiding duplicates
      const allModules = [...modules];
      commonModules.forEach(commonModule => {
        if (!allModules.find(m => m.api_name === commonModule.api_name)) {
          allModules.push(commonModule);
        }
      });

      return allModules;
    } catch (error) {
      throw this.handleError(error, 'Failed to get People modules');
    }
  }

  /**
   * Get fields for a specific People module
   */
  async getFields(module: string): Promise<ZohoPeopleField[]> {
    try {
      // Try different endpoints based on the module
      let response;
      
      if (module === 'employees') {
        response = await this.axiosInstance.get('/forms/employee/fields');
      } else if (module === 'departments') {
        response = await this.axiosInstance.get('/forms/P_Department/fields');
      } else {
        // Try generic form fields endpoint
        response = await this.axiosInstance.get(`/forms/${module}/fields`);
      }
      
      const fields = response.data?.fields || response.data || [];
      
      return fields.map((field: any) => ({
        api_name: field.field_name || field.api_name || field.name,
        display_label: field.display_name || field.display_label || field.label,
        data_type: this.mapPeopleDataType(field.type || field.data_type),
        required: field.is_required || field.required || false,
        read_only: field.is_read_only || field.read_only || false,
        id: field.field_id || field.id,
        custom_field: field.is_custom || field.custom_field || false,
        pick_list_values: field.options?.map((option: any) => ({
          id: option.id || option.value,
          display_value: option.display_name || option.label || option.value,
          actual_value: option.value || option.actual_value
        })) || null,
        sequence_number: field.sequence || field.sequence_number
      }));
    } catch (error) {
      throw this.handleError(error, `Failed to get fields for People module ${module}`);
    }
  }

  /**
   * Map People API data types to standard format
   */
  private mapPeopleDataType(type: string): string {
    const typeMap: Record<string, string> = {
      'singleline': 'text',
      'multiline': 'textarea',
      'email': 'email',
      'phone': 'phone',
      'date': 'date',
      'datetime': 'datetime',
      'number': 'integer',
      'decimal': 'decimal',
      'boolean': 'boolean',
      'picklist': 'picklist',
      'lookup': 'lookup',
      'multiselect': 'multiselectpicklist'
    };
    
    return typeMap[type?.toLowerCase()] || type || 'text';
  }

  /**
   * Search records in a People module
   */
  async searchRecords(
    module: string,
    criteria: string,
    options: {
      fields?: string[];
      page?: number;
      per_page?: number;
    } = {}
  ): Promise<ZohoApiResponse<ZohoPeopleRecord[]>> {
    try {
      const params = new URLSearchParams();
      
      // Build search parameters
      if (criteria) {
        params.append('searchStr', criteria);
      }
      
      if (options.fields) {
        params.append('fields', options.fields.join(','));
      }
      
      if (options.page) {
        params.append('page', options.page.toString());
      }
      
      if (options.per_page) {
        params.append('per_page', Math.min(options.per_page, 200).toString());
      }

      let endpoint = `/forms/${module}/records`;
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await this.axiosInstance.get(endpoint);
      
      return {
        data: response.data?.response?.result || response.data?.result || response.data || [],
        info: {
          page: options.page || 1,
          per_page: options.per_page || 200,
          count: response.data?.response?.result?.length || response.data?.result?.length || 0,
          more_records: false // People API doesn't typically provide this info
        }
      };
    } catch (error) {
      throw this.handleError(error, `Failed to search records in People module ${module}`);
    }
  }

  /**
   * Get timeline/activity for a People record
   */
  async getTimeline(
    module: string,
    recordId: string,
    options?: {
      timeline_types?: string[];
      include_inner_details?: boolean;
      page?: number;
      per_page?: number;
    }
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      
      if (options?.page) {
        params.append('page', options.page.toString());
      }
      
      if (options?.per_page) {
        params.append('per_page', Math.min(options.per_page, 200).toString());
      }

      // People API might use different endpoint for activity/timeline
      let endpoint = `/forms/${module}/records/${recordId}/timeline`;
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await this.axiosInstance.get(endpoint);
      
      return {
        __timeline: response.data?.timeline || response.data?.activities || [],
        record_id: recordId,
        module: module
      };
    } catch (error: any) {
      // Timeline might not be available for all modules, return empty
      console.warn(`Timeline not available for ${module} record ${recordId}:`, error.message);
      return {
        __timeline: [],
        record_id: recordId,
        module: module,
        warning: 'Timeline data not available for this module'
      };
    }
  }

  /**
   * Get records from a People module
   */
  async getRecords(
    module: string,
    options: {
      fields?: string[];
      page?: number;
      per_page?: number;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    } = {}
  ): Promise<ZohoApiResponse<ZohoPeopleRecord[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.fields) {
        params.append('fields', options.fields.join(','));
      }
      
      if (options.page) {
        params.append('page', options.page.toString());
      }
      
      if (options.per_page) {
        params.append('per_page', Math.min(options.per_page, 200).toString());
      }
      
      if (options.sort_by) {
        params.append('sort_by', options.sort_by);
      }
      
      if (options.sort_order) {
        params.append('sort_order', options.sort_order);
      }

      let endpoint = `/forms/${module}/records`;
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await this.axiosInstance.get(endpoint);
      
      return {
        data: response.data?.response?.result || response.data?.result || response.data || [],
        info: {
          page: options.page || 1,
          per_page: options.per_page || 200,
          count: response.data?.response?.result?.length || response.data?.result?.length || 0,
          more_records: false
        }
      };
    } catch (error) {
      throw this.handleError(error, `Failed to get records from People module ${module}`);
    }
  }

  /**
   * Get all records from a People module with automatic pagination
   */
  async getAllRecords(
    module: string,
    options: PaginationOptions = {}
  ): Promise<PaginationResult<ZohoPeopleRecord>> {
    try {
      const allRecords: ZohoPeopleRecord[] = [];
      let currentPage = options.page || 1;
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
        
        const response = await this.getRecords(module, {
          ...options,
          page: currentPage,
          per_page: pageSize
        });
        
        if (response.data && response.data.length > 0) {
          allRecords.push(...response.data);
          totalRecords += response.data.length;
          
          // Check if there are more records (People API might not provide pagination info)
          hasMore = response.data.length === pageSize;
          currentPage++;
        } else {
          hasMore = false;
        }
        
        requestCount++;
        
        // Safety check to prevent infinite loops
        if (requestCount > 50) {
          console.warn(`Stopping pagination after ${requestCount} requests to prevent infinite loop`);
          break;
        }
      }

      return {
        data: allRecords.slice(0, maxRecords),
        totalRecords,
        hasMore: allRecords.length === maxRecords && hasMore,
        currentPage,
        totalPages: Math.ceil(totalRecords / pageSize)
      };
    } catch (error) {
      throw this.handleError(error, `Failed to get all records from People module ${module}`);
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