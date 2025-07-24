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

// Desk-specific interfaces
export interface ZohoDeskDepartment {
  id: string;
  name: string;
  description?: string;
  isEnabled?: boolean;
  hasLogo?: boolean;
  logoUrl?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export interface ZohoDeskField {
  id: string;
  apiName: string;
  displayLabel: string;
  dataType: string;
  isRequired: boolean;
  isVisible: boolean;
  isCustomField: boolean;
  defaultValue?: any;
  maxLength?: number;
  precision?: number;
  pickListValues?: Array<{
    id: string;
    value: string;
    isInactive?: boolean;
  }>;
  lookupDetails?: {
    id: string;
    lookupApiName: string;
    module: string;
  };
}

export interface ZohoDeskRecord {
  id: string;
  [key: string]: any;
}

export interface ZohoDeskEntity {
  id: string;
  name: string;
  apiName: string;
  isCustomModule: boolean;
  description?: string;
  fields?: ZohoDeskField[];
}

export interface ZohoDeskTimelineEntry {
  id: string;
  type: string;
  actor: {
    id: string;
    name: string;
    type: string;
  };
  content: any;
  createdTime: string;
  modifiedTime?: string;
}

export class ZohoDeskClient {
  private axiosInstance: AxiosInstance;
  private authManager: ZohoAuthManager;
  private dataCenter: string;
  private paginationConfig: PaginationConfig = {
    defaultPageSize: 100,
    maxPageSize: 100,
    enableAutoPagination: true,
    rateLimitDelay: 1000,
    maxRetries: 3,
    usePageTokens: false,
    maxRecordsPerBatch: 5000
  };

  constructor(authManager: ZohoAuthManager, dataCenter: string, paginationConfig?: Partial<PaginationConfig>) {
    this.authManager = authManager;
    this.dataCenter = dataCenter;
    
    if (paginationConfig) {
      this.paginationConfig = { ...this.paginationConfig, ...paginationConfig };
    }
    
    this.axiosInstance = axios.create({
      baseURL: `https://desk.zoho.${dataCenter}/api/v1`,
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

  // ========== DEPARTMENT MANAGEMENT ==========

  /**
   * Get all departments in Zoho Desk
   */
  async getDepartments(): Promise<ZohoDeskDepartment[]> {
    try {
      const response = await this.axiosInstance.get('/departments');
      return response.data.data || [];
    } catch (error) {
      throw this.handleError(error, 'Failed to get departments');
    }
  }

  /**
   * Get a specific department by ID
   */
  async getDepartment(departmentId: string): Promise<ZohoDeskDepartment> {
    try {
      const response = await this.axiosInstance.get(`/departments/${departmentId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get department ${departmentId}`);
    }
  }

  // ========== ENTITY FIELD DISCOVERY ==========

  /**
   * Get fields for a specific entity in a department
   */
  async getEntityFields(departmentId: string, entityType: string): Promise<ZohoDeskField[]> {
    try {
      // Desk API structure: /departments/{dept_id}/{entity_type}/layouts
      const response = await this.axiosInstance.get(`/departments/${departmentId}/${entityType}/layouts`);
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const layout = response.data.data[0]; // Get first layout
        return layout.sections?.flatMap((section: any) => section.fields || []) || [];
      }
      
      // Fallback: try direct fields endpoint if available
      try {
        const fieldsResponse = await this.axiosInstance.get(`/departments/${departmentId}/${entityType}/fields`);
        return fieldsResponse.data.data || [];
      } catch (fieldsError) {
        // Return empty array if no fields found
        return [];
      }
    } catch (error) {
      throw this.handleError(error, `Failed to get fields for ${entityType} in department ${departmentId}`);
    }
  }

  // ========== ENTITY SEARCH & RETRIEVAL ==========

  /**
   * Search entities in a specific department
   */
  async searchEntities(
    departmentId: string,
    entityType: string,
    searchParams: {
      searchStr?: string;
      email?: string;
      phone?: string;
      viewId?: string;
      sortBy?: string;
      limit?: number;
      from?: number;
      fields?: string[];
      include?: string[];
    } = {}
  ): Promise<ZohoApiResponse<ZohoDeskRecord[]>> {
    try {
      const params = new URLSearchParams();
      
      if (searchParams.searchStr) params.append('searchStr', searchParams.searchStr);
      if (searchParams.email) params.append('email', searchParams.email);
      if (searchParams.phone) params.append('phone', searchParams.phone);
      if (searchParams.viewId) params.append('viewId', searchParams.viewId);
      if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy);
      if (searchParams.limit) params.append('limit', searchParams.limit.toString());
      if (searchParams.from) params.append('from', searchParams.from.toString());
      if (searchParams.fields) params.append('fields', searchParams.fields.join(','));
      if (searchParams.include) params.append('include', searchParams.include.join(','));
      
      const url = params.toString()
        ? `/departments/${departmentId}/${entityType}?${params.toString()}`
        : `/departments/${departmentId}/${entityType}`;

      const response = await this.axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to search ${entityType} in department ${departmentId}`);
    }
  }

  /**
   * Get all entities with automatic pagination
   */
  async getAllEntities(
    departmentId: string,
    entityType: string,
    options: PaginationOptions & {
      searchStr?: string;
      email?: string;
      phone?: string;
      viewId?: string;
      sortBy?: string;
      fields?: string[];
      include?: string[];
      from?: number;
    } = {}
  ): Promise<PaginationResult<ZohoDeskRecord>> {
    try {
      const allRecords: ZohoDeskRecord[] = [];
      let currentFrom = options.from || 0;
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
        
        const searchParams = {
          ...options,
          limit: pageSize,
          from: currentFrom
        };

        const response = await this.searchEntities(departmentId, entityType, searchParams);
        
        if (response.data && response.data.length > 0) {
          allRecords.push(...response.data);
          totalRecords += response.data.length;
          
          // Desk uses 'from' parameter for pagination
          currentFrom += pageSize;
          
          // Check if we got less than requested (indicates last page)
          hasMore = response.data.length === pageSize;
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
        nextPageToken: hasMore ? (currentFrom + pageSize).toString() : undefined,
        currentPage: Math.floor(currentFrom / pageSize) + 1,
        totalPages: Math.ceil(totalRecords / pageSize)
      };
    } catch (error) {
      throw this.handleError(error, `Failed to get all ${entityType} records from department ${departmentId}`);
    }
  }

  /**
   * Get a specific entity record by ID
   */
  async getEntity(
    departmentId: string,
    entityType: string,
    recordId: string,
    options: {
      fields?: string[];
      include?: string[];
    } = {}
  ): Promise<ZohoDeskRecord> {
    try {
      const params = new URLSearchParams();
      
      if (options.fields) params.append('fields', options.fields.join(','));
      if (options.include) params.append('include', options.include.join(','));
      
      const url = params.toString()
        ? `/departments/${departmentId}/${entityType}/${recordId}?${params.toString()}`
        : `/departments/${departmentId}/${entityType}/${recordId}`;

      const response = await this.axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get ${entityType} record ${recordId} from department ${departmentId}`);
    }
  }

  // ========== ENTITY TIMELINE ==========

  /**
   * Get timeline for a specific entity record
   */
  async getEntityTimeline(
    departmentId: string,
    entityType: string,
    recordId: string,
    options: {
      limit?: number;
      from?: number;
      include?: string[];
    } = {}
  ): Promise<ZohoApiResponse<ZohoDeskTimelineEntry[]>> {
    try {
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.from) params.append('from', options.from.toString());
      if (options.include) params.append('include', options.include.join(','));
      
      const url = params.toString()
        ? `/departments/${departmentId}/${entityType}/${recordId}/activities?${params.toString()}`
        : `/departments/${departmentId}/${entityType}/${recordId}/activities`;

      const response = await this.axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get timeline for ${entityType} record ${recordId} in department ${departmentId}`);
    }
  }

  // ========== RECORD MANAGEMENT ==========

  /**
   * Create a new entity record
   */
  async createEntity(
    departmentId: string,
    entityType: string,
    data: Partial<ZohoDeskRecord>
  ): Promise<ZohoDeskRecord> {
    try {
      const response = await this.axiosInstance.post(
        `/departments/${departmentId}/${entityType}`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to create ${entityType} record in department ${departmentId}`);
    }
  }

  /**
   * Update an existing entity record
   */
  async updateEntity(
    departmentId: string,
    entityType: string,
    recordId: string,
    data: Partial<ZohoDeskRecord>
  ): Promise<ZohoDeskRecord> {
    try {
      const response = await this.axiosInstance.patch(
        `/departments/${departmentId}/${entityType}/${recordId}`,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update ${entityType} record ${recordId} in department ${departmentId}`);
    }
  }

  /**
   * Delete an entity record
   */
  async deleteEntity(
    departmentId: string,
    entityType: string,
    recordId: string
  ): Promise<void> {
    try {
      await this.axiosInstance.delete(
        `/departments/${departmentId}/${entityType}/${recordId}`
      );
    } catch (error) {
      throw this.handleError(error, `Failed to delete ${entityType} record ${recordId} from department ${departmentId}`);
    }
  }

  // ========== UTILITY METHODS ==========

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